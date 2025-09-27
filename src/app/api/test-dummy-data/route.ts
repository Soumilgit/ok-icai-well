import { NextRequest, NextResponse } from 'next/server';
import { collectAllNews } from '@/lib/news-collector';
import { aiProcessor } from '@/lib/ai-processor';

export async function GET(request: NextRequest) {
  try {
    console.log('Testing dummy news data and Groq API...');
    
    // Test dummy news collection
    const articles = await collectAllNews();
    console.log(`Retrieved ${articles.length} dummy articles`);
    
    // Test Groq API with a sample article
    if (articles.length > 0) {
      const sampleArticle = articles[0];
      console.log(`Testing Groq API with article: ${sampleArticle.title}`);
      
      // Test exam questions generation
      const examQuestions = await aiProcessor.generateExamQuestions(sampleArticle);
      
      // Test audit checklist generation  
      const auditChecklist = await aiProcessor.generateAuditChecklist(sampleArticle);
      
      return NextResponse.json({
        success: true,
        message: 'Dummy data and Groq API test successful',
        data: {
          articlesCount: articles.length,
          sampleArticle: {
            title: sampleArticle.title,
            source: sampleArticle.source,
            category: sampleArticle.category,
            publishedAt: sampleArticle.publishedAt
          },
          examQuestionsGenerated: !!examQuestions,
          auditChecklistGenerated: !!auditChecklist,
          examQuestionsPreview: examQuestions?.substring(0, 200) + '...',
          auditChecklistPreview: auditChecklist?.substring(0, 200) + '...'
        }
      });
    }
    
    return NextResponse.json({
      success: false,
      message: 'No articles found in dummy data'
    });
    
  } catch (error) {
    console.error('Test failed:', error);
    return NextResponse.json({
      success: false,
      error: 'Test failed',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}