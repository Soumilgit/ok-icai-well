import { NextRequest, NextResponse } from 'next/server'
import { createPerplexityService } from '@/lib/perplexity-service'

export async function POST(request: NextRequest) {
  try {
    const { question, context, searchRecency = 'month' } = await request.json()

    if (!question) {
      return NextResponse.json(
        { error: 'Question is required' },
        { status: 400 }
      )
    }

    const perplexity = createPerplexityService()
    const response = await perplexity.askCAQuestion(question, context, searchRecency)

    return NextResponse.json({
      success: true,
      data: response
    })

  } catch (error: any) {
    console.error('CA Assistant API error:', error)

    return NextResponse.json(
      { 
        error: 'Failed to process CA question',
        details: error.message 
      },
      { status: 500 }
    )
  }
}