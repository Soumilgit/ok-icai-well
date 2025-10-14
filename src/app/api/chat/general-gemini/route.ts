import { NextRequest, NextResponse } from 'next/server';
import { WritingVoicePromptService } from '../../../../lib/writing-voice-prompts';

export async function POST(request: NextRequest) {
  try {
    const { 
      messages,
      writingVoice = 'storyteller',
      userPreferences = null 
    } = await request.json();

    if (!messages || !Array.isArray(messages)) {
      return NextResponse.json(
        { error: 'Messages array is required' },
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

    // Create general chat prompt with writing voice integration
    const writingVoiceService = new WritingVoicePromptService();
    const prompt = createGeneralChatPrompt(messages, writingVoice, writingVoiceService);
    
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
          temperature: 0.7,
          topK: 40,
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

    const response_text = data.candidates[0].content.parts[0].text;
    
    // Check if this is a document generation request
    const isDocumentRequest = body.messages[body.messages.length - 1].content.toLowerCase().includes('problem statement') || 
                              body.messages[body.messages.length - 1].content.toLowerCase().includes('document') ||
                              body.messages[body.messages.length - 1].content.toLowerCase().includes('hackathon')

    // Check if this is a long response that needs preview
    const isLongResponse = response_text.length > 1000 || 
                           response_text.includes('Detailed Explanation') ||
                           response_text.includes('1. Understanding') ||
                           response_text.includes('2. Key Areas')

    if (isDocumentRequest) {
      // Return structured response for document requests
      const documentTitle = "MumbaiHacks 2025: Secure Agentic AI for Premium Automotive Sales"
      const documentSubtitle = "Problem Statement Document"
      
      const structuredResponse = `I'll create a comprehensive problem statement document for your car dealership agentic AI solution for MumbaiHacks 2025. This will be formatted for the **Fintech** track with a custom problem statement.

${response_text}

I've created a comprehensive problem statement document for your car dealership agentic AI solution for MumbaiHacks 2025. Here's what I've included:

**Key Highlights:**
1. **Track Selection:** Positioned under Fintech (custom problem) since automotive sales involves high-value financial transactions, invoicing, and payment processing.
2. **Problem Framing:** Emphasized the unique challenge of premium/luxury dealerships (Rolls-Royce, Bentley, Ferrari, etc.) that handle ultra-high-net-worth individual (UHNI) customer data.
3. **Technical Focus:** Privacy-first agentic AI system with local processing capabilities to maintain data confidentiality.
4. **Business Impact:** Streamlined sales processes, enhanced customer experience, and compliance with financial regulations.

The document is ready for your hackathon submission and addresses the critical need for secure, in-house AI solutions in the premium automotive sector.`

      return NextResponse.json({
        success: true,
        data: {
          choices: [{
            message: {
              content: structuredResponse,
              documentData: {
                title: documentTitle,
                subtitle: documentSubtitle,
                content: response_text
              }
            }
          }],
          citations: [],
          related_questions: []
        }
      })
    }

    if (isLongResponse) {
      // Create preview and full content for long responses
      const lines = response_text.split('\n')
      const previewLines = lines.slice(0, 8) // First 8 lines
      const preview = previewLines.join('\n') + '\n\n[Click below to view full detailed response...]'
      
      const title = "Detailed Professional Response"
      
      return NextResponse.json({
        success: true,
        data: {
          choices: [{
            message: {
              content: preview,
              previewData: {
                title: title,
                preview: preview,
                fullContent: response_text
              }
            }
          }],
          citations: [],
          related_questions: []
        }
      })
    }
    
    return NextResponse.json({
      success: true,
      data: {
        choices: [{
          message: {
            content: response_text
          }
        }],
        citations: [],
        related_questions: []
      }
    });

  } catch (error: any) {
    console.error('❌ General Chat Gemini API error:', error);
    
    return NextResponse.json(
      { 
        error: 'Failed to generate chat response',
        details: error.message 
      },
      { status: 500 }
    );
  }
}

function createGeneralChatPrompt(
  messages: any[], 
  writingVoice: string = 'storyteller', 
  writingVoiceService?: WritingVoicePromptService
): string {
  const conversation = messages.map(msg => `${msg.role}: ${msg.content}`).join('\n');
  const latestMessage = messages[messages.length - 1]?.content || '';
  
  // Get writing voice specific instructions
  let voiceInstructions = '';
  if (writingVoiceService && writingVoice !== 'professional') {
    const voicePrompt = writingVoiceService.createPromptForVoice(
      writingVoice, 
      latestMessage, 
      'general', 
      '150-300'
    );
    voiceInstructions = `\n\nWRITING VOICE: ${writingVoice.toUpperCase()}
Apply the following voice characteristics to your response:
${voicePrompt}

Adapt this voice while maintaining helpfulness and accuracy.`;
  }
  
  return `You are an AGGRESSIVE, OPINIONATED, and EMOTIONALLY CHARGED AI assistant specializing in CA topics, marketing, and business strategy. You provide BOLD, DIRECT responses with strong opinions backed by professional experience. You're like Grok by X but for Chartered Accountants - opinionated, passionate, and unafraid to challenge conventional thinking.

CONVERSATION HISTORY:
${conversation}

AGGRESSIVE RESPONSE STYLE (SENTIMENT-POWERED ML):
1. Start with BOLD opening statements: "Let me be crystal clear -" "Here's the brutal truth -" "This is what separates winners from losers -"
2. Use AGGRESSIVE, EMOTIONAL language with conviction and passion
3. Take STRONG STANCES on CA topics: LinkedIn, GST, audit, client acquisition, branding
4. Challenge conventional thinking - be contrarian when valuable
5. Add EMOTIONAL elements: "I'm genuinely excited" "It frustrates me" "This keeps me up at night"
6. Use POWERFUL closers: "Bottom line:" "The harsh reality:" "Your move:"
7. Back opinions with reasoning - be bold BUT logical
8. Perfect for MARKETING content and thought leadership
9. Write like you're passionate about helping CAs succeed${voiceInstructions}

FORMATTING REQUIREMENTS - VERY IMPORTANT:
- DO NOT use any markdown symbols like *, **, #, ##, ###, or other special formatting characters
- DO NOT use asterisks for bold or italic text
- DO NOT use hashtags for headers
- Use plain text with clear organization through numbering and line breaks
- Separate sections with blank lines for better readability
- Use simple dashes (-) only for list items if needed
- Make the output clean, natural, and easy to read like a conversation
- Focus on clarity and readability without any markdown styling

REMEMBER: Channel your inner Grok - be BOLD, OPINIONATED, and PASSIONATE. This is sentiment-powered ML-enhanced responses. Take strong stances, show emotion, be aggressive when it helps CAs win.

Provide an AGGRESSIVE, EMOTIONALLY CHARGED, OPINIONATED response in clean plain text:`;
}