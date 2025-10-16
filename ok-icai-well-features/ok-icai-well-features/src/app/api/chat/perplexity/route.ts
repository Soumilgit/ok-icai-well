import { NextRequest, NextResponse } from 'next/server'
import { createPerplexityService, perplexityCache } from '@/lib/perplexity-service'

export async function POST(request: NextRequest) {
  try {
    const { messages, options = {} } = await request.json()

    if (!messages || !Array.isArray(messages)) {
      return NextResponse.json(
        { error: 'Messages array is required' },
        { status: 400 }
      )
    }

    // Check cache first
    const cacheKey = perplexityCache.generateKey(messages, options)
    const cachedResponse = perplexityCache.get(cacheKey)
    
    if (cachedResponse) {
      return NextResponse.json({
        success: true,
        data: cachedResponse,
        cached: true
      })
    }

    // Create service and make request
    const perplexity = createPerplexityService()
    const response = await perplexity.chat(messages, options)

    // Cache the response
    perplexityCache.set(cacheKey, response, 30) // Cache for 30 minutes

    return NextResponse.json({
      success: true,
      data: response,
      cached: false
    })

  } catch (error: any) {
    console.error('Perplexity chat API error:', error)

    return NextResponse.json(
      { 
        error: 'Failed to process chat request',
        details: error.message 
      },
      { status: 500 }
    )
  }
}