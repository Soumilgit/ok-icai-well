import { NextRequest, NextResponse } from 'next/server';
import { ICAIComplianceChecker } from '@/lib/icai-guidelines';
import { RAGCacheService } from '@/lib/rag-cache';
import { TwitterService } from '@/lib/twitter-service';
import { PerplexityService } from '@/lib/perplexity-service';

// Profanity filter - CA professionals must maintain professional standards
const PROFANITY_PATTERNS = [
  // Add comprehensive profanity patterns that CAs should avoid
  /\b(fuck|shit|damn|hell|ass|bitch|bastard|crap)\b/gi,
  /\b(wtf|omg|bs|fml)\b/gi,
  // Add more patterns as needed
];

// ICAI Guidelines violations - specific to CA professional conduct
const ICAI_VIOLATIONS = [
  /\b(guaranteed returns|assured profit|risk-free investment)\b/gi,
  /\b(tax evasion|hide income|black money)\b/gi,
  /\b(fake documents|forge|manipulate records)\b/gi,
  /\b(bribe|corruption|under-the-table)\b/gi,
];

interface PostAutomationRequest {
  content: string;
  userId: string;
  topic?: string;
  voiceType?: string;
  newsArticleId?: string;
  researchContext?: any;
  scheduleFor?: string;
  images?: string[];
}

export async function POST(request: NextRequest) {
  try {
    const { 
      content, 
      userId, 
      topic, 
      voiceType, 
      newsArticleId, 
      researchContext,
      scheduleFor,
      images 
    }: PostAutomationRequest = await request.json();

    if (!content || !userId) {
      return NextResponse.json(
        { success: false, error: 'Content and userId are required' },
        { status: 400 }
      );
    }

    const ragCache = RAGCacheService.getInstance();
    const perplexityService = new PerplexityService();

    // Step 1: Content Validation & Compliance Check
    const validationResult = await validateContent(content);
    if (!validationResult.isValid) {
      return NextResponse.json({
        success: false,
        error: 'Content validation failed',
        details: validationResult.violations,
        suggestions: validationResult.suggestions
      }, { status: 400 });
    }

    // Step 2: Get user preferences and bias from RAG cache
    const userProfile = ragCache.getUserProfile(userId);
    if (!userProfile) {
      return NextResponse.json({
        success: false,
        error: 'User profile not found. Please complete the writing voice questionnaire first.'
      }, { status: 400 });
    }

    // Step 3: Enhanced research if news article is provided
    let enhancedContent = content;
    let researchData = null;

    if (newsArticleId && researchContext) {
      try {
        // Use Perplexity for additional research
        const researchQuery = `Research latest 2025 developments about: ${researchContext.title}. Focus on CA and accounting implications. Provide actionable insights for chartered accountants.`;
        researchData = await perplexityService.research(researchQuery);
        
        // Enhance content with research
        enhancedContent = await enhanceContentWithResearch(content, researchData, userProfile);
      } catch (error) {
        console.warn('Research enhancement failed:', error);
        // Continue with original content
      }
    }

    // Step 4: Apply voice bias and user preferences
    const biasedContent = ragCache.generateBiasedContent(
      userId, 
      topic || 'Professional post', 
      'twitter',
      voiceType
    );

    // Step 5: Final compliance check on generated content
    const finalComplianceCheck = ICAIComplianceChecker.checkContent(biasedContent.content);
    
    if (finalComplianceCheck.violationLevel === 'high') {
      return NextResponse.json({
        success: false,
        error: 'Generated content violates ICAI guidelines',
        details: finalComplianceCheck.violations,
        suggestions: finalComplianceCheck.suggestions
      }, { status: 400 });
    }

    // Step 6: Format for Twitter and create thread if needed
    const formattedContent = TwitterService.formatForTwitter(biasedContent.content);
    const thread = formattedContent.length > 280 ? 
      TwitterService.createThread(formattedContent) : [formattedContent];

    // Step 7: Prepare post data
    const postData = {
      content: thread,
      scheduledFor: scheduleFor,
      images,
      userId,
      topic,
      voiceType,
      researchContext: researchData ? {
        newsArticleId,
        researchSummary: researchData.summary,
        sources: researchData.sources
      } : null,
      complianceCheck: finalComplianceCheck,
      userProfile: {
        voiceType: userProfile.primaryVoice,
        preferences: userProfile.preferences
      }
    };

    // Step 8: Save to RAG cache for future bias learning
    ragCache.addContentInteraction(userId, {
      content: biasedContent.content,
      topic,
      voiceType,
      platform: 'twitter',
      engagement: 'created',
      timestamp: new Date().toISOString()
    });

    return NextResponse.json({
      success: true,
      data: {
        post: postData,
        thread: thread.length > 1 ? thread : null,
        complianceScore: finalComplianceCheck.score,
        voiceMatch: biasedContent.voiceMatch,
        researchEnhanced: !!researchData
      }
    });

  } catch (error) {
    console.error('Post automation error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to process post automation request' },
      { status: 500 }
    );
  }
}

async function validateContent(content: string) {
  const violations = [];
  const suggestions = [];

  // Check for profanity
  for (const pattern of PROFANITY_PATTERNS) {
    if (pattern.test(content)) {
      violations.push({
        type: 'profanity',
        message: 'Content contains inappropriate language',
        severity: 'high'
      });
      suggestions.push('Remove inappropriate language to maintain professional standards');
      break;
    }
  }

  // Check for ICAI violations
  for (const pattern of ICAI_VIOLATIONS) {
    if (pattern.test(content)) {
      violations.push({
        type: 'icai_violation',
        message: 'Content may violate ICAI professional conduct guidelines',
        severity: 'high'
      });
      suggestions.push('Rephrase to comply with ICAI professional standards');
      break;
    }
  }

  // Check content length
  if (content.length < 10) {
    violations.push({
      type: 'content_length',
      message: 'Content too short for meaningful engagement',
      severity: 'medium'
    });
    suggestions.push('Add more context or insights to improve engagement');
  }

  // ICAI Compliance check
  const complianceResult = ICAIComplianceChecker.checkContent(content);
  if (complianceResult.violationLevel === 'high') {
    violations.push(...complianceResult.violations.map(v => ({
      type: 'icai_compliance',
      message: v,
      severity: 'high'
    })));
    suggestions.push(...complianceResult.suggestions);
  }

  return {
    isValid: violations.filter(v => v.severity === 'high').length === 0,
    violations,
    suggestions
  };
}

async function enhanceContentWithResearch(content: string, researchData: any, userProfile: any) {
  // Use research data to enhance the original content
  const researchInsights = researchData.summary || '';
  const sources = researchData.sources || [];
  
  // Apply user's writing voice to incorporate research
  const enhancedPrompt = `
    Original content: ${content}
    Research insights: ${researchInsights}
    User voice: ${userProfile.primaryVoice}
    
    Enhance the original content by incorporating relevant research insights while maintaining the user's writing voice and ensuring ICAI compliance.
  `;

  // This would typically call an LLM service to enhance the content
  // For now, return a simple concatenation
  return content + '\n\nBased on latest 2025 research: ' + researchInsights.substring(0, 100) + '...';
}

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const userId = searchParams.get('userId');
  
  if (!userId) {
    return NextResponse.json(
      { success: false, error: 'userId is required' },
      { status: 400 }
    );
  }

  const ragCache = RAGCacheService.getInstance();
  const userProfile = ragCache.getUserProfile(userId);
  
  return NextResponse.json({
    success: true,
    data: {
      hasProfile: !!userProfile,
      profile: userProfile ? {
        voiceType: userProfile.primaryVoice,
        preferences: userProfile.preferences,
        contentHistory: userProfile.contentHistory?.slice(-5) // Last 5 interactions
      } : null
    }
  });
}