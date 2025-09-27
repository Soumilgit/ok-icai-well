import { NextRequest, NextResponse } from 'next/server';
import { aiProcessor } from '@/lib/ai-processor';
import { connectToDatabase } from '@/lib/database';
import NewsArticle from '@/models/NewsArticle';
import GeneratedContent from '@/models/GeneratedContent';

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
    await connectToDatabase();
    
    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type');
    const status = searchParams.get('status');
    const limit = parseInt(searchParams.get('limit') || '10');
    const page = parseInt(searchParams.get('page') || '1');
    
    const query: any = {};
    if (type) query.type = type;
    if (status) query.status = status;
    
    const content = await GeneratedContent.find(query)
      .populate('sourceNewsIds', 'title source publishedAt')
      .sort({ createdAt: -1 })
      .limit(limit)
      .skip((page - 1) * limit);
    
    const total = await GeneratedContent.countDocuments(query);
    
    return NextResponse.json({
      success: true,
      content,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    });
    
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
