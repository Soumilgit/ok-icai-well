import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const { topic, keywords, contentType } = await request.json();

    if (!topic) {
      return NextResponse.json(
        { error: 'Topic is required' },
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

    // Use Gemini model
    const model = 'gemini-2.5-flash-lite';
    const baseUrl = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`;

    // Create SEO-specific prompt
    const prompt = createSEOContentPrompt(topic, keywords, contentType);
    
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
          temperature: 0.4,
          topK: 32,
          topP: 0.8,
          maxOutputTokens: 3072,
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

    const content = data.candidates[0].content.parts[0].text;
    
    return NextResponse.json({
      success: true,
      data: {
        choices: [{
          message: {
            content: content
          }
        }],
        citations: [],
        related_questions: []
      }
    });

  } catch (error: any) {
    console.error('❌ SEO Content Gemini API error:', error);
    
    return NextResponse.json(
      { 
        error: 'Failed to generate SEO content',
        details: error.message 
      },
      { status: 500 }
    );
  }
}

function createSEOContentPrompt(topic: string, keywords: string[] = [], contentType: string = 'blog'): string {
  const keywordText = keywords.length > 0 ? keywords.join(', ') : 'relevant SEO keywords';
  
  return `You are an expert SEO content writer specializing in creating high-quality, search-optimized content for Chartered Accountants and finance professionals.

TASK: Create SEO-optimized ${contentType} content about "${topic}"

KEYWORDS TO INCLUDE: ${keywordText}

CONTENT REQUIREMENTS:
1. **SEO Optimization**: Include primary and secondary keywords naturally throughout
2. **Professional Tone**: Suitable for CA professionals and finance industry
3. **Engaging Structure**: Use headers, bullet points, and clear formatting
4. **Value-Driven**: Provide actionable insights and practical information
5. **ICAI Compliant**: Ensure content adheres to professional standards
6. **Length**: Comprehensive but readable (800-1200 words for blog posts)

FORMATTING INSTRUCTIONS:
- Use markdown formatting (##, **, *, bullet points)
- Include clear headings and subheadings
- Add meta description suggestions
- Structure for readability and engagement
- Include call-to-action where appropriate

OUTPUT FORMAT:
1. **SEO Title**: Compelling, keyword-rich title (60 characters max)
2. **Meta Description**: Search snippet description (155 characters max)
3. **Main Content**: Full article/post with proper formatting
4. **Keywords Used**: List of SEO keywords incorporated
5. **SEO Tips**: Brief optimization suggestions

Please create comprehensive, professional SEO content:`;
}