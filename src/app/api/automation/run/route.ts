import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/database';
import NewsArticle from '@/models/NewsArticle';
import GeneratedContent from '@/models/GeneratedContent';
import Notification from '@/models/Notification';
import { 
  runNewsCollection, 
  runContentGeneration, 
  runExamGeneration, 
  runNotifications, 
  runFullAutomationPipeline 
} from '@/lib/automation-tasks';
import { infrastructureManager } from '@/lib/infrastructure-manager';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { task, topic, difficulty } = body;
    
    // Initialize infrastructure if needed
    if (!infrastructureManager.isInitialized) {
      await infrastructureManager.initialize();
    }
    
    // Track automation task start
    await infrastructureManager.publishEvent('user-events', {
      type: 'automation-started',
      data: {
        task,
        topic: topic || null,
        difficulty: difficulty || null,
        timestamp: new Date().toISOString(),
      }
    });
    
    let result;
    
    switch (task) {
      case 'news_collection':
        result = await runNewsCollection();
        break;
        
      case 'content_generation':
        result = await runContentGeneration(topic);
        break;
        
      case 'notifications':
        result = await runNotifications();
        break;
        
      case 'exam_generation':
        result = await runExamGeneration(topic, difficulty);
        break;
        
      case 'full_pipeline':
        result = await runFullAutomationPipeline();
        break;
        
      default:
        return NextResponse.json(
          { success: false, error: 'Invalid task specified' },
          { status: 400 }
        );
    }
    
    // Track automation task completion
    await infrastructureManager.publishEvent('user-events', {
      type: 'automation-completed',
      data: {
        task,
        topic: topic || null,
        difficulty: difficulty || null,
        succeeded: true,
        result: result || {},
        timestamp: new Date().toISOString(),
      }
    });
    
    return NextResponse.json({
      success: true,
      ...result
    });
    
  } catch (error) {
    console.error('Error running automation task:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to run automation task',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    await connectToDatabase();
    
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const status = {
      newsCollection: {
        articlesToday: await NewsArticle.countDocuments({ publishedAt: { $gte: today } }),
        totalArticles: await NewsArticle.countDocuments(),
        lastCollection: await NewsArticle.findOne().sort({ createdAt: -1 }).select('createdAt')
      },
      contentGeneration: {
        contentToday: await GeneratedContent.countDocuments({ createdAt: { $gte: today } }),
        totalContent: await GeneratedContent.countDocuments(),
        byType: await GeneratedContent.aggregate([
          { $group: { _id: '$type', count: { $sum: 1 } } }
        ])
      },
      notifications: {
        pending: await Notification.countDocuments({ status: 'pending' }),
        sent: await Notification.countDocuments({ status: 'sent' }),
        failed: await Notification.countDocuments({ status: 'failed' })
      }
    };
    
    return NextResponse.json({
      success: true,
      status
    });
    
  } catch (error) {
    console.error('Error getting automation status:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to get automation status',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
