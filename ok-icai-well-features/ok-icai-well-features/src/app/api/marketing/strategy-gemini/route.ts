import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const { businessType, targetMarket, budget } = await request.json();

    if (!businessType && !targetMarket) {
      return NextResponse.json(
        { error: 'Business type or target market is required' },
        { status: 400 }
      );
    }

    // Get API key from environment variables
    const apiKey = process.env.GEMINI_API_KEY;
    
    if (!apiKey) {
      console.error('❌ GEMINI_API_KEY not found in environment variables');
      return NextResponse.json(
        { error: 'Gemini API key not configured' },
        { status: 500 }
      );
    }

    // Use Gemini 2.5 Flash Lite model
    const model = 'gemini-2.5-flash-lite';
    const baseUrl = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`;

    // Create marketing strategy prompt
    const prompt = createMarketingPrompt(businessType, targetMarket, budget);
    
    const response = await fetch(`${baseUrl}?key=${apiKey}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        contents: [{
          parts: [{ text: prompt }]
        }],
        generationConfig: {
          temperature: 0.6,
          topK: 32,
          topP: 0.8,
          maxOutputTokens: 2048,
          candidateCount: 1,
        },
        safetySettings: [
          {
            category: "HARM_CATEGORY_HARASSMENT",
            threshold: "BLOCK_MEDIUM_AND_ABOVE"
          },
          {
            category: "HARM_CATEGORY_HATE_SPEECH", 
            threshold: "BLOCK_MEDIUM_AND_ABOVE"
          },
          {
            category: "HARM_CATEGORY_SEXUALLY_EXPLICIT",
            threshold: "BLOCK_MEDIUM_AND_ABOVE"
          },
          {
            category: "HARM_CATEGORY_DANGEROUS_CONTENT",
            threshold: "BLOCK_MEDIUM_AND_ABOVE"
          }
        ]
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ Gemini API Error:', response.status, errorText);
      throw new Error(`Gemini API Error: ${response.status} - ${errorText}`);
    }

    const data = await response.json();
    
    if (!data.candidates || !data.candidates[0]?.content?.parts?.[0]?.text) {
      console.error('❌ Invalid Gemini response structure:', data);
      throw new Error('Invalid response from Gemini API');
    }

    const strategy = data.candidates[0].content.parts[0].text;
    
    return NextResponse.json({
      success: true,
      data: {
        choices: [{
          message: {
            content: strategy
          }
        }],
        citations: [],
        related_questions: []
      }
    });

  } catch (error: any) {
    console.error('❌ Marketing Strategy Gemini API error:', error);
    
    return NextResponse.json(
      { 
        error: 'Failed to generate marketing strategy',
        details: error.message 
      },
      { status: 500 }
    );
  }
}

function createMarketingPrompt(businessType: string, targetMarket: string, budget?: string): string {
  return `You are an expert marketing strategist specializing in professional services marketing, particularly for Chartered Accountants and finance professionals.

MARKETING REQUEST:
- Business Type: ${businessType || 'CA Practice'}
- Target Market: ${targetMarket || 'General market'}
- Budget: ${budget || 'Budget-conscious approach'}

INSTRUCTIONS:
1. Develop a comprehensive marketing strategy tailored for CA practices
2. Focus on digital marketing tactics that comply with ICAI guidelines
3. Provide actionable, practical recommendations
4. Consider the unique challenges and opportunities in the CA profession
5. Include content marketing, social media, and client acquisition strategies
6. Suggest metrics and KPIs to track success
7. Ensure all recommendations are ethical and professional

STRATEGY COMPONENTS:
- Target audience analysis
- Digital marketing channels
- Content strategy recommendations
- Lead generation tactics
- Client retention strategies
- Professional branding guidelines
- Budget allocation suggestions
- Timeline and milestones

RESPONSE FORMAT:
1. **Executive Summary**: Key strategic recommendations
2. **Target Audience**: Detailed audience analysis
3. **Marketing Channels**: Recommended channels with rationale
4. **Content Strategy**: Content types and calendar suggestions
5. **Budget Allocation**: How to allocate marketing spend
6. **Implementation Timeline**: Phased approach with milestones
7. **Success Metrics**: KPIs to track and measure

Please provide a detailed, actionable marketing strategy:`;
}