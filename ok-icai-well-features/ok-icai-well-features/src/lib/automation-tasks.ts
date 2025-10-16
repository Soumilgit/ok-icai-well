import { connectToDatabase } from '@/lib/database';
import NewsArticle from '@/models/NewsArticle';
import GeneratedContent from '@/models/GeneratedContent';
import { dailyNewsAutomation } from '@/lib/news-collector';
import { aiProcessor } from '@/lib/ai-processor';
import { notificationService } from '@/lib/notification-service';

// Automation task functions
export async function runNewsCollection() {
  console.log('🔄 Running News Collection with Advanced Scraping...');
  
  try {
    const result = await dailyNewsAutomation();
    
    return {
      task: 'news_collection',
      success: true,
      articlesCollected: result.totalArticles,
      scrapingSuccess: result.scrapingSuccess,
      method: result.scrapingSuccess ? 'Advanced Web Scraping' : 'Dummy Data Fallback',
      message: `Successfully collected ${result.totalArticles} articles`
    };
  } catch (error) {
    console.error('Error in news collection:', error);
    return {
      task: 'news_collection',
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

export async function runContentGeneration(topic: string = 'General CA Topics') {
  console.log(`🎯 Running Content Generation for topic: ${topic}`);
  
  try {
    await connectToDatabase();
    
    // Get latest articles
    const articles = await NewsArticle.find()
      .sort({ publishedAt: -1 })
      .limit(3);
    
    if (articles.length === 0) {
      // Initialize dummy data if no articles found
      const { collectAllNews } = await import('@/lib/news-collector');
      await collectAllNews();
    }
    
    // Generate content
    const generatedContent = await aiProcessor.generateContent({
      type: 'tax_article',
      newsArticles: articles,
      customPrompt: `Generate a comprehensive article about ${topic} for Chartered Accountants`,
      model: 'qwen/qwen3-32b'
    });
    
    return {
      task: 'content_generation',
      success: true,
      topic,
      contentId: generatedContent._id,
      title: generatedContent.title,
      message: `Successfully generated content for ${topic}`
    };
  } catch (error) {
    console.error('Error in content generation:', error);
    return {
      task: 'content_generation',
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

export async function runExamGeneration(topic: string = 'Corporate Law', difficulty: string = 'intermediate') {
  console.log(`📝 Running Exam Generation for topic: ${topic}, difficulty: ${difficulty}`);
  
  try {
    // Generate exam questions using existing API
    const response = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/api/content/exam`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ topic, difficulty, count: 5 })
    });
    
    const result = await response.json();
    
    return {
      task: 'exam_generation',
      success: result.success,
      topic,
      difficulty,
      questionsGenerated: result.success ? 5 : 0,
      examId: result.examContent?._id,
      message: result.success ? `Successfully generated exam questions for ${topic}` : result.error
    };
  } catch (error) {
    console.error('Error in exam generation:', error);
    return {
      task: 'exam_generation',
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

export async function runNotifications() {
  console.log('📢 Running Notification Service...');
  
  try {
    await connectToDatabase();
    
    // Get recent generated content for notifications
    const recentContent = await GeneratedContent.find()
      .sort({ createdAt: -1 })
      .limit(3);
    
    if (recentContent.length === 0) {
      return {
        task: 'notifications',
        success: true,
        notificationsSent: 0,
        message: 'No recent content found for notifications'
      };
    }
    
    // Send notifications for each content piece
    let notificationsSent = 0;
    const recipients = ['ceo@company.com', 'admin@company.com']; // Default recipients
    
    for (const content of recentContent) {
      try {
        await notificationService.sendNotification({
          type: 'content_alert',
          recipients,
          title: `New ${content.type} Available: ${content.title}`,
          message: `A new ${content.type} has been generated: "${content.title}". Check the dashboard for details.`,
          data: {
            contentId: content._id.toString(),
            contentType: content.type,
            contentTitle: content.title
          }
        });
        notificationsSent++;
      } catch (error) {
        console.error('Error sending notification for content:', content._id, error);
      }
    }
    
    return {
      task: 'notifications',
      success: true,
      notificationsSent,
      contentProcessed: recentContent.length,
      message: `Successfully sent ${notificationsSent} notifications`
    };
  } catch (error) {
    console.error('Error in notifications:', error);
    return {
      task: 'notifications',
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

export async function runFullAutomationPipeline() {
  console.log('🚀 Running Full Automation Pipeline...');
  
  const results = {
    task: 'full_pipeline',
    success: true,
    steps: [] as any[],
    totalDuration: 0,
    errors: [] as string[]
  };
  
  const startTime = Date.now();
  
  try {
    // Step 1: News Collection
    console.log('Step 1: News Collection');
    const newsResult = await runNewsCollection();
    results.steps.push(newsResult);
    if (!newsResult.success) {
      results.errors.push(`News Collection: ${newsResult.error}`);
    }
    
    // Step 2: Content Generation
    console.log('Step 2: Content Generation');
    const contentResult = await runContentGeneration('Daily CA Updates');
    results.steps.push(contentResult);
    if (!contentResult.success) {
      results.errors.push(`Content Generation: ${contentResult.error}`);
    }
    
    // Step 3: Exam Generation
    console.log('Step 3: Exam Generation');
    const examResult = await runExamGeneration('Tax Law', 'intermediate');
    results.steps.push(examResult);
    if (!examResult.success) {
      results.errors.push(`Exam Generation: ${examResult.error}`);
    }
    
    // Step 4: Audit Checklist (simplified)
    console.log('Step 4: Audit Checklist Generation');
    try {
      await connectToDatabase();
      const articles = await NewsArticle.find().sort({ publishedAt: -1 }).limit(2);
      
      const auditContent = await aiProcessor.generateContent({
        type: 'audit_checklist',
        newsArticles: articles,
        customPrompt: 'Generate a comprehensive audit checklist based on current CA regulations and news updates',
        model: 'qwen/qwen3-32b'
      });
      
      results.steps.push({
        task: 'audit_checklist',
        success: true,
        checklistId: auditContent._id,
        message: 'Successfully generated audit checklist'
      });
    } catch (error) {
      results.steps.push({
        task: 'audit_checklist',
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      results.errors.push(`Audit Checklist: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
    
    // Step 5: Notifications
    console.log('Step 5: Notifications');
    const notificationResult = await runNotifications();
    results.steps.push(notificationResult);
    if (!notificationResult.success) {
      results.errors.push(`Notifications: ${notificationResult.error}`);
    }
    
    results.totalDuration = Date.now() - startTime;
    results.success = results.errors.length === 0;
    
    console.log(`✅ Full Automation Pipeline completed in ${results.totalDuration}ms`);
    console.log(`Steps completed: ${results.steps.length}, Errors: ${results.errors.length}`);
    
    return results;
    
  } catch (error) {
    console.error('Error in full automation pipeline:', error);
    results.success = false;
    results.errors.push(`Pipeline Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    results.totalDuration = Date.now() - startTime;
    
    return results;
  }
}