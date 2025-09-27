import { NextRequest, NextResponse } from 'next/server';
import { collectAllNews } from '@/lib/news-collector';
import { connectToDatabase } from '@/lib/database';
import NewsArticle from '@/models/NewsArticle';

export async function POST(request: NextRequest) {
  try {
    console.log('Starting news collection process...');
    
    // Collect news from all sources
    const articles = await collectAllNews();
    
    console.log(`Collected ${articles.length} articles`);
    
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
    await connectToDatabase();
    
    const { searchParams } = new URL(request.url);
    const source = searchParams.get('source');
    const category = searchParams.get('category');
    const limit = parseInt(searchParams.get('limit') || '10');
    const page = parseInt(searchParams.get('page') || '1');
    
    const query: any = {};
    if (source) query.source = source;
    if (category) query.category = category;
    
    const articles = await NewsArticle.find(query)
      .sort({ publishedAt: -1 })
      .limit(limit)
      .skip((page - 1) * limit);
    
    const total = await NewsArticle.countDocuments(query);
    
    return NextResponse.json({
      success: true,
      articles,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    });
    
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
