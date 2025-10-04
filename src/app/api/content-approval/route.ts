import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '../../../lib/database';
import { GeneratedPost } from '../../../lib/linkedin-content-pipeline';
import { ScheduledPost } from '../../../lib/content-scheduling-system';

// MongoDB models
async function getGeneratedPostModel() {
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

  return mongoose.models.GeneratedPost || mongoose.model('GeneratedPost', GeneratedPostSchema);
}

async function getScheduledPostModel() {
  const mongoose = await import('mongoose');
  
  const ScheduledPostSchema = new mongoose.Schema({
    id: { type: String, required: true, unique: true },
    postId: { type: String, required: true },
    scheduledFor: { type: Date, required: true },
    status: { 
      type: String, 
      enum: ['scheduled', 'posted', 'failed', 'cancelled'],
      default: 'scheduled'
    },
    attempts: { type: Number, default: 0 },
    lastAttempt: Date,
    error: String,
    createdAt: { type: Date, default: Date.now },
    postedAt: Date
  });

  return mongoose.models.ScheduledPost || mongoose.model('ScheduledPost', ScheduledPostSchema);
}

// GET /api/content-approval - Get posts for approval
export async function GET(request: NextRequest) {
  try {
    await connectToDatabase();
    const GeneratedPost = await getGeneratedPostModel();
    const ScheduledPost = await getScheduledPostModel();
    
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status') || 'pending';
    const limit = parseInt(searchParams.get('limit') || '10');
    const category = searchParams.get('category');
    const sortBy = searchParams.get('sortBy') || 'createdAt';
    const sortOrder = searchParams.get('sortOrder') === 'asc' ? 1 : -1;

    // Build query
    const query: any = {};
    if (status !== 'all') {
      query.status = status;
    }
    if (category && category !== 'all') {
      query['trendData.category'] = category;
    }

    // Get posts with pagination
    const posts = await GeneratedPost
      .find(query)
      .sort({ [sortBy]: sortOrder })
      .limit(limit)
      .lean();

    // Get scheduling information for approved posts
    const postIds = posts.map((post: any) => post.id);
    const scheduledPosts = await ScheduledPost
      .find({ postId: { $in: postIds } })
      .lean();

    // Create a map for quick lookup
    const schedulingMap = new Map();
    scheduledPosts.forEach((sp: any) => {
      schedulingMap.set(sp.postId, sp);
    });

    // Combine post data with scheduling info
    const enrichedPosts = posts.map((post: any) => {
      const scheduling = schedulingMap.get(post.id);
      return {
        ...post,
        scheduling: scheduling || null
      };
    });

    // Get summary statistics
    const stats = await GeneratedPost.aggregate([
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 }
        }
      }
    ]);

    const statusCounts = stats.reduce((acc: any, stat: any) => {
      acc[stat._id] = stat.count;
      return acc;
    }, {});

    return NextResponse.json({
      success: true,
      data: {
        posts: enrichedPosts,
        stats: {
          total: posts.length,
          statusCounts,
          categories: await GeneratedPost.distinct('trendData.category')
        }
      }
    });

  } catch (error) {
    console.error('Error fetching posts for approval:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to fetch posts',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

// POST /api/content-approval - Approve/reject posts
export async function POST(request: NextRequest) {
  try {
    await connectToDatabase();
    const GeneratedPost = await getGeneratedPostModel();
    
    const body = await request.json();
    const { action, postId, postIds, rejectionReason, scheduledFor } = body;

    if (!action || (!postId && !postIds)) {
      return NextResponse.json(
        { success: false, error: 'Missing required parameters' },
        { status: 400 }
      );
    }

    const targetPostIds = postIds || [postId];
    const results = [];

    for (const targetId of targetPostIds) {
      try {
        const post = await GeneratedPost.findOne({ id: targetId });
        if (!post) {
          results.push({ postId: targetId, success: false, error: 'Post not found' });
          continue;
        }

        if (post.status !== 'pending') {
          results.push({ 
            postId: targetId, 
            success: false, 
            error: `Post is already ${post.status}` 
          });
          continue;
        }

        switch (action) {
          case 'approve':
            post.status = 'approved';
            post.approvedAt = new Date();
            if (scheduledFor) {
              post.scheduledFor = new Date(scheduledFor);
            }
            break;

          case 'reject':
            post.status = 'rejected';
            post.rejectionReason = rejectionReason || 'No reason provided';
            break;

          case 'schedule':
            if (!scheduledFor) {
              results.push({ 
                postId: targetId, 
                success: false, 
                error: 'scheduledFor is required for scheduling' 
              });
              continue;
            }
            post.status = 'approved';
            post.approvedAt = new Date();
            post.scheduledFor = new Date(scheduledFor);
            break;

          default:
            results.push({ 
              postId: targetId, 
              success: false, 
              error: `Unknown action: ${action}` 
            });
            continue;
        }

        await post.save();
        
        results.push({ 
          postId: targetId, 
          success: true, 
          newStatus: post.status,
          scheduledFor: post.scheduledFor
        });

        console.log(`✅ Post ${targetId} ${action}ed successfully`);

      } catch (error) {
        console.error(`Error processing post ${targetId}:`, error);
        results.push({ 
          postId: targetId, 
          success: false, 
          error: error instanceof Error ? error.message : 'Processing error'
        });
      }
    }

    return NextResponse.json({
      success: true,
      data: {
        results,
        processed: results.length,
        successful: results.filter(r => r.success).length
      }
    });

  } catch (error) {
    console.error('Error processing approval action:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to process approval action',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

// PUT /api/content-approval - Update post content
export async function PUT(request: NextRequest) {
  try {
    await connectToDatabase();
    const GeneratedPost = await getGeneratedPostModel();
    
    const body = await request.json();
    const { postId, content, hashtags, scheduledFor } = body;

    if (!postId) {
      return NextResponse.json(
        { success: false, error: 'Missing postId' },
        { status: 400 }
      );
    }

    const post = await GeneratedPost.findOne({ id: postId });
    if (!post) {
      return NextResponse.json(
        { success: false, error: 'Post not found' },
        { status: 404 }
      );
    }

    // Update fields if provided
    if (content !== undefined) {
      post.content = content;
    }
    if (hashtags !== undefined) {
      post.hashtags = hashtags;
    }
    if (scheduledFor !== undefined) {
      post.scheduledFor = scheduledFor ? new Date(scheduledFor) : null;
    }

    // Reset to pending if it was rejected and content was updated
    if (post.status === 'rejected' && content !== undefined) {
      post.status = 'pending';
      post.rejectionReason = undefined;
    }

    await post.save();

    console.log(`✅ Post ${postId} updated successfully`);

    return NextResponse.json({
      success: true,
      data: {
        postId: post.id,
        status: post.status,
        updatedAt: new Date().toISOString()
      }
    });

  } catch (error) {
    console.error('Error updating post:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to update post',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

// DELETE /api/content-approval - Delete post
export async function DELETE(request: NextRequest) {
  try {
    await connectToDatabase();
    const GeneratedPost = await getGeneratedPostModel();
    const ScheduledPost = await getScheduledPostModel();
    
    const { searchParams } = new URL(request.url);
    const postId = searchParams.get('postId');

    if (!postId) {
      return NextResponse.json(
        { success: false, error: 'Missing postId' },
        { status: 400 }
      );
    }

    const post = await GeneratedPost.findOne({ id: postId });
    if (!post) {
      return NextResponse.json(
        { success: false, error: 'Post not found' },
        { status: 404 }
      );
    }

    // Don't allow deletion of published posts
    if (post.status === 'published') {
      return NextResponse.json(
        { success: false, error: 'Cannot delete published posts' },
        { status: 400 }
      );
    }

    // Delete associated scheduled post if any
    await ScheduledPost.deleteOne({ postId });

    // Delete the post
    await GeneratedPost.deleteOne({ id: postId });

    console.log(`🗑️ Post ${postId} deleted successfully`);

    return NextResponse.json({
      success: true,
      data: {
        postId,
        deletedAt: new Date().toISOString()
      }
    });

  } catch (error) {
    console.error('Error deleting post:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to delete post',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}