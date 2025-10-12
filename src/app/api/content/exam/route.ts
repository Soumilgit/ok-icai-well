import { NextRequest, NextResponse } from 'next/server';
import { aiProcessor } from '@/lib/ai-processor';
import { connectToDatabase } from '@/lib/database';
import NewsArticle from '@/models/NewsArticle';
import GeneratedContent from '@/models/GeneratedContent';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { topic, difficulty, count = 10, customPrompt } = body;
    
    if (!topic) {
      return NextResponse.json(
        { success: false, error: 'Topic is required for exam generation' },
        { status: 400 }
      );
    }
    
    await connectToDatabase();
    
    // Get latest news articles (use dummy data)
    let newsArticles = await NewsArticle.find()
      .sort({ publishedAt: -1 })
      .limit(3);
    
    // If no articles found, initialize with dummy data
    if (newsArticles.length === 0) {
      console.log('No articles found, initializing dummy data...');
      const { collectAllNews } = await import('@/lib/news-collector');
      await collectAllNews();
      
      // Retry fetching articles
      newsArticles = await NewsArticle.find()
        .sort({ publishedAt: -1 })
        .limit(3);
    }
    
    // If still no articles, return error
    if (newsArticles.length === 0) {
      return NextResponse.json(
        { success: false, error: 'No news data available for exam generation' },
        { status: 500 }
      );
    }
    
    // Custom prompt for exam generation optimized for qwen/qwen3-32b
    const examPrompt = customPrompt || `You are an expert Chartered Accountant and exam question generator. Create ${count} comprehensive exam questions focused on "${topic}".

INSTRUCTIONS:
1. Use the provided news articles as reference context when relevant
2. If the news articles don't directly relate to "${topic}", draw upon your CA knowledge for that topic
3. Create questions that test practical application of CA principles for "${topic}"
4. Cover ${difficulty || 'intermediate'} difficulty level following ICAI exam standards
5. Include a mix of: multiple choice, short answer, and case study questions
6. Provide detailed explanations with relevant section/provision references
7. Focus on current regulations and real-world applications

FORMAT: Return a JSON object with this exact structure:
{
  "questions": [
    {
      "question": "Question text here",
      "type": "multiple_choice" or "short_answer" or "case_study",
      "options": ["A) Option 1", "B) Option 2", "C) Option 3", "D) Option 4"] (only for multiple_choice),
      "correct_answer": "Correct answer here",
      "explanation": "Detailed explanation with relevant provisions"
    }
  ]
}

IMPORTANT: Respond ONLY with the JSON object. No additional text, explanations, or formatting outside the JSON.`;

    // Generate exam questions
    const generatedContent = await aiProcessor.generateContent({
      type: 'exam_questions',
      newsArticles,
      customPrompt: examPrompt,
      model: 'qwen/qwen3-32b'
    });
    
    // Update the content with exam-specific metadata
    generatedContent.metadata.category = topic;
    generatedContent.metadata.tags = [topic, 'exam', 'icai', difficulty || 'intermediate'];
    
    // Save to database
    const savedContent = await GeneratedContent.create(generatedContent);
    
    return NextResponse.json({
      success: true,
      examContent: savedContent,
      message: `Generated ${count} exam questions for ${topic}`
    });
    
  } catch (error) {
    console.error('Error generating exam questions:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to generate exam questions',
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
    const topic = searchParams.get('topic');
    const difficulty = searchParams.get('difficulty');
    const limit = parseInt(searchParams.get('limit') || '5');
    
    const query: any = { type: 'exam_questions' };
    
    if (topic) {
      query.$or = [
        { 'metadata.category': { $regex: topic, $options: 'i' } },
        { title: { $regex: topic, $options: 'i' } }
      ];
    }
    
    if (difficulty) {
      query['metadata.tags'] = { $in: [difficulty] };
    }
    
    const examContent = await GeneratedContent.find(query)
      .populate('sourceNewsIds', 'title source publishedAt')
      .sort({ createdAt: -1 })
      .limit(limit);
    
    return NextResponse.json({
      success: true,
      examContent,
      message: `Found ${examContent.length} exam question sets`
    });
    
  } catch (error) {
    console.error('Error fetching exam content:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to fetch exam content',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
