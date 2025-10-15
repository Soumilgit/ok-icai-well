import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const { prompt } = await request.json();

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

    // Create content generation prompt
    const systemPrompt = createContentPrompt(prompt);
    
    console.log('🚀 Calling Gemini API for Content Generation with model:', model);
    
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
          temperature: 0.7,
          topK: 40,
          topP: 0.9,
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

    let content = data.candidates[0].content.parts[0].text;
    
    if (!content || content.trim().length === 0) {
      throw new Error('Empty response received from Gemini API');
    }
    
    // Clean up special characters and formatting
    content = cleanContent(content);
    
    console.log('✅ Content generated and cleaned successfully via Gemini');
    
    return NextResponse.json({
      success: true,
      content: content.trim()
    });

  } catch (error: any) {
    console.error('❌ Content Generation Gemini API error:', error);
    
    return NextResponse.json(
      { 
        error: 'Failed to generate content',
        details: error.message 
      },
      { status: 500 }
    );
  }
}

function createContentPrompt(userPrompt: string): string {
  return `You are a professional AI content creation assistant. You help create engaging, high-quality content for various platforms including LinkedIn, Twitter, blogs, and other professional materials.

CRITICAL FORMATTING REQUIREMENTS - STRICTLY FOLLOW THESE:
- NEVER use asterisks for emphasis or formatting
- NEVER use hash symbols for headers or formatting
- NEVER use markdown formatting symbols
- NEVER use special characters like at symbols, slashes, backslashes, tildes, backticks, pipes, brackets, curly braces, or parentheses for formatting
- Write in clean, professional prose using plain text only
- Use simple bullet points with dashes when listing items
- Use numbered lists when appropriate
- Use line breaks and paragraphs for structure
- Keep formatting clean and readable for social media platforms
- Use professional, conversational tone

FORBIDDEN FORMATTING CHARACTERS:
- Do not use: asterisks, hashes, at symbols, slashes, backslashes, tildes, backticks, pipes, brackets, curly braces, or parentheses for emphasis or headers
- Do not use: bold, italic, header formatting
- Do not use: Special symbols for bullet points except dashes

ALLOWED FORMATTING:
- Plain text paragraphs
- Dashes for bullet points
- Numbers for numbered lists
- Line breaks between sections
- Professional language and tone

CONTENT GUIDELINES:
1. Create valuable, engaging content that provides real insights
2. Use professional language appropriate for business contexts
3. Include practical insights and actionable advice
4. Keep content engaging but maintain professional standards
5. Avoid controversial topics or promotional language
6. Focus on education, insights, and professional growth
7. Adapt tone and length based on the user's request
8. Use clean, readable formatting without special characters

USER REQUEST: ${userPrompt}

IMPORTANT: Generate content using ONLY plain text formatting. Do not use any markdown symbols, asterisks, hash symbols, or special formatting characters. Use clean paragraphs, dashes for bullets, and numbers for lists.`;
}

function cleanContent(content: string): string {
  // Remove markdown formatting
  content = content
    // Remove bold formatting
    .replace(/\*\*(.*?)\*\*/g, '$1')
    .replace(/\*(.*?)\*/g, '$1')
    // Remove italic formatting
    .replace(/_(.*?)_/g, '$1')
    .replace(/~(.*?)~/g, '$1')
    // Remove headers
    .replace(/^#{1,6}\s*/gm, '')
    // Remove code blocks
    .replace(/```[\s\S]*?```/g, '')
    .replace(/`(.*?)`/g, '$1')
    // Remove strikethrough
    .replace(/~~(.*?)~~/g, '$1')
    // Remove links but keep text
    .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
    // Remove excessive asterisks and hashes
    .replace(/\*{2,}/g, '')
    .replace(/#{2,}/g, '')
    // Clean up multiple spaces and newlines
    .replace(/\n\s*\n\s*\n/g, '\n\n')
    .replace(/[ \t]+/g, ' ')
    // Remove any remaining special formatting characters at start of lines
    .replace(/^[#*\-+\s]*/gm, '')
    // Clean up bullet points to use consistent dashes
    .replace(/^[\s]*[•·▪▫‣⁃]/gm, '- ')
    .replace(/^[\s]*[-]\s*/gm, '- ')
    // Remove empty lines at start and end
    .trim();

  return content;
}
