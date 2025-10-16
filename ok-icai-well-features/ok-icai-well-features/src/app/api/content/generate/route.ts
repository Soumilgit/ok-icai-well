import { NextRequest, NextResponse } from 'next/server';
import { aiProcessor } from '@/lib/ai-processor';
import { connectToDatabase } from '@/lib/database';
import NewsArticle from '@/models/NewsArticle';
import GeneratedContent from '@/models/GeneratedContent';
import { infrastructureManager } from '@/lib/infrastructure-manager';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { type, query, sourceIds, model, customPrompt } = body;
    
    if (!type) {
      return NextResponse.json(
        { success: false, error: 'Content type is required' },
        { status: 400 }
      );
    }
    
    // Initialize infrastructure if needed
    if (!infrastructureManager.isInitialized) {
      await infrastructureManager.initialize();
    }
    
    await connectToDatabase();
    
    let newsArticles;
    
    if (sourceIds && sourceIds.length > 0) {
      // Use specific articles
      newsArticles = await NewsArticle.find({ _id: { $in: sourceIds } });
    } else if (query) {
      // Use simple content generation
      const generatedContent = await aiProcessor.generateSimpleContent(query, type);
      
      // Save the generated content
      const savedContent = await GeneratedContent.create(generatedContent);
      
      // Track content generation event
      await infrastructureManager.publishEvent('content-events', {
        type: 'content-generated',
        data: {
          contentId: savedContent._id.toString(),
          contentType: type,
          query,
          model: model || 'default',
          isSimple: true,
          timestamp: new Date().toISOString(),
        }
      });
      
      return NextResponse.json({
        success: true,
        content: savedContent,
        message: 'Content generated successfully'
      });
    } else {
      // Use latest articles from each category
      const latestArticles = await NewsArticle.aggregate([
        {
          $sort: { publishedAt: -1 }
        },
        {
          $group: {
            _id: '$category',
            latestArticle: { $first: '$$ROOT' }
          }
        },
        {
          $replaceRoot: { newRoot: '$latestArticle' }
        },
        {
          $limit: 3
        }
      ]);
      
      newsArticles = latestArticles;
    }
    
    if (!newsArticles || newsArticles.length === 0) {
      return NextResponse.json(
        { success: false, error: 'No relevant news articles found' },
        { status: 404 }
      );
    }
    
    // Generate content
    const generatedContent = await aiProcessor.generateContent({
      type,
      newsArticles,
      model,
      customPrompt
    });
    
    // Save to database
    const savedContent = await GeneratedContent.create(generatedContent);
    
    // Track content generation event
    await infrastructureManager.publishEvent('content-events', {
      type: 'content-generated',
      data: {
        contentId: savedContent._id.toString(),
        contentType: type,
        model: model || 'default',
        sourceArticlesCount: newsArticles.length,
        sourceIds: sourceIds || [],
        isSimple: false,
        timestamp: new Date().toISOString(),
      }
    });
    
    return NextResponse.json({
      success: true,
      content: savedContent,
      message: 'Content generated successfully'
    });
    
  } catch (error) {
    console.error('Error generating content:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to generate content',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    // Initialize infrastructure if needed
    if (!infrastructureManager.isInitialized) {
      await infrastructureManager.initialize();
    }
    
    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type');
    const status = searchParams.get('status');
    const limit = parseInt(searchParams.get('limit') || '10');
    const page = parseInt(searchParams.get('page') || '1');
    
    // Create cache key for this query
    const cacheKey = `content:${type || 'all'}:${status || 'all'}:${limit}:${page}`;
    
    // Try to get from cache first
    const cached = await infrastructureManager.getCachedData(cacheKey);
    if (cached) {
      // Track cache hit
      await infrastructureManager.publishEvent('content-events', {
        type: 'content-cache-hit',
        data: {
          cacheKey,
          contentType: type,
          status,
          limit,
          page,
          timestamp: new Date().toISOString(),
        }
      });
      
      return NextResponse.json(cached);
    }
    
    await connectToDatabase();
    
    const query: any = {};
    if (type) query.type = type;
    if (status) query.status = status;
    
    const content = await GeneratedContent.find(query)
      .populate('sourceNewsIds', 'title source publishedAt')
      .sort({ createdAt: -1 })
      .limit(limit)
      .skip((page - 1) * limit);
    
    const total = await GeneratedContent.countDocuments(query);
    
    const response = {
      success: true,
      content,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    };
    
    // Cache the response for 3 minutes (content changes more frequently)
    await infrastructureManager.cacheData(cacheKey, response, 180);
    
    // Track content fetch event
    await infrastructureManager.publishEvent('content-events', {
      type: 'content-fetched',
      data: {
        contentType: type,
        status,
        contentCount: content.length,
        limit,
        page,
        total,
        timestamp: new Date().toISOString(),
      }
    });
    
    return NextResponse.json(response);
    
  } catch (error) {
    console.error('Error fetching generated content:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to fetch content',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
