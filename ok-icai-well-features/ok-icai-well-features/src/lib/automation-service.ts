import { newsCollector } from './news-collector';
import { aiProcessor } from './ai-processor';
import { notificationService } from './notification-service';
import { connectToDatabase } from './database';
import NewsArticle from '@/models/NewsArticle';
import GeneratedContent from '@/models/GeneratedContent';
import Notification from '@/models/Notification';

export interface AutomationStatus {
  isRunning: boolean;
  lastRun: Date | null;
  nextRun: Date | null;
  tasksCompleted: number;
  tasksTotal: number;
  errors: string[];
}

export interface TaskResult {
  success: boolean;
  data?: any;
  error?: string;
  timestamp: Date;
}

class AutomationService {
  private status: AutomationStatus = {
    isRunning: false,
    lastRun: null,
    nextRun: null,
    tasksCompleted: 0,
    tasksTotal: 0,
    errors: []
  };

  async runDailyAutomation(): Promise<TaskResult> {
    console.log('Starting daily automation...');
    
    try {
      this.status.isRunning = true;
      this.status.tasksCompleted = 0;
      this.status.tasksTotal = 5; // News collection, content generation, notifications, etc.
      this.status.errors = [];

      await connectToDatabase();

      // Task 1: Collect news from ANI, Economic Times, and ICAI
      console.log('Task 1: Collecting news...');
      const newsResults = await this.collectDailyNews();
      this.status.tasksCompleted++;

      // Task 2: Generate content based on collected news
      console.log('Task 2: Generating content...');
      const contentResults = await this.generateDailyContent(newsResults.data);
      this.status.tasksCompleted++;

      // Task 3: Create audit checklists
      console.log('Task 3: Creating audit checklists...');
      const auditResults = await this.generateAuditChecklists(newsResults.data);
      this.status.tasksCompleted++;

      // Task 4: Generate exam questions
      console.log('Task 4: Generating exam questions...');
      const examResults = await this.generateExamQuestions(newsResults.data);
      this.status.tasksCompleted++;

      // Task 5: Send notifications to users and CEOs
      console.log('Task 5: Sending notifications...');
      const notificationResults = await this.sendDailyNotifications({
        news: newsResults.data,
        content: contentResults.data,
        audit: auditResults.data,
        exam: examResults.data
      });
      this.status.tasksCompleted++;

      this.status.isRunning = false;
      this.status.lastRun = new Date();
      this.status.nextRun = new Date(Date.now() + 24 * 60 * 60 * 1000); // Next day

      console.log('Daily automation completed successfully');
      
      return {
        success: true,
        data: {
          news: newsResults.data,
          content: contentResults.data,
          audit: auditResults.data,
          exam: examResults.data,
          notifications: notificationResults.data
        },
        timestamp: new Date()
      };

    } catch (error) {
      console.error('Daily automation failed:', error);
      this.status.isRunning = false;
      this.status.errors.push(error instanceof Error ? error.message : 'Unknown error');
      
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date()
      };
    }
  }

  private async collectDailyNews(): Promise<TaskResult> {
    try {
      const sources = [
        { name: 'Economic Times', category: 'tax-reforms', keywords: ['tax', 'GST', 'CA', 'accounting', 'audit'] },
        { name: 'ANI', category: 'regulatory-updates', keywords: ['ICAI', 'chartered accountant', 'compliance', 'regulation'] },
        { name: 'ICAI', category: 'professional-updates', keywords: ['ICAI', 'professional standards', 'ethics', 'guidelines'] }
      ];

      const collectedNews = [];

      for (const source of sources) {
        try {
          // Collect one news item from each source
          const newsItems = await newsCollector.collectNews(source.name, source.keywords, 1);
          if (newsItems.length > 0) {
            collectedNews.push(...newsItems);
          }
        } catch (error) {
          console.error(`Failed to collect news from ${source.name}:`, error);
          this.status.errors.push(`News collection failed for ${source.name}`);
        }
      }

      // Save to database
      if (collectedNews.length > 0) {
        await NewsArticle.insertMany(collectedNews);
      }

      return {
        success: true,
        data: collectedNews,
        timestamp: new Date()
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'News collection failed',
        timestamp: new Date()
      };
    }
  }

  private async generateDailyContent(newsArticles: any[]): Promise<TaskResult> {
    try {
      const generatedContent = [];

      for (const article of newsArticles) {
        // Generate tax article
        const taxArticle = await aiProcessor.generateTaxArticle(article);
        if (taxArticle) {
          const content = new GeneratedContent({
            title: `Tax Analysis: ${article.title}`,
            type: 'tax-article',
            content: taxArticle,
            sourceArticle: article._id,
            status: 'generated',
            metadata: {
              source: article.source,
              category: article.category,
              keywords: article.tags
            }
          });
          await content.save();
          generatedContent.push(content);
        }

        // Generate SEO content
        const seoContent = await aiProcessor.generateSEOContent(article);
        if (seoContent) {
          const content = new GeneratedContent({
            title: `SEO Content: ${article.title}`,
            type: 'seo-content',
            content: seoContent,
            sourceArticle: article._id,
            status: 'generated',
            metadata: {
              source: article.source,
              category: article.category,
              keywords: article.tags
            }
          });
          await content.save();
          generatedContent.push(content);
        }

        // Generate compliance guide
        const complianceGuide = await aiProcessor.generateComplianceGuide(article);
        if (complianceGuide) {
          const content = new GeneratedContent({
            title: `Compliance Guide: ${article.title}`,
            type: 'compliance-guide',
            content: complianceGuide,
            sourceArticle: article._id,
            status: 'generated',
            metadata: {
              source: article.source,
              category: article.category,
              keywords: article.tags
            }
          });
          await content.save();
          generatedContent.push(content);
        }
      }

      return {
        success: true,
        data: generatedContent,
        timestamp: new Date()
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Content generation failed',
        timestamp: new Date()
      };
    }
  }

  private async generateAuditChecklists(newsArticles: any[]): Promise<TaskResult> {
    try {
      const auditChecklists = [];

      for (const article of newsArticles) {
        const checklist = await aiProcessor.generateAuditChecklist(article);
        if (checklist) {
          const content = new GeneratedContent({
            title: `Audit Checklist: ${article.title}`,
            type: 'audit-checklist',
            content: checklist,
            sourceArticle: article._id,
            status: 'generated',
            metadata: {
              source: article.source,
              category: article.category,
              keywords: article.tags,
              year: new Date().getFullYear()
            }
          });
          await content.save();
          auditChecklists.push(content);
        }
      }

      return {
        success: true,
        data: auditChecklists,
        timestamp: new Date()
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Audit checklist generation failed',
        timestamp: new Date()
      };
    }
  }

  private async generateExamQuestions(newsArticles: any[]): Promise<TaskResult> {
    try {
      const examQuestions = [];

      for (const article of newsArticles) {
        const questions = await aiProcessor.generateExamQuestions(article);
        if (questions) {
          const content = new GeneratedContent({
            title: `Exam Questions: ${article.title}`,
            type: 'exam-questions',
            content: questions,
            sourceArticle: article._id,
            status: 'generated',
            metadata: {
              source: article.source,
              category: article.category,
              keywords: article.tags,
              year: new Date().getFullYear(),
              difficulty: 'intermediate'
            }
          });
          await content.save();
          examQuestions.push(content);
        }
      }

      return {
        success: true,
        data: examQuestions,
        timestamp: new Date()
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Exam question generation failed',
        timestamp: new Date()
      };
    }
  }

  private async sendDailyNotifications(data: any): Promise<TaskResult> {
    try {
      const notifications = [];

      // Send daily update to all users
      const userNotification = await notificationService.sendDailyUpdate({
        news: data.news,
        content: data.content,
        audit: data.audit,
        exam: data.exam
      });
      notifications.push(userNotification);

      // Send CEO notifications for important updates
      const ceoNotification = await notificationService.sendCEONotification({
        news: data.news,
        type: 'daily-summary'
      });
      notifications.push(ceoNotification);

      // Save notifications to database
      for (const notification of notifications) {
        const notificationDoc = new Notification({
          title: notification.subject,
          message: notification.content,
          type: notification.type,
          recipients: notification.recipients,
          status: 'sent',
          sentAt: new Date()
        });
        await notificationDoc.save();
      }

      return {
        success: true,
        data: notifications,
        timestamp: new Date()
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Notification sending failed',
        timestamp: new Date()
      };
    }
  }

  async getAutomationStatus(): Promise<AutomationStatus> {
    return this.status;
  }

  async runManualTask(taskName: string, params?: any): Promise<TaskResult> {
    console.log(`Running manual task: ${taskName}`);
    
    try {
      await connectToDatabase();
      
      switch (taskName) {
        case 'collect-news':
          return await this.collectDailyNews();
        case 'generate-content':
          const recentNews = await NewsArticle.find().sort({ publishedAt: -1 }).limit(5);
          return await this.generateDailyContent(recentNews);
        case 'generate-audit':
          const newsForAudit = await NewsArticle.find().sort({ publishedAt: -1 }).limit(3);
          return await this.generateAuditChecklists(newsForAudit);
        case 'generate-exam':
          const newsForExam = await NewsArticle.find().sort({ publishedAt: -1 }).limit(3);
          return await this.generateExamQuestions(newsForExam);
        case 'send-notifications':
          return await this.sendDailyNotifications(params || {});
        default:
          throw new Error(`Unknown task: ${taskName}`);
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Task execution failed',
        timestamp: new Date()
      };
    }
  }

  async generateLoopholeAnalysis(newsArticles: any[]): Promise<TaskResult> {
    try {
      const analyses = [];

      for (const article of newsArticles) {
        const analysis = await aiProcessor.generateLoopholeAnalysis(article);
        if (analysis) {
          const content = new GeneratedContent({
            title: `Tax Loophole Analysis: ${article.title}`,
            type: 'loophole-analysis',
            content: analysis,
            sourceArticle: article._id,
            status: 'generated',
            metadata: {
              source: article.source,
              category: article.category,
              keywords: article.tags,
              analysisType: 'tax-loopholes',
              year: new Date().getFullYear()
            }
          });
          await content.save();
          analyses.push(content);
        }
      }

      return {
        success: true,
        data: analyses,
        timestamp: new Date()
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Loophole analysis generation failed',
        timestamp: new Date()
      };
    }
  }
}

export const automationService = new AutomationService();