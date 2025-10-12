import { NextRequest, NextResponse } from 'next/server';
import nodemailer from 'nodemailer';

export async function POST(request: NextRequest) {
  try {
    const { recipientEmail, recipientName, emailType, testContent } = await request.json();

    console.log('📧 Email Test Request:', {
      recipientEmail,
      recipientName,
      emailType,
      testContent: testContent?.substring(0, 100) + '...'
    });

    // Configure Nodemailer with Gmail SMTP
    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST || 'smtp.gmail.com',
      port: parseInt(process.env.SMTP_PORT || '587'),
      secure: false, // true for 465, false for other ports
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
      tls: {
        rejectUnauthorized: false, // Accept self-signed certificates
        ciphers: 'SSLv3'
      },
      // Additional options for Gmail compatibility
      requireTLS: true,
      connectionTimeout: 60000, // 60 seconds
      greetingTimeout: 30000, // 30 seconds
      socketTimeout: 60000, // 60 seconds
    });

    // Verify transporter configuration
    try {
      await transporter.verify();
      console.log('✅ SMTP connection verified successfully');
    } catch (verifyError) {
      console.error('❌ SMTP verification failed:', verifyError);
      // Continue anyway, as verify() can sometimes fail even when sending works
    }

    // Mock email templates based on type
    const emailTemplates = {
      'tax-update': {
        subject: `🏛️ Important Tax Law Update - ${new Date().toLocaleDateString()}`,
        template: `
          <h2>Dear ${recipientName},</h2>
          <p>We have an important tax law update for your review:</p>
          <div style="background: #f5f5f5; padding: 15px; border-radius: 8px; margin: 15px 0;">
            ${testContent || 'New tax regulations have been published that may affect your practice.'}
          </div>
          <p>Please review this update and take necessary actions.</p>
          <p>Best regards,<br>CA Law Portal Team</p>
        `
      },
      'compliance-alert': {
        subject: `⚠️ Compliance Alert - Action Required`,
        template: `
          <h2>Dear ${recipientName},</h2>
          <p>This is an important compliance alert:</p>
          <div style="background: #fff3cd; padding: 15px; border-radius: 8px; margin: 15px 0; border-left: 4px solid #ffc107;">
            ${testContent || 'New compliance requirements have been issued that require immediate attention.'}
          </div>
          <p>Please ensure compliance within the specified timeframe.</p>
          <p>Best regards,<br>CA Law Portal Team</p>
        `
      },
      'news-digest': {
        subject: `📰 Daily Legal News Digest - ${new Date().toLocaleDateString()}`,
        template: `
          <h2>Dear ${recipientName},</h2>
          <p>Here's your daily digest of important legal news:</p>
          <div style="background: #e3f2fd; padding: 15px; border-radius: 8px; margin: 15px 0;">
            ${testContent || 'Today\'s top legal news and updates compiled for CA professionals.'}
          </div>
          <p>Stay informed with the latest developments in your field.</p>
          <p>Best regards,<br>CA Law Portal Team</p>
        `
      }
    };

    const selectedTemplate = emailTemplates[emailType as keyof typeof emailTemplates] || emailTemplates['tax-update'];

    // Configure email options
    const mailOptions = {
      from: {
        name: 'CA Law Portal',
        address: process.env.FROM_EMAIL || process.env.SMTP_USER || 'noreply@localhost'
      },
      to: recipientEmail,
      subject: selectedTemplate.subject,
      html: selectedTemplate.template,
    };

    // Send actual email using Nodemailer
    console.log('📤 Sending email via Nodemailer...');
    const info = await transporter.sendMail(mailOptions);
    
    console.log('✅ Email sent successfully:', info.messageId);

    // Return success response with real delivery info
    const emailPreview = {
      to: recipientEmail,
      subject: selectedTemplate.subject,
      html: selectedTemplate.template,
      timestamp: new Date().toISOString(),
      status: 'sent'
    };

    return NextResponse.json({
      success: true,
      message: 'Real email sent successfully to your Gmail!',
      emailPreview,
      deliveryInfo: {
        service: 'Gmail SMTP via Nodemailer',
        messageId: info.messageId,
        estimatedDelivery: 'Delivered immediately',
        response: info.response
      }
    });

  } catch (error) {
    console.error('Email test error:', error);
    return NextResponse.json({
      success: false,
      error: `Failed to send test email: ${error instanceof Error ? error.message : 'Unknown error'}`
    }, { status: 500 });
  }
}