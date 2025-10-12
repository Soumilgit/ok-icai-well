import { NextRequest, NextResponse } from 'next/server'
import { createPerplexityService } from '@/lib/perplexity-service'

export async function POST(request: NextRequest) {
  try {
    const { 
      topic, 
      keywords = [], 
      contentType = 'blog',
      targetAudience 
    } = await request.json()

    if (!topic) {
      return NextResponse.json(
        { error: 'Topic is required' },
        { status: 400 }
      )
    }

    const perplexity = createPerplexityService()
    const response = await perplexity.generateSEOContent(
      topic, 
      keywords, 
      contentType, 
      targetAudience
    )

    return NextResponse.json({
      success: true,
      data: response
    })

  } catch (error: any) {
    console.error('SEO Content API error:', error)

    return NextResponse.json(
      { 
        error: 'Failed to generate SEO content',
        details: error.message 
      },
      { status: 500 }
    )
  }
}