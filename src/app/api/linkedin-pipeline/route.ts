import { NextRequest, NextResponse } from 'next/server';
import { LinkedInContentPipeline, ContentPipelineConfig } from '../../../lib/content-pipeline-simple';
import { ContentSchedulingSystem } from '../../../lib/content-scheduling-system';
import { connectToDatabase } from '../../../lib/database';

// Initialize services
let contentPipeline: LinkedInContentPipeline | null = null;
let schedulingSystem: ContentSchedulingSystem | null = null;

function getContentPipeline() {
  if (!contentPipeline) {
    const config: ContentPipelineConfig = {
      targetCategories: ['finance', 'accounting', 'tax', 'business', 'regulation'],
      postsPerBatch: 5,
      minRelevanceScore: 0.6,
      maxPostsPerDay: 3,
      trendRefreshInterval: 6 * 60 * 60 * 1000, // 6 hours
      enableAutoApproval: false, // Requires human approval
      autoApprovalThreshold: 0.85
    };
    contentPipeline = new LinkedInContentPipeline(config);
  }
  return contentPipeline;
}

function getSchedulingSystem() {
  if (!schedulingSystem) {
    schedulingSystem = new ContentSchedulingSystem();
  }
  return schedulingSystem;
}

// POST /api/linkedin-pipeline - Run the content pipeline
export async function POST(request: NextRequest) {
  try {
    await connectToDatabase();
    
    const body = await request.json();
    const { action, config } = body;

    const pipeline = getContentPipeline();
    const scheduler = getSchedulingSystem();

    switch (action) {
      case 'generate_content':
        return await handleGenerateContent(pipeline, config);
      
      case 'schedule_approved':
        return await handleScheduleApproved(scheduler, config);
      
      case 'post_immediately':
        return await handlePostImmediately(scheduler, config);
      
      case 'run_full_pipeline':
        return await handleRunFullPipeline(pipeline, scheduler, config);
      
      case 'get_pipeline_status':
        return await handleGetPipelineStatus(pipeline, scheduler);
      
      default:
        return NextResponse.json(
          { success: false, error: `Unknown action: ${action}` },
          { status: 400 }
        );
    }

  } catch (error) {
    console.error('Error in LinkedIn pipeline:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Pipeline execution failed',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

// Handle content generation
async function handleGenerateContent(
  pipeline: LinkedInContentPipeline, 
  config?: any
): Promise<NextResponse> {
  try {
    console.log('🚀 Starting content generation...');
    
    // Fetch latest trends
    const trends = await pipeline.fetchLatestTrends();
    console.log(`📊 Fetched ${trends.length} trends`);
    
    // Generate content based on trends
    const posts = await pipeline.generateContentBatch(trends);
    console.log(`✏️ Generated ${posts.length} posts`);
    
    // Save posts to database for approval
    const savedPosts = await saveGeneratedPosts(posts);
    
    return NextResponse.json({
      success: true,
      data: {
        action: 'generate_content',
        trendsFound: trends.length,
        postsGenerated: posts.length,
        postsSaved: savedPosts.length,
        posts: savedPosts.map(post => ({
          id: post.id,
          category: post.trendData.category,
          relevanceScore: post.trendData.relevanceScore,
          status: post.status,
          createdAt: post.createdAt
        }))
      }
    });

  } catch (error) {
    console.error('Error generating content:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Content generation failed',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

// Handle scheduling of approved posts
async function handleScheduleApproved(
  scheduler: ContentSchedulingSystem,
  config?: any
): Promise<NextResponse> {
  try {
    console.log('📅 Scheduling approved posts...');
    
    // Get approved posts that aren't scheduled yet
    const approvedPosts = await getApprovedUnscheduledPosts();
    console.log(`📋 Found ${approvedPosts.length} approved posts to schedule`);
    
    if (approvedPosts.length === 0) {
      return NextResponse.json({
        success: true,
        data: {
          action: 'schedule_approved',
          message: 'No approved posts available for scheduling',
          scheduled: 0
        }
      });
    }
    
    // Auto-schedule posts based on rules
    const scheduledPosts = await scheduler.autoSchedulePosts(approvedPosts, config?.ruleId);
    console.log(`⏰ Scheduled ${scheduledPosts.length} posts`);
    
    return NextResponse.json({
      success: true,
      data: {
        action: 'schedule_approved',
        postsAvailable: approvedPosts.length,
        postsScheduled: scheduledPosts.length,
        scheduledPosts: scheduledPosts.map(sp => ({
          id: sp.id,
          postId: sp.postId,
          scheduledFor: sp.scheduledFor,
          status: sp.status
        }))
      }
    });

  } catch (error) {
    console.error('Error scheduling approved posts:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Scheduling failed',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

// Handle immediate posting of approved content
async function handlePostImmediately(
  scheduler: ContentSchedulingSystem,
  config?: any
): Promise<NextResponse> {
  try {
    console.log('🚀 Posting approved content immediately...');
    
    // Get approved posts that aren't posted yet
    const approvedPosts = await getApprovedUnscheduledPosts();
    console.log(`📋 Found ${approvedPosts.length} approved posts for immediate posting`);
    
    if (approvedPosts.length === 0) {
      return NextResponse.json({
        success: true,
        data: {
          action: 'post_immediately',
          message: 'No approved posts available for immediate posting',
          postsPublished: 0
        }
      });
    }

    // Post immediately (up to a reasonable limit to avoid spam)
    const postsToPublish = approvedPosts.slice(0, config?.maxPosts || 3);
    console.log(`🔥 Publishing ${postsToPublish.length} posts immediately...`);
    
    const publishResults = [];
    
    for (const post of postsToPublish) {
      try {
        console.log(`📤 Publishing post: ${post.id}`);
        
        // Use the scheduler's LinkedIn service to post immediately
        const result = await scheduler.publishPost({
          id: post.id,
          content: post.content,
          hashtags: post.hashtags,
          scheduledFor: new Date(), // Post now
          status: 'pending',
          postId: post.id,
          createdAt: new Date(),
          updatedAt: new Date()
        });
        
        publishResults.push({
          postId: post.id,
          success: result.success,
          message: result.success ? 'Posted successfully' : result.error,
          linkedinPostId: result.linkedinPostId
        });
        
        // Mark as published in database
        if (result.success) {
          await markPostAsPublished(post.id, result.linkedinPostId);
        }
        
      } catch (postError) {
        console.error(`Error publishing post ${post.id}:`, postError);
        publishResults.push({
          postId: post.id,
          success: false,
          message: postError instanceof Error ? postError.message : 'Unknown error'
        });
      }
    }
    
    const successCount = publishResults.filter(r => r.success).length;
    
    return NextResponse.json({
      success: true,
      data: {
        action: 'post_immediately',
        postsAvailable: approvedPosts.length,
        postsPublished: successCount,
        publishResults: publishResults
      }
    });

  } catch (error) {
    console.error('Error posting immediately:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Immediate posting failed',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

// Handle full pipeline execution
async function handleRunFullPipeline(
  pipeline: LinkedInContentPipeline,
  scheduler: ContentSchedulingSystem,
  config?: any
): Promise<NextResponse> {
  try {
    console.log('🔄 Running full LinkedIn content pipeline...');
    
    const results: any = {
      action: 'run_full_pipeline',
      steps: {},
      startTime: new Date().toISOString()
    };

    // Step 1: Generate content
    console.log('Step 1: Generating content...');
    const trends = await pipeline.fetchLatestTrends();
    const posts = await pipeline.generateContentBatch(trends);
    const savedPosts = await saveGeneratedPosts(posts);
    
    results.steps.content_generation = {
      trendsFound: trends.length,
      postsGenerated: posts.length,
      postsSaved: savedPosts.length
    };

    // Step 2: Auto-approve high-quality posts (if enabled)
    if (config?.enableAutoApproval && config?.autoApprovalThreshold) {
      console.log('Step 2: Auto-approving high-quality posts...');
      const autoApprovedCount = await autoApprovePosts(config.autoApprovalThreshold);
      results.steps.auto_approval = {
        postsAutoApproved: autoApprovedCount
      };
    }

    // Step 3: Schedule approved posts
    console.log('Step 3: Scheduling approved posts...');
    const approvedPosts = await getApprovedUnscheduledPosts();
    const scheduledPosts = await scheduler.autoSchedulePosts(approvedPosts, config?.ruleId);
    
    results.steps.scheduling = {
      approvedPosts: approvedPosts.length,
      postsScheduled: scheduledPosts.length
    };

    results.endTime = new Date().toISOString();
    results.success = true;

    console.log('✅ Full pipeline execution completed');
    
    return NextResponse.json({
      success: true,
      data: results
    });

  } catch (error) {
    console.error('Error running full pipeline:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Full pipeline execution failed',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

// Handle pipeline status request
async function handleGetPipelineStatus(
  pipeline: LinkedInContentPipeline,
  scheduler: ContentSchedulingSystem
): Promise<NextResponse> {
  try {
    // Get current pipeline statistics
    const stats = await getPipelineStatistics();
    
    // Get scheduling statistics
    const schedulingStats = await scheduler.getPostingStatistics(30);
    
    // Get upcoming scheduled posts
    const upcomingPosts = scheduler.getUpcomingPosts(10);
    
    // Get scheduling rules
    const schedulingRules = scheduler.getSchedulingRules();

    return NextResponse.json({
      success: true,
      data: {
        action: 'get_pipeline_status',
        contentStats: stats,
        schedulingStats: schedulingStats,
        upcomingPosts: upcomingPosts.map(post => ({
          id: post.id,
          postId: post.postId,
          scheduledFor: post.scheduledFor,
          status: post.status
        })),
        schedulingRules: schedulingRules.map(rule => ({
          id: rule.id,
          name: rule.name,
          enabled: rule.enabled,
          frequency: rule.frequency,
          maxPostsPerDay: rule.maxPostsPerDay
        })),
        lastUpdated: new Date().toISOString()
      }
    });

  } catch (error) {
    console.error('Error getting pipeline status:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to get pipeline status',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

// Helper function to save generated posts to database
async function saveGeneratedPosts(posts: any[]): Promise<any[]> {
  const mongoose = await import('mongoose');
  
  const GeneratedPostSchema = new mongoose.Schema({
    id: { type: String, required: true, unique: true },
    content: { type: String, required: true },
    hashtags: [String],
    trendData: {
      title: String,
      category: String,
      relevanceScore: Number,
      trendScore: Number,
      keywords: [String],
      summary: String
    },
    status: { 
      type: String, 
      enum: ['pending', 'approved', 'rejected', 'published'],
      default: 'pending'
    },
    createdAt: { type: Date, default: Date.now },
    approvedAt: Date,
    publishedAt: Date,
    scheduledFor: Date,
    rejectionReason: String,
    engagementPrediction: {
      expectedLikes: Number,
      expectedComments: Number,
      expectedShares: Number,
      confidenceScore: Number
    }
  });

  const GeneratedPost = mongoose.models.GeneratedPost || 
    mongoose.model('GeneratedPost', GeneratedPostSchema);

  const savedPosts = [];
  
  for (const post of posts) {
    try {
      const savedPost = new GeneratedPost(post);
      await savedPost.save();
      savedPosts.push(savedPost);
      console.log(`💾 Saved post ${post.id} to database`);
    } catch (error) {
      console.error(`Error saving post ${post.id}:`, error);
    }
  }
  
  return savedPosts;
}

// Helper function to get approved posts that aren't scheduled
async function getApprovedUnscheduledPosts(): Promise<any[]> {
  const mongoose = await import('mongoose');
  const GeneratedPost = mongoose.models.GeneratedPost;
  
  if (!GeneratedPost) {
    return [];
  }
  
  const posts = await GeneratedPost.find({
    status: 'approved',
    scheduledFor: { $exists: false }
  }).lean();
  
  return posts;
}

// Helper function to mark a post as published
async function markPostAsPublished(postId: string, linkedinPostId?: string): Promise<void> {
  const mongoose = await import('mongoose');
  const GeneratedPost = mongoose.models.GeneratedPost;
  
  if (!GeneratedPost) {
    console.warn('GeneratedPost model not found');
    return;
  }
  
  await GeneratedPost.updateOne(
    { _id: postId },
    { 
      status: 'published',
      publishedAt: new Date(),
      linkedinPostId: linkedinPostId,
      scheduledFor: new Date() // Mark as scheduled for "now"
    }
  );
}

// Helper function to auto-approve posts above threshold
async function autoApprovePosts(threshold: number): Promise<number> {
  const mongoose = await import('mongoose');
  const GeneratedPost = mongoose.models.GeneratedPost;
  
  if (!GeneratedPost) {
    return 0;
  }
  
  const result = await GeneratedPost.updateMany(
    {
      status: 'pending',
      'trendData.relevanceScore': { $gte: threshold }
    },
    {
      $set: {
        status: 'approved',
        approvedAt: new Date()
      }
    }
  );
  
  console.log(`✅ Auto-approved ${result.modifiedCount} posts with score >= ${threshold}`);
  return result.modifiedCount;
}

// Helper function to get pipeline statistics
async function getPipelineStatistics(): Promise<any> {
  const mongoose = await import('mongoose');
  const GeneratedPost = mongoose.models.GeneratedPost;
  
  if (!GeneratedPost) {
    return {
      totalPosts: 0,
      statusBreakdown: {},
      categoryBreakdown: {},
      averageRelevanceScore: 0
    };
  }
  
  const [statusStats, categoryStats, avgScore] = await Promise.all([
    GeneratedPost.aggregate([
      { $group: { _id: '$status', count: { $sum: 1 } } }
    ]),
    GeneratedPost.aggregate([
      { $group: { _id: '$trendData.category', count: { $sum: 1 } } }
    ]),
    GeneratedPost.aggregate([
      { $group: { _id: null, avgScore: { $avg: '$trendData.relevanceScore' } } }
    ])
  ]);
  
  const statusBreakdown = statusStats.reduce((acc: any, stat: any) => {
    acc[stat._id] = stat.count;
    return acc;
  }, {});
  
  const categoryBreakdown = categoryStats.reduce((acc: any, stat: any) => {
    acc[stat._id] = stat.count;
    return acc;
  }, {});
  
  const totalPosts = Object.values(statusBreakdown).reduce((sum: number, count: any) => sum + count, 0);
  
  return {
    totalPosts,
    statusBreakdown,
    categoryBreakdown,
    averageRelevanceScore: avgScore[0]?.avgScore || 0
  };
}

// GET /api/linkedin-pipeline - Get pipeline status
export async function GET(request: NextRequest) {
  try {
    await connectToDatabase();
    
    const pipeline = getContentPipeline();
    const scheduler = getSchedulingSystem();
    
    return await handleGetPipelineStatus(pipeline, scheduler);

  } catch (error) {
    console.error('Error getting pipeline status:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to get pipeline status',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}