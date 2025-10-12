import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    if (!process.env.PERPLEXITY_API_KEY) {
      return NextResponse.json({
        status: 'error',
        message: 'Perplexity API key not configured'
      });
    }

    // Test with a simple request
    const response = await fetch('https://api.perplexity.ai/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.PERPLEXITY_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'llama-3.1-sonar-small-128k-online',
        messages: [
          {
            role: 'user',
            content: 'What is 2+2?'
          }
        ],
        max_tokens: 50
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      return NextResponse.json({
        status: 'error',
        message: `API Error: ${response.status}`,
        details: errorText
      });
    }

    const data = await response.json();

    return NextResponse.json({
      status: 'success',
      message: 'Perplexity API is working',
      response: data.choices?.[0]?.message?.content || 'No response'
    });

  } catch (error) {
    return NextResponse.json({
      status: 'error',
      message: error instanceof Error ? error.message : 'Unknown error',
      details: String(error)
    });
  }
}