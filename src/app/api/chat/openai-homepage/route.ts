import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const { messages } = await request.json();

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

    // Convert messages to Gemini format
    const conversationHistory = messages.map((msg: any) => ({
      role: msg.role === 'user' ? 'user' : 'model',
      parts: [{ text: msg.content }]
    }));

    const response = await fetch(`${baseUrl}?key=${apiKey}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        contents: conversationHistory,
        generationConfig: {
          temperature: 0.7,
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
      
      if (data.error) {
        throw new Error(`Gemini API Error: ${data.error.message || data.error}`);
      }
      
      if (data.candidates && data.candidates[0]?.finishReason === 'SAFETY') {
        throw new Error('Content was blocked by safety filters. Please rephrase your question.');
      }
      
      throw new Error('Invalid response from Gemini API - no content received');
    }

    const answer = data.candidates[0].content.parts[0].text;
    
    if (!answer || answer.trim().length === 0) {
      throw new Error('Empty response received from Gemini API');
    }

    // Clean the response to remove special characters and format properly
    const cleanedAnswer = cleanResponse(answer);
    
    return NextResponse.json({
      success: true,
      data: {
        choices: [{
          message: {
            content: cleanedAnswer
          }
        }],
        citations: [],
        related_questions: generateRelatedQuestions(messages[messages.length - 1]?.content || '')
      }
    });

  } catch (error: any) {
    console.error('❌ Homepage Gemini API error:', error);
    
    return NextResponse.json(
      { 
        error: 'Failed to process message',
        details: error.message 
      },
      { status: 500 }
    );
  }
}

function cleanResponse(text: string): string {
  // Remove markdown formatting
  let cleaned = text
    .replace(/\*\*(.*?)\*\*/g, '$1') // Remove bold
    .replace(/\*(.*?)\*/g, '$1') // Remove italic
    .replace(/#{1,6}\s*/g, '') // Remove headers
    .replace(/`([^`]+)`/g, '$1') // Remove code blocks
    .replace(/```[\s\S]*?```/g, '') // Remove code blocks
    .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1') // Remove links but keep text
    .replace(/\n{3,}/g, '\n\n') // Reduce multiple newlines
    .trim();

  // Clean up any remaining special characters that might cause issues
  cleaned = cleaned
    .replace(/[#*`_~]/g, '') // Remove remaining markdown characters
    .replace(/\n\s*\n\s*\n/g, '\n\n') // Clean up excessive line breaks
    .trim();

  return cleaned;
}

function generateRelatedQuestions(lastMessage: string): string[] {
  const lowerMessage = lastMessage.toLowerCase();
  
  let relatedQuestions: string[] = [];
  
  if (lowerMessage.includes('content') || lowerMessage.includes('write') || lowerMessage.includes('create')) {
    relatedQuestions = [
      "How can I improve my content strategy?",
      "What are the best practices for content creation?",
      "How do I make my content more engaging?",
      "What tools can help with content creation?",
      "How do I measure content performance?"
    ];
  } else if (lowerMessage.includes('business') || lowerMessage.includes('marketing')) {
    relatedQuestions = [
      "What are effective marketing strategies?",
      "How can I grow my business?",
      "What are the latest marketing trends?",
      "How do I create a marketing plan?",
      "What metrics should I track?"
    ];
  } else {
    relatedQuestions = [
      "Can you help me with something else?",
      "What other features are available?",
      "How can I get started?",
      "What are some best practices?",
      "Can you provide more details?"
    ];
  }
  
  return relatedQuestions.slice(0, 3);
}
