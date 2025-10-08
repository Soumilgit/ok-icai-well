import { NextRequest, NextResponse } from 'next/server';
import { collectAllNews } from '@/lib/news-collector';
import { connectToDatabase } from '@/lib/database';
import NewsArticle from '@/models/NewsArticle';
import { infrastructureManager } from '@/lib/infrastructure-manager';

export async function POST(request: NextRequest) {
  try {
    console.log('Starting news collection process...');
    
    // Initialize infrastructure if needed
    if (!infrastructureManager.isInitialized) {
      await infrastructureManager.initialize();
    }
    
    // Collect news from all sources
    const articles = await collectAllNews();
    
    console.log(`Collected ${articles.length} articles`);
    
    // Track news collection event
    await infrastructureManager.publishEvent('news-events', {
      type: 'news-collection',
      data: {
        articlesCount: articles.length,
        timestamp: new Date().toISOString(),
        source: 'automated',
      }
    });
    
    // Process articles
    await connectToDatabase();
    
    for (const article of articles) {
      try {
        // Find the saved article in database
        const savedArticle = await NewsArticle.findOne({ url: article.url });
        
        if (savedArticle && !savedArticle.processedAt) {
          // Mark as processed
          await NewsArticle.findByIdAndUpdate(savedArticle._id, {
            processedAt: new Date()
          });
          
          // Track article processing event
          await infrastructureManager.publishEvent('news-events', {
            type: 'news-article-processed',
            data: {
              articleId: savedArticle._id.toString(),
              title: savedArticle.title,
              source: savedArticle.source,
              category: savedArticle.category,
              timestamp: new Date().toISOString(),
            }
          });
          
          console.log(`Processed article: ${savedArticle.title}`);
        }
      } catch (error) {
        console.error(`Error processing article: ${error}`);
        continue;
      }
    }
    
    return NextResponse.json({
      success: true,
      message: `Successfully collected and processed ${articles.length} articles`,
      articlesCount: articles.length
    });
    
  } catch (error) {
    console.error('Error in news collection:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to collect news',
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
    const source = searchParams.get('source');
    const category = searchParams.get('category');
    const limit = parseInt(searchParams.get('limit') || '10');
    const page = parseInt(searchParams.get('page') || '1');
    
    // Create cache key for this query
    const cacheKey = `news:${source || 'all'}:${category || 'all'}:${limit}:${page}`;
    
    // Try to get from cache first
    const cached = await infrastructureManager.getCachedData(cacheKey);
    if (cached) {
      // Track cache hit
      await infrastructureManager.publishEvent('news-events', {
        type: 'news-cache-hit',
        data: {
          cacheKey,
          source,
          category,
          limit,
          page,
          timestamp: new Date().toISOString(),
        }
      });
      
      return NextResponse.json(cached);
    }
    
    await connectToDatabase();
    
    const query: any = {};
    if (source) query.source = source;
    if (category) query.category = category;
    
    const articles = await NewsArticle.find(query)
      .sort({ publishedAt: -1 })
      .limit(limit)
      .skip((page - 1) * limit);
    
    const total = await NewsArticle.countDocuments(query);
    
    const response = {
      success: true,
      articles,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    };
    
    // Cache the response for 5 minutes
    await infrastructureManager.cacheData(cacheKey, response, 300);
    
    // Track news fetch event
    await infrastructureManager.publishEvent('news-events', {
      type: 'news-fetched',
      data: {
        source,
        category,
        articlesCount: articles.length,
        limit,
        page,
        total,
        timestamp: new Date().toISOString(),
      }
    });
    
    return NextResponse.json(response);
    
  } catch (error) {
    console.error('Error fetching news:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to fetch news',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
