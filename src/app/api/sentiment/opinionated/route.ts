import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const { question, topic, writing_voice, bias_level } = await request.json();

    if (!question) {
      return NextResponse.json(
        { error: 'Question is required' },
        { status: 400 }
      );
    }

    // Call Python FastAPI sentiment analysis service
    const sentimentApiUrl = process.env.SENTIMENT_API_URL || 'http://localhost:8000';
    
    const response = await fetch(`${sentimentApiUrl}/api/sentiment/opinionated-answer`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        question,
        topic: topic || '',
        writing_voice: writing_voice || 'aggressive',
        bias_level: bias_level || 'strong'
      })
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.detail || 'Sentiment API failed');
    }

    const data = await response.json();
    
    if (!data.success) {
      throw new Error('Failed to generate opinionated response');
    }

    // Format response for chat interface
    return NextResponse.json({
      success: true,
      data: {
        choices: [{
          message: {
            content: data.data.opinionated_answer
          }
        }],
        sentiment: data.data.sentiment,
        emotion: data.data.emotion,
        confidence: data.data.confidence,
        tone: data.data.tone,
        writing_voice: data.data.writing_voice,
        bias_level: data.data.bias_level
      }
    });

  } catch (error: any) {
    console.error('❌ Sentiment API error:', error);
    
    // Fallback to Gemini if sentiment service is unavailable
    try {
      const { question } = await request.json();
      const apiKey = process.env.GEMINI_API_KEY;
      
      if (!apiKey) {
        throw new Error('Gemini API key not configured');
      }

      const model = 'gemini-2.5-flash-lite';
      const baseUrl = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`;

      const fallbackPrompt = `You are an aggressive, opinionated marketing expert for Chartered Accountants with strong views.

QUESTION: ${question}

Provide an AGGRESSIVE, OPINIONATED, and EMOTIONAL response:
- Be bold and direct
- Take a strong stance
- Use passionate language
- Back opinions with reasoning
- Don't be afraid to challenge conventional thinking
- Format in clean plain text without markdown symbols

Give me your unfiltered professional opinion:`;

      const geminiResponse = await fetch(`${baseUrl}?key=${apiKey}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: fallbackPrompt }] }],
          generationConfig: {
            temperature: 0.9,
            topK: 40,
            topP: 0.95,
            maxOutputTokens: 2048,
          }
        })
      });

      const geminiData = await geminiResponse.json();
      const answer = geminiData.candidates?.[0]?.content?.parts?.[0]?.text;

      if (answer) {
        return NextResponse.json({
          success: true,
          data: {
            choices: [{ message: { content: answer } }],
            sentiment: 'neutral',
            tone: 'Aggressive (Fallback)',
            fallback: true
          }
        });
      }
    } catch (fallbackError) {
      console.error('❌ Fallback also failed:', fallbackError);
    }
    
    return NextResponse.json(
      { 
        error: 'Failed to generate opinionated response',
        details: error.message 
      },
      { status: 500 }
    );
  }
}

