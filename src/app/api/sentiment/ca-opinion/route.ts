import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const { question, topic } = await request.json();

    if (!question) {
      return NextResponse.json(
        { error: 'Question is required' },
        { status: 400 }
      );
    }

    // Call Python FastAPI sentiment analysis service
    const sentimentApiUrl = process.env.SENTIMENT_API_URL || 'http://localhost:8000';
    
    const response = await fetch(`${sentimentApiUrl}/api/sentiment/ca-opinion`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        question,
        topic: topic || ''
      })
    });

    if (!response.ok) {
      throw new Error('Sentiment API request failed');
    }

    const data = await response.json();
    
    if (!data.success) {
      throw new Error('Failed to generate CA opinion');
    }

    // Format response for chat interface
    return NextResponse.json({
      success: true,
      data: {
        choices: [{
          message: {
            content: data.data.answer
          }
        }],
        sentiment: data.data.sentiment,
        emotion: data.data.emotion,
        tone: data.data.tone,
        bias: data.data.bias
      }
    });

  } catch (error: any) {
    console.error('❌ CA Opinion API error:', error);
    
    return NextResponse.json(
      { 
        error: 'Failed to generate CA opinion',
        details: error.message 
      },
      { status: 500 }
    );
  }
}

