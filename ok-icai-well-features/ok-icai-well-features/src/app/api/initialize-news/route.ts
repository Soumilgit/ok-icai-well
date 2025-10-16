import { NextRequest, NextResponse } from 'next/server';
import { collectAllNews } from '@/lib/news-collector';

export async function POST(request: NextRequest) {
  try {
    console.log('Initializing dummy news data...');
    
    // This will save the dummy data to the database
    const articles = await collectAllNews();
    
    return NextResponse.json({
      success: true,
      message: `Successfully initialized ${articles.length} dummy news articles`,
      articles: articles.map(article => ({
        title: article.title,
        source: article.source,
        category: article.category,
        publishedAt: article.publishedAt
      }))
    });
    
  } catch (error) {
    console.error('Error initializing dummy data:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to initialize dummy data',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  return POST(request);
}