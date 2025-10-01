import { NextRequest, NextResponse } from 'next/server'
import { createPerplexityService } from '@/lib/perplexity-service'

export async function POST(request: NextRequest) {
  try {
    const { 
      businessType, 
      targetMarket, 
      budget,
      goals = []
    } = await request.json()

    if (!businessType || !targetMarket) {
      return NextResponse.json(
        { error: 'Business type and target market are required' },
        { status: 400 }
      )
    }

    const perplexity = createPerplexityService()
    const response = await perplexity.generateMarketingStrategy(
      businessType, 
      targetMarket, 
      budget,
      goals
    )

    return NextResponse.json({
      success: true,
      data: response
    })

  } catch (error: any) {
    console.error('Marketing Strategy API error:', error)

    return NextResponse.json(
      { 
        error: 'Failed to generate marketing strategy',
        details: error.message 
      },
      { status: 500 }
    )
  }
}