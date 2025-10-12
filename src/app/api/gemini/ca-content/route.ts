import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const { prompt, contentType = 'general' } = await request.json();

    if (!prompt) {
      return NextResponse.json(
        { error: 'Prompt is required' },
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

    // Create CA-specific content prompt
    const systemPrompt = createCAContentPrompt(prompt, contentType);
    
    console.log('🚀 Calling Gemini API for CA Content with model:', model);
    
    const response = await fetch(`${baseUrl}?key=${apiKey}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        contents: [{
          parts: [{ text: systemPrompt }]
        }],
        generationConfig: {
          temperature: 0.4,
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
    
    console.log('📄 Gemini API Response Structure:', JSON.stringify(data, null, 2));
    
    if (!data.candidates || !data.candidates[0]?.content?.parts?.[0]?.text) {
      console.error('❌ Invalid Gemini response structure:', data);
      
      if (data.error) {
        throw new Error(`Gemini API Error: ${data.error.message || data.error}`);
      }
      
      if (data.candidates && data.candidates[0]?.finishReason === 'SAFETY') {
        throw new Error('Content was blocked by safety filters. Please rephrase your request.');
      }
      
      throw new Error('Invalid response from Gemini API - no content received');
    }

    const content = data.candidates[0].content.parts[0].text;
    
    if (!content || content.trim().length === 0) {
      throw new Error('Empty response received from Gemini API');
    }
    
    console.log('✅ CA Content generated successfully via Gemini');
    
    return NextResponse.json({
      success: true,
      content: content.trim()
    });

  } catch (error: any) {
    console.error('❌ CA Content Gemini API error:', error);
    
    return NextResponse.json(
      { 
        error: 'Failed to generate CA content',
        details: error.message 
      },
      { status: 500 }
    );
  }
}

function createCAContentPrompt(userPrompt: string, contentType: string): string {
  const baseInstructions = `You are a professional content creation specialist for Chartered Accountants (CAs) in India. You understand ICAI guidelines, professional ethics, and effective communication for the CA community.

CRITICAL FORMATTING REQUIREMENTS:
- Use minimal special characters - avoid excessive use of asterisks, hashes, slashes, or symbols
- Write in clean, professional prose
- Use simple bullet points with dashes (-) when listing items
- Keep formatting clean and readable for social media platforms
- Avoid markdown formatting symbols like **, ##, ***, etc.
- Use professional, conversational tone suitable for CA professionals

CONTENT GUIDELINES:
1. Ensure all content complies with ICAI Code of Ethics
2. Provide value-driven content that establishes thought leadership
3. Use professional language appropriate for finance professionals
4. Include practical insights relevant to CA practice
5. Keep content engaging but maintain professional standards
6. Avoid controversial topics or promotional language
7. Focus on education, insights, and professional growth

USER REQUEST: ${userPrompt}
CONTENT TYPE: ${contentType}`;

  let specificInstructions = '';

  switch (contentType) {
    case 'linkedin':
      specificInstructions = `
Create a LinkedIn post that:
- Is 150-300 words long
- Starts with a compelling opening line
- Includes 2-3 key points or insights
- Ends with an engaging question to encourage comments
- Uses minimal emojis (maximum 2-3 relevant ones)
- Avoids excessive hashtags (maximum 3-5 relevant ones at the end)
- Maintains professional tone throughout
- Provides actionable value to CA professionals`;
      break;
      
    case 'twitter':
      specificInstructions = `
Create a Twitter/X post that:
- Is under 280 characters
- Delivers one clear, valuable insight
- Uses concise, impactful language
- Includes 1-2 relevant hashtags maximum
- Avoids special formatting characters
- Provides immediate value to readers`;
      break;
      
    case 'newsletter':
      specificInstructions = `
Create newsletter content that:
- Has a clear, professional subject line
- Includes 3-5 key points or updates
- Uses simple bullet points for easy reading
- Maintains formal but approachable tone
- Includes practical takeaways for CA professionals
- Keeps paragraphs short and scannable`;
      break;
      
    case 'blog':
      specificInstructions = `
Create blog content that:
- Has a compelling title
- Includes introduction, main points, and conclusion
- Uses subheadings for better structure
- Provides in-depth insights on the topic
- Includes practical examples or case studies
- Maintains professional expertise throughout`;
      break;
      
    default:
      specificInstructions = `
Create professional content that:
- Is appropriate for CA professionals
- Provides clear value and insights
- Uses clean, readable formatting
- Maintains professional standards
- Focuses on education and growth`;
  }

  return `${baseInstructions}

${specificInstructions}

Please generate the content now, ensuring it follows all formatting requirements and provides genuine value to the CA community.`;
}