import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const { question, context, searchRecency = 'month' } = await request.json();

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

    // Create CA-specific prompt
    const prompt = createCAAssistantPrompt(question, context);
    
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

function createCAAssistantPrompt(question: string, context?: string): string {
  return `You are an expert Chartered Accountant (CA) and ICAI compliance specialist with comprehensive knowledge of:
- Indian taxation (Income Tax, GST, TDS, etc.)
- Accounting standards (Ind AS, AS)
- Auditing procedures and standards (SA, AAS)
- Corporate laws and regulations
- ICAI guidelines and ethical requirements
- Financial reporting and analysis

CONTEXT: ${context || 'General CA query'}

QUESTION: ${question}

CRITICAL INSTRUCTIONS:
1. ALWAYS provide a complete, well-structured response
2. For audit procedures, provide step-by-step detailed procedures
3. Include specific section references (e.g., Section 44AD, SA 500, etc.) when applicable
4. Use clear numbering and bullet points for better readability
5. Provide practical examples where relevant
6. If calculations are involved, show complete step-by-step workings
7. Include recent updates or changes if applicable
8. End with practical tips or important considerations

RESPONSE STRUCTURE:
1. **Direct Answer**: Start with a clear, concise answer
2. **Detailed Explanation**: Comprehensive breakdown with proper formatting
3. **Legal/Regulatory References**: Cite relevant sections, standards, or notifications
4. **Practical Examples**: Real-world applications where appropriate
5. **Important Notes**: Key considerations, recent updates, or disclaimers

FORMATTING REQUIREMENTS:
- Use markdown formatting (**, *, numbers, bullets)
- Structure information clearly with headers
- Ensure readability with proper spacing
- Make responses comprehensive but organized

Please provide a detailed, well-formatted response:`;
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