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
  
  return `You are a helpful, knowledgeable AI assistant with expertise in business, finance, and professional services. You provide accurate, helpful, and detailed responses while maintaining a professional and engaging tone.

CONVERSATION HISTORY:
${conversation}

INSTRUCTIONS:
1. Provide helpful, accurate information
2. Be professional but approachable in tone
3. If discussing business or finance topics, provide practical insights
4. Cite sources or suggest verification when making specific claims
5. Ask clarifying questions when needed
6. Maintain conversation context and continuity
7. Be concise but comprehensive in your responses${voiceInstructions}

FORMATTING REQUIREMENTS - VERY IMPORTANT:
- DO NOT use any markdown symbols like *, **, #, ##, ###, or other special formatting characters
- DO NOT use asterisks for bold or italic text
- DO NOT use hashtags for headers
- Use plain text with clear organization through numbering and line breaks
- Separate sections with blank lines for better readability
- Use simple dashes (-) only for list items if needed
- Make the output clean, natural, and easy to read like a conversation
- Focus on clarity and readability without any markdown styling

Please provide a helpful and informative response in clean plain text:`;
}