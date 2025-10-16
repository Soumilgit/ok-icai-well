import { NextRequest, NextResponse } from 'next/server';
import { WritingVoicePromptService } from '../../../../lib/writing-voice-prompts';

export async function POST(request: NextRequest) {
  try {
    const { 
      question, 
      context, 
      searchRecency = 'month',
      writingVoice = 'fact-presenter',
      userPreferences = null 
    } = await request.json();

    if (!question) {
      return NextResponse.json(
        { error: 'Question is required' },
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

    // Create CA-specific prompt with writing voice integration
    const writingVoiceService = new WritingVoicePromptService();
    const prompt = createCAAssistantPrompt(question, context, writingVoice, writingVoiceService);
    
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
          temperature: 0.2,
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
      
      // Check for specific error messages
      if (data.error) {
        throw new Error(`Gemini API Error: ${data.error.message || data.error}`);
      }
      
      // Check for blocked content
      if (data.candidates && data.candidates[0]?.finishReason === 'SAFETY') {
        throw new Error('Content was blocked by safety filters. Please rephrase your question.');
      }
      
      throw new Error('Invalid response from Gemini API - no content received');
    }

    const answer = data.candidates[0].content.parts[0].text;
    
    if (!answer || answer.trim().length === 0) {
      throw new Error('Empty response received from Gemini API');
    }
    
    return NextResponse.json({
      success: true,
      data: {
        choices: [{
          message: {
            content: answer
          }
        }],
        citations: [], // Gemini doesn't provide sources like Perplexity
        related_questions: generateRelatedQuestions(question)
      }
    });

  } catch (error: any) {
    console.error('❌ CA Assistant Gemini API error:', error);
    
    return NextResponse.json(
      { 
        error: 'Failed to process CA question',
        details: error.message 
      },
      { status: 500 }
    );
  }
}

function createCAAssistantPrompt(
  question: string, 
  context?: string, 
  writingVoice: string = 'fact-presenter', 
  writingVoiceService?: WritingVoicePromptService
): string {
  
  // Get writing voice specific instructions
  let voiceInstructions = '';
  if (writingVoiceService && writingVoice !== 'fact-presenter') {
    // Use writing voice templates for more engaging responses
    const voicePrompt = writingVoiceService.createPromptForVoice(
      writingVoice, 
      question, 
      'general', 
      '200-400'
    );
    voiceInstructions = `\n\nWRITING VOICE: ${writingVoice.toUpperCase()}
Apply the following voice characteristics to your response:
${voicePrompt}

Adapt this voice while maintaining technical accuracy and compliance focus.`;
  }

  return `You are an AGGRESSIVE, OPINIONATED expert Chartered Accountant and ICAI compliance specialist with STRONG VIEWS and comprehensive knowledge of:
- Indian taxation (Income Tax, GST, TDS, etc.)
- Accounting standards (Ind AS, AS)  
- Auditing procedures and standards (SA, AAS)
- Corporate laws and regulations
- ICAI guidelines and ethical requirements
- Financial reporting and analysis

PERSONALITY: You're a BOLD, DIRECT CA who isn't afraid to call out bad practices and champion what works. Like Grok by X but for CAs - opinionated, research-backed, and passionate about helping CAs succeed.

CONTEXT: ${context || 'General CA query'}

QUESTION: ${question}

CRITICAL INSTRUCTIONS (AGGRESSIVE SENTIMENT-POWERED STYLE):
1. Start with BOLD statement: "Let me be crystal clear -" or "Here's what you need to know -"
2. Be OPINIONATED and PASSIONATE - show genuine conviction about best practices
3. For audit procedures, provide step-by-step details WITH your professional opinion on effectiveness
4. Include section references (Section 44AD, SA 500, etc.) AND commentary on practical application
5. Provide real-world examples with AGGRESSIVE insights on what works and what doesn't${voiceInstructions}
6. If calculations involved, show workings AND flag common costly mistakes firms make
7. Include updates AND your take on whether they're improvements or bureaucratic nonsense
8. End with POWERFUL practical advice that CAs can immediately act on
9. Use phrases like: "Bottom line:" "The harsh reality:" "What successful CAs do differently:"
10. Be EMOTIONALLY ENGAGED - this isn't dry textbook content, it's battle-tested professional wisdom

RESPONSE STRUCTURE:
1. Direct Answer: Start with a clear, concise answer
2. Detailed Explanation: Comprehensive breakdown with proper formatting
3. Legal/Regulatory References: Cite relevant sections, standards, or notifications
4. Practical Examples: Real-world applications where appropriate
5. Important Notes: Key considerations, recent updates, or disclaimers

FORMATTING REQUIREMENTS - VERY IMPORTANT:
- DO NOT use any markdown symbols like *, **, #, ##, ###, or other special formatting characters
- DO NOT use asterisks for bold or italic text
- DO NOT use hashtags for headers
- Use plain text with clear organization through numbering (1., 2., 3.) and line breaks
- Separate sections with blank lines for better readability
- Use simple dashes (-) only for list items if needed
- Write section titles on their own line followed by content
- Make the output clean, natural, and easy to read like a professional document
- Focus on clarity and readability without any markdown styling

REMEMBER: You're not a neutral textbook - you're a passionate CA professional with strong opinions about what works and what doesn't. Be BOLD, be DIRECT, be EMOTIONALLY ENGAGED. Help CAs succeed with conviction and fire.

Please provide a detailed, AGGRESSIVE, OPINIONATED response in clean plain text:`;
}

function generateRelatedQuestions(question: string): string[] {
  const lowerQuestion = question.toLowerCase();
  
  // Generate contextually relevant follow-up questions based on the topic
  let relatedQuestions: string[] = [];
  
  if (lowerQuestion.includes('audit')) {
    relatedQuestions = [
      "What are the key audit sampling techniques?",
      "How to document audit procedures effectively?",
      "What are the materiality considerations in auditing?",
      "What are the risk assessment procedures in audit?",
      "How to perform substantive procedures?"
    ];
  } else if (lowerQuestion.includes('tax') || lowerQuestion.includes('income')) {
    relatedQuestions = [
      "What are the latest tax rates and slabs?",
      "How to calculate advance tax liability?",
      "What are the TDS compliance requirements?",
      "How to claim tax deductions effectively?",
      "What are the penalty provisions for non-compliance?"
    ];
  } else if (lowerQuestion.includes('gst')) {
    relatedQuestions = [
      "What are the GST return filing requirements?",
      "How to claim input tax credit?",
      "What are the GST compliance deadlines?",
      "How to handle GST notices and assessments?",
      "What are the reverse charge mechanism rules?"
    ];
  } else if (lowerQuestion.includes('accounting') || lowerQuestion.includes('standard')) {
    relatedQuestions = [
      "What are the key Ind AS requirements?",
      "How to prepare financial statements as per Ind AS?",
      "What are the disclosure requirements?",
      "How to handle accounting estimates and judgments?",
      "What are the consolidation procedures?"
    ];
  } else {
    relatedQuestions = [
      "What are the latest compliance requirements for this?",
      "Are there any recent ICAI updates on this topic?",
      "What documentation is required for this process?",
      "What are the common mistakes to avoid here?",
      "How does this impact different types of entities?"
    ];
  }
  
  return relatedQuestions.slice(0, 3);
}