import nodemailer from 'nodemailer';
import { INotification } from '@/models/Notification';
import { connectToDatabase } from '@/lib/database';
import Notification from '@/models/Notification';

// Email configuration
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || 'smtp.gmail.com',
  port: parseInt(process.env.SMTP_PORT || '587'),
  secure: false,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

export interface NotificationRecipient {
  email: string;
  name: string;
  role: 'ceo' | 'ca' | 'content_writer' | 'seo_specialist';
}

export interface NotificationData {
  type: 'daily_update' | 'breaking_news' | 'compliance_alert' | 'exam_update';
  title: string;
  message: string;
  content: string;
  recipients: NotificationRecipient[];
  priority?: 'high' | 'medium' | 'low';
  metadata?: {
    sourceNewsIds?: string[];
    generatedContentIds?: string[];
    attachments?: string[];
  };
}

export class NotificationService {
  async sendNotification(data: NotificationData): Promise<string> {
    try {
      // Save notification to database
      const notification = await this.saveNotification(data);
      
      // Send emails to all recipients
      const results = await Promise.allSettled(
        data.recipients.map(recipient => 
          this.sendEmail(recipient, data, notification._id.toString())
        )
      );
      
      // Update notification status based on results
      const failedCount = results.filter(result => result.status === 'rejected').length;
      const status = failedCount === 0 ? 'sent' : failedCount === data.recipients.length ? 'failed' : 'sent';
      
      await Notification.findByIdAndUpdate(notification._id, {
        status,
        sentAt: new Date()
      });
      
      console.log(`Notification ${notification._id} sent with status: ${status}`);
      return notification._id.toString();
      
    } catch (error) {
      console.error('Error sending notification:', error);
      throw error;
    }
  }

  private async saveNotification(data: NotificationData): Promise<INotification> {
    await connectToDatabase();
    
    const notification = new Notification({
      type: data.type,
      title: data.title,
      message: data.message,
      content: data.content,
      recipients: data.recipients,
      priority: data.priority || 'medium',
      status: 'pending',
      metadata: data.metadata || {}
    });
    
    return await notification.save();
  }

  private async sendEmail(
    recipient: NotificationRecipient, 
    data: NotificationData, 
    notificationId: string
  ): Promise<void> {
    try {
      const emailContent = this.generateEmailContent(recipient, data);
      
      const mailOptions = {
        from: `CA Law Portal <${process.env.SMTP_USER}>`,
        to: recipient.email,
        subject: `[CA Law Portal] ${data.title}`,
        html: emailContent,
        text: this.generatePlainTextContent(recipient, data)
      };
      
      await transporter.sendMail(mailOptions);
      console.log(`Email sent successfully to ${recipient.email}`);
      
    } catch (error) {
      console.error(`Error sending email to ${recipient.email}:`, error);
      throw error;
    }
  }

  private generateEmailContent(recipient: NotificationRecipient, data: NotificationData): string {
    const roleSpecificGreeting = this.getRoleSpecificGreeting(recipient.role);
    const roleSpecificContent = this.getRoleSpecificContent(recipient.role, data);
    
    return `
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>${data.title}</title>
        <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: #1a365d; color: white; padding: 20px; text-align: center; }
            .content { padding: 20px; background: #f8f9fa; }
            .footer { padding: 20px; text-align: center; font-size: 12px; color: #666; }
            .priority-high { border-left: 4px solid #e53e3e; }
            .priority-medium { border-left: 4px solid #d69e2e; }
            .priority-low { border-left: 4px solid #38a169; }
            .cta-button { display: inline-block; background: #3182ce; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; margin: 10px 0; }
        </style>
    </head>
    <body>
        <div class="container">
            <div class="header">
                <h1>CA Law Portal</h1>
                <h2>${data.title}</h2>
            </div>
            <div class="content priority-${data.priority || 'medium'}">
                <p>Dear ${recipient.name},</p>
                <p>${roleSpecificGreeting}</p>
                <div>${data.message}</div>
                ${roleSpecificContent}
                <div style="margin-top: 30px;">
                    <a href="${process.env.NEXT_PUBLIC_APP_URL}/dashboard" class="cta-button">
                        View Full Dashboard
                    </a>
                </div>
            </div>
            <div class="footer">
                <p>This is an automated notification from CA Law Portal.</p>
                <p>Notification ID: ${notificationId}</p>
                <p>Generated on: ${new Date().toLocaleString()}</p>
            </div>
        </div>
    </body>
    </html>
    `;
  }

  private generatePlainTextContent(recipient: NotificationRecipient, data: NotificationData): string {
    const roleSpecificGreeting = this.getRoleSpecificGreeting(recipient.role);
    
    return `
CA Law Portal Notification

${data.title}

Dear ${recipient.name},

${roleSpecificGreeting}

${data.message}

${data.content}

Visit: ${process.env.NEXT_PUBLIC_APP_URL}/dashboard

---
This is an automated notification from CA Law Portal.
Generated on: ${new Date().toLocaleString()}
    `.trim();
  }

  private getRoleSpecificGreeting(role: string): string {
    const greetings = {
      ceo: 'Here are the latest updates that may impact your business operations and compliance requirements.',
      ca: 'Here are the latest regulatory updates and professional developments relevant to your practice.',
      content_writer: 'Here are the latest news and updates to help you create relevant content for CA audiences.',
      seo_specialist: 'Here are the latest updates to help you optimize content and improve search rankings for CA-related topics.'
    };
    
    return greetings[role as keyof typeof greetings] || 'Here are the latest updates from the CA Law Portal.';
  }

  private getRoleSpecificContent(role: string, data: NotificationData): string {
    const roleContent = {
      ceo: `
        <div style="background: #e6f3ff; padding: 15px; margin: 15px 0; border-radius: 5px;">
          <h3>CEO Action Items:</h3>
          <ul>
            <li>Review compliance implications for your organization</li>
            <li>Assess impact on business operations</li>
            <li>Update internal policies if necessary</li>
            <li>Communicate changes to relevant teams</li>
          </ul>
        </div>
      `,
      ca: `
        <div style="background: #f0fff4; padding: 15px; margin: 15px 0; border-radius: 5px;">
          <h3>CA Practice Updates:</h3>
          <ul>
            <li>Review new compliance requirements</li>
            <li>Update client advisory materials</li>
            <li>Consider continuing education opportunities</li>
            <li>Assess impact on existing client work</li>
          </ul>
        </div>
      `,
      content_writer: `
        <div style="background: #fff5f5; padding: 15px; margin: 15px 0; border-radius: 5px;">
          <h3>Content Opportunities:</h3>
          <ul>
            <li>Create educational content around new regulations</li>
            <li>Develop case studies and examples</li>
            <li>Write explanatory articles for client education</li>
            <li>Update existing content with latest information</li>
          </ul>
        </div>
      `,
      seo_specialist: `
        <div style="background: #f7fafc; padding: 15px; margin: 15px 0; border-radius: 5px;">
          <h3>SEO Opportunities:</h3>
          <ul>
            <li>Target new keyword opportunities</li>
            <li>Update existing content for better rankings</li>
            <li>Create topic clusters around new regulations</li>
            <li>Optimize for featured snippets and voice search</li>
          </ul>
        </div>
      `
    };
    
    return roleContent[role as keyof typeof roleContent] || '';
  }

  async sendDailyUpdate(data: { news: any[], content: any[], audit: any[], exam: any[] }): Promise<any> {
    const recipients: NotificationRecipient[] = [
      { email: 'admincontrols@aminutemantechnologies.com', name: 'Admin', role: 'ceo' },
      // Add more recipients as needed
    ];

    const notificationData: NotificationData = {
      type: 'daily_update',
      title: `Daily CA Law Update - Latest 2025 Updates - ${new Date().toLocaleDateString()}`,
      message: `Today's automated update includes ${data.news.length} news articles, ${data.content.length} generated content pieces, ${data.audit.length} audit checklists, and ${data.exam.length} exam questions.`,
      content: this.formatComprehensiveDailyUpdate(data),
      recipients,
      priority: 'medium',
      metadata: {
        sourceNewsIds: data.news.map(article => article._id || article.id),
        generatedContentIds: data.content.map(content => content._id || content.id)
      }
    };

    return {
      success: true,
      data: await this.sendNotification(notificationData),
      recipients: recipients.map(r => r.email),
      type: 'daily-update',
      subject: notificationData.title,
      content: notificationData.content
    };
  }

  async sendCEONotification(data: { news: any[], type: string }): Promise<any> {
    const ceoRecipients: NotificationRecipient[] = [
      { email: 'admincontrols@aminutemantechnologies.com', name: 'CEO/Admin', role: 'ceo' }
    ];

    const notificationData: NotificationData = {
      type: 'daily_update',
      title: `CEO Alert: Important CA Law Updates - ${new Date().toLocaleDateString()}`,
      message: `Critical updates for business leaders: ${data.news.length} important regulatory changes that may impact your organization.`,
      content: this.formatCEONotificationContent(data.news),
      recipients: ceoRecipients,
      priority: 'high',
      metadata: {
        sourceNewsIds: data.news.map(article => article._id || article.id)
      }
    };

    return {
      success: true,
      data: await this.sendNotification(notificationData),
      recipients: ceoRecipients.map(r => r.email),
      type: 'ceo-alert',
      subject: notificationData.title,
      content: notificationData.content
    };
  }

  private formatComprehensiveDailyUpdate(data: { news: any[], content: any[], audit: any[], exam: any[] }): string {
    let content = `
    <h1>Daily CA Law & Tax Update - 2025 Focus</h1>
    
    <h2>Top 3 Latest News from ICAI, ANI & Economic Times (2025 Updates):</h2>
    `;

    // Format news articles
    data.news.slice(0, 3).forEach((article, index) => {
      content += `
      <h3>${index + 1}. ${article.title}</h3>
      <p><strong>Source:</strong> ${article.source}<br>
      <strong>Date:</strong> ${new Date(article.publishedAt).toLocaleDateString()}<br>
      <strong>Summary:</strong> ${article.summary || article.content.substring(0, 200)}...<br>
      <strong>Impact on CA Practice:</strong> ${article.impact === 'high' ? 'Critical impact requiring immediate attention' : 'Moderate impact for practice consideration'}</p>
      `;
    });

    content += '<hr><h2>Generated Content for CA Practice (2025 Updates):</h2>';

    // Format generated content
    data.content.forEach(item => {
      content += `
      <h3>${item.title}</h3>
      <p><strong>Type:</strong> ${item.type.replace('_', ' ').toUpperCase()}</p>
      <div>${item.content.substring(0, 500)}...</div>
      <hr>
      `;
    });

    // Format audit checklists
    if (data.audit.length > 0) {
      content += '<h2>Updated Audit Checklist for 2025</h2>';
      data.audit.forEach(item => {
        content += `<div>${item.content.substring(0, 300)}...</div>`;
      });
    }

    // Format exam questions
    if (data.exam.length > 0) {
      content += '<h2>Current Exam Questions (2025 Regulations)</h2>';
      data.exam.forEach(item => {
        content += `<div>${item.content.substring(0, 400)}...</div>`;
      });
    }

    content += `
    <hr>
    <p><em>This automated update delivers the latest 2025 regulatory changes and practice-ready content, ensuring your clients are impressed with current, relevant information that keeps you ahead of competitors.</em></p>
    `;

    return content;
  }

  private formatCEONotificationContent(newsArticles: any[]): string {
    let content = `
    <h1>CEO Alert: Critical Business Updates</h1>
    <p>The following regulatory changes may impact your business operations and require immediate attention:</p>
    <ul>
    `;

    newsArticles.forEach(article => {
      content += `
      <li>
        <strong>${article.title}</strong><br>
        <em>Source: ${article.source} | Impact Level: ${article.impact.toUpperCase()}</em><br>
        ${article.summary || article.content.substring(0, 150)}...
        <br><br>
      </li>
      `;
    });

    content += `
    </ul>
    <div style="background: #fff3cd; padding: 15px; border-radius: 5px; margin: 20px 0;">
      <h3>Recommended Actions:</h3>
      <ul>
        <li>Review impact on your organization's compliance requirements</li>
        <li>Consult with your CA/legal team for specific guidance</li>
        <li>Update internal policies and procedures as needed</li>
        <li>Communicate changes to relevant stakeholders</li>
      </ul>
    </div>
    `;

    return content;
  }

  private formatDailyUpdateContent(newsArticles: any[], generatedContent: any[]): string {
    let content = '<h3>Latest News Articles:</h3><ul>';
    
    newsArticles.slice(0, 5).forEach(article => {
      content += `<li><strong>${article.title}</strong> - ${article.source} (${article.category})</li>`;
    });
    
    content += '</ul><h3>Generated Content:</h3><ul>';
    
    generatedContent.forEach(content_item => {
      content += `<li><strong>${content_item.title}</strong> - ${content_item.type}</li>`;
    });
    
    content += '</ul>';
    
    return content;
  }

  async getNotificationStats(): Promise<any> {
    await connectToDatabase();
    
    const stats = await Notification.aggregate([
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 }
        }
      }
    ]);
    
    const totalNotifications = await Notification.countDocuments();
    const recentNotifications = await Notification.find()
      .sort({ createdAt: -1 })
      .limit(10);
    
    return {
      totalNotifications,
      statusBreakdown: stats,
      recentNotifications
    };
  }
}

// Singleton instance
export const notificationService = new NotificationService();
