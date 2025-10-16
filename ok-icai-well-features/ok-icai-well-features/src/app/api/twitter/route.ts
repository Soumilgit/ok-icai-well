import { NextRequest, NextResponse } from 'next/server';
import { TwitterService, TwitterPostRequest } from '@/lib/twitter-service';
import { RAGCacheService } from '@/lib/rag-cache';

export async function POST(request: NextRequest) {
  try {
    const { content, images, scheduledFor, userId, topic, platform = 'twitter' } = await request.json();

    if (!content) {
      return NextResponse.json(
        { success: false, error: 'Content is required' },
        { status: 400 }
      );
    }

    // Initialize Twitter service (in production, get credentials from env)
    const twitterService = new TwitterService({
      apiKey: process.env.TWITTER_API_KEY || '',
      apiSecret: process.env.TWITTER_API_SECRET || '',
      accessToken: process.env.TWITTER_ACCESS_TOKEN || '',
      accessTokenSecret: process.env.TWITTER_ACCESS_TOKEN_SECRET || '',
      bearerToken: process.env.TWITTER_BEARER_TOKEN || ''
    });

    // Get RAG cache service
    const ragCache = RAGCacheService.getInstance();

    let finalContent = content;

    // If userId is provided, apply bias based on user profile
    if (userId && topic) {
      try {
        const biasedContent = ragCache.generateBiasedContent(userId, topic, platform);
        finalContent = biasedContent.content;
      } catch (error) {
        console.warn('Could not apply user bias:', error);
        // Continue with original content if bias fails
      }
    }

    // Format content for Twitter
    finalContent = TwitterService.formatForTwitter(finalContent);

    const postRequest: TwitterPostRequest = {
      content: finalContent,
      images,
      scheduledFor,
      checkCompliance: true // Always check ICAI compliance
    };

    let result;
    if (scheduledFor) {
      result = await twitterService.schedulePost(postRequest);
    } else {
      result = await twitterService.createPost(postRequest);
    }

    // Store the content in user's generated content history
    if (userId && result.success) {
      const profile = ragCache.getUserProfile(userId);
      if (profile && result.postId) {
        profile.generatedContent.push({
          postId: result.postId,
          content: finalContent,
          voice: profile.preferences.primaryVoice,
          createdAt: new Date().toISOString()
        });
      }
    }

    return NextResponse.json(result);

  } catch (error) {
    console.error('Twitter API error:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Internal server error' 
      },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const content = searchParams.get('content');

    if (!content) {
      return NextResponse.json(
        { error: 'Content parameter is required' },
        { status: 400 }
      );
    }

    // Create thread from long content
    const thread = TwitterService.createThread(content);
    
    return NextResponse.json({
      success: true,
      thread,
      threadCount: thread.length
    });

  } catch (error) {
    console.error('Thread creation error:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Internal server error' 
      },
      { status: 500 }
    );
  }
}