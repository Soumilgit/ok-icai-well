import { NextRequest, NextResponse } from 'next/server';
import { WritingVoicePromptService } from '../../../../lib/writing-voice-prompts';

export async function POST(request: NextRequest) {
  try {
    const { 
      prompt, 
      writingVoice = 'professional', 
      contentType = 'twitter',
      wordCount = '50-100' 
    } = await request.json();

    if (!prompt) {
      return NextResponse.json(
        { error: 'Prompt is required' },
        { status: 400 }
      );
    }

    // Get Meta-Llama API key
    const apiKey = process.env.META_LLAMA_API_KEY;
    
    if (!apiKey) {
      console.error('❌ META_LLAMA_API_KEY not found in environment variables');
      return NextResponse.json(
        { error: 'Meta-Llama API key not configured' },
        { status: 500 }
      );
    }

    // Use llama3-8b model as requested
    const model = 'llama3-8b';
    
    // Create writing voice prompt using the comprehensive template system
    const writingVoiceService = new WritingVoicePromptService();
    const voicePrompt = writingVoiceService.createPromptForVoice(
      writingVoice, 
      prompt, 
      'twitter',
      wordCount
    );

    // Add Twitter-specific constraints to the prompt
    const twitterPrompt = `${voicePrompt}

TWITTER-SPECIFIC REQUIREMENTS:
- Maximum 280 characters (including spaces and hashtags)
- Use concise, impactful language
- Include 1-2 relevant hashtags maximum
- No excessive formatting
- Direct and punchy messaging
- Suitable for quick reading and engagement

Generate a Twitter post that follows these constraints while maintaining the ${writingVoice} voice.`;

    console.log('🚀 Calling Meta-Llama API for Twitter Content with model:', model);
    console.log('📝 Using writing voice:', writingVoice);
    
    // Meta-Llama API call (adjust endpoint based on your provider)
    const response = await fetch('https://api.together.xyz/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: `meta-llama/Llama-3-8b-chat-hf`,
        messages: [
          {
            role: 'system',
            content: 'You are a professional content creator specializing in Twitter posts for Chartered Accountants in India. Create concise, engaging, and compliant content under 280 characters.'
          },
          {
            role: 'user',
            content: twitterPrompt
          }
        ],
        max_tokens: 512,
        temperature: 0.7,
        top_p: 0.9,
        repetition_penalty: 1.1,
        stop: ["</s>", "[INST]", "[/INST]"]
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ Meta-Llama API Error:', response.status, errorText);
      throw new Error(`Meta-Llama API Error: ${response.status} - ${errorText}`);
    }

    const data = await response.json();
    
    console.log('📄 Meta-Llama API Response:', JSON.stringify(data, null, 2));
    
    if (!data.choices || !data.choices[0]?.message?.content) {
      console.error('❌ Invalid Meta-Llama response structure:', data);
      throw new Error('Invalid response from Meta-Llama API - no content received');
    }

    let content = data.choices[0].message.content.trim();
    
    if (!content || content.length === 0) {
      throw new Error('Empty response received from Meta-Llama API');
    }
    
    // Ensure Twitter character limit compliance
    if (content.length > 280) {
      content = content.substring(0, 277) + '...';
    }
    
    console.log('✅ Twitter content generated successfully via Meta-Llama');
    console.log(`📏 Character count: ${content.length}/280`);
    
    // Extract hashtags from content for structured response
    const hashtagRegex = /#[\w\u0900-\u097F]+/g;
    const hashtags = content.match(hashtagRegex) || [];
    
    return NextResponse.json({
      success: true,
      content: content,
      hashtags: hashtags,
      characterCount: content.length,
      metadata: {
        model: model,
        writingVoice: writingVoice,
        contentType: contentType,
        wordCount: wordCount,
        generatedAt: new Date().toISOString(),
        withinLimit: content.length <= 280
      }
    });

  } catch (error: any) {
    console.error('❌ Twitter Content Meta-Llama API error:', error);
    
    return NextResponse.json(
      { 
        error: 'Failed to generate Twitter content',
        details: error.message 
      },
      { status: 500 }
    );
  }
}