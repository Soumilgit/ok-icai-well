import { NextRequest, NextResponse } from 'next/server';

interface PostGenerationRequest {
  newsTitle: string;
  newsContent?: string;
  postType: 'linkedin' | 'twitter' | 'article';
  summary?: string;
  keyPoints?: string[];
  caImplications?: string[];
}

// Platform-specific prompts for optimal content generation
const POST_PROMPTS = {
  linkedin: `Create a professional LinkedIn post for CA professionals about the news. Format requirements:

CRITICAL: Use clean, newspaper-style formatting - NO asterisks, NO markdown, NO bold markers (**text**), NO special formatting symbols.

Structure:
- Engaging hook in first line  
- Key professional insights (2-3 bullet points using • only)
- Implications for CA practice
- Call-to-action question for engagement
- Relevant hashtags (5-7 professional tags)

Style Guidelines:
- Professional tone with subtle personal touch
- ICAI-compliant language
- Focus on actionable insights
- Include emoji strategically (1-2 max at start)
- Length: 200-300 words for complete content
- End with engagement question
- Clean newspaper-style text only

Example Format:
🔍 [Hook about the news impact - write complete sentences]

Key takeaways for CA professionals:
• [Complete detailed insight 1]
• [Complete detailed insight 2]  
• [Complete detailed insight 3]

This affects [specific area] and requires [action/consideration - write full sentences].

What's your take on [engagement question]?

#CharteredAccountant #CANews #Compliance #Finance #ICAI #ProfessionalDevelopment

IMPORTANT: Generate COMPLETE content, not truncated. Use clean text formatting like newspapers.`,

  twitter: `Create an engaging Twitter thread for CA professionals about the news. Format requirements:

CRITICAL: Use clean formatting - NO asterisks, NO markdown, NO bold markers, NO special formatting symbols.

Thread Structure:
- Tweet 1: Hook + main point (280 chars max)
- Tweet 2: Key implication (280 chars max)  
- Tweet 3: Action item for CAs (280 chars max)
- Tweet 4: Relevant hashtags + CTA (280 chars max)

Style Guidelines:
- Concise, punchy language
- Use thread numbering (1/4, 2/4, etc.)
- Include relevant emojis
- Professional yet accessible tone
- Focus on immediate actionable insights
- ICAI-compliant terminology
- Clean newspaper-style text only

Example Format:
1/4 🚨 [Complete news headline impact statement]

This changes [specific aspect] for CA professionals.

2/4 📊 Key implications:
• [Complete point 1]
• [Complete point 2]

3/4 ✅ Action required:
[Complete specific steps CAs should take]

4/4 💬 Questions? Drop them below!

#CANews #Compliance #Finance #CharteredAccountant

IMPORTANT: Generate COMPLETE 4-tweet thread, not truncated. Clean text only.`,

  article: `Create a comprehensive professional article for CA professionals about the news. Format requirements:

CRITICAL: Use clean newspaper formatting - NO asterisks, NO markdown, NO bold markers (**text**), NO special formatting symbols. Write like a professional newspaper article.

Article Structure:
- Compelling headline
- Executive summary (75-100 words)
- Main body with detailed analysis (500-800 words)
- Professional implications section
- Conclusion with recommendations

Content Guidelines:
- In-depth analysis with regulatory context
- Multiple sections with clear headings
- Professional newspaper tone throughout
- Include specific regulatory references
- Cite relevant standards (ICAI, RBI, etc.)
- Actionable recommendations
- Complete sentences and paragraphs
- Clean professional formatting

Section Headings Example:
[Compelling Headline]

Executive Summary
[Complete brief overview paragraph]

Regulatory Context and Background
[Complete detailed context paragraphs]

Impact Analysis for CA Professionals
[Complete professional implications paragraphs]

Compliance Considerations
[Complete specific requirements paragraphs]

Recommendations and Next Steps
[Complete actionable advice paragraphs]

Conclusion
[Complete key takeaways paragraph]

IMPORTANT: Generate COMPLETE article (800+ words), not truncated. Use clean newspaper-style formatting only.`
};

// News context analysis function
function analyzeNewsContext(newsTitle: string, newsContent: string = '') {
  const title = newsTitle.toLowerCase();
  const content = newsContent.toLowerCase();
  const combined = `${title} ${content}`;

  // Determine category and main topic
  let category = 'General';
  let mainTopic = 'Professional Update';
  let impact = 'general professional implications';
  let urgency = 'moderate';

  // Tax-related news
  if (combined.includes('tax') || combined.includes('gst') || combined.includes('income tax') || 
      combined.includes('corporate tax') || combined.includes('filing') || combined.includes('deadline')) {
    category = 'Taxation';
    
    if (combined.includes('deadline') || combined.includes('extended') || combined.includes('filing')) {
      mainTopic = 'Tax Filing & Deadlines';
      impact = 'immediate filing and compliance obligations';
      urgency = 'high';
    } else if (combined.includes('gst')) {
      mainTopic = 'GST Compliance';
      impact = 'GST registration, filing, and input tax credit implications';
      urgency = combined.includes('penalty') || combined.includes('audit') ? 'high' : 'moderate';
    } else if (combined.includes('corporate tax')) {
      mainTopic = 'Corporate Taxation';
      impact = 'corporate tax compliance and strategic planning';
      urgency = 'moderate';
    }
  }
  
  // Banking and finance news
  else if (combined.includes('bank') || combined.includes('rbi') || combined.includes('lending') || 
           combined.includes('credit') || combined.includes('financial institution')) {
    category = 'Banking & Finance';
    mainTopic = 'Banking Sector Updates';
    impact = 'audit procedures for banking clients and financial risk assessment';
    urgency = combined.includes('crisis') || combined.includes('fraud') ? 'high' : 'moderate';
  }
  
  // ICAI and professional standards
  else if (combined.includes('icai') || combined.includes('audit') || combined.includes('chartered accountant') ||
           combined.includes('professional standard') || combined.includes('ethics')) {
    category = 'Professional Standards';
    mainTopic = 'ICAI Guidelines & Professional Development';
    impact = 'professional certification, continuing education, and practice standards';
    urgency = combined.includes('mandatory') || combined.includes('compliance') ? 'high' : 'moderate';
  }
  
  // Regulatory and compliance
  else if (combined.includes('sebi') || combined.includes('mca') || combined.includes('compliance') ||
           combined.includes('regulation') || combined.includes('penalty')) {
    category = 'Regulatory Compliance';
    mainTopic = 'Regulatory Updates';
    impact = 'compliance frameworks and regulatory adherence requirements';
    urgency = combined.includes('penalty') || combined.includes('enforcement') ? 'high' : 'moderate';
  }
  
  // Economic and market news
  else if (combined.includes('economy') || combined.includes('market') || combined.includes('growth') ||
           combined.includes('inflation') || combined.includes('gdp')) {
    category = 'Economic Trends';
    mainTopic = 'Economic Analysis';
    impact = 'economic forecasting and client advisory services';
    urgency = 'low';
  }

  return {
    category,
    mainTopic,
    impact,
    urgency,
    isUrgent: urgency === 'high',
    requiresImmediateAction: combined.includes('deadline') || combined.includes('penalty') || combined.includes('mandatory')
  };
}

// Enhanced content generation using Perplexity API
export async function POST(request: NextRequest) {
  try {
    const { newsTitle, newsContent, postType, summary, keyPoints, caImplications }: PostGenerationRequest = await request.json();

    console.log('📝 Generate Post Request:', { newsTitle, postType });

    if (!newsTitle || !postType) {
      return NextResponse.json({
        success: false,
        error: 'News title and post type are required'
      }, { status: 400 });
    }

    if (!process.env.PERPLEXITY_API_KEY) {
      console.error('❌ PERPLEXITY_API_KEY not found in environment variables');
      return NextResponse.json({
        success: false,
        error: 'Perplexity API key not configured',
        content: generateFallbackPost(newsTitle, postType, summary, keyPoints),
        source: 'fallback-no-key'
      });
    }

    console.log('✅ Perplexity API key found, proceeding with generation...');

    // Analyze the news context to create targeted content
    const newsAnalysis = analyzeNewsContext(newsTitle, newsContent);
    const platformPrompt = POST_PROMPTS[postType];
    
    const contextualPrompt = `${platformPrompt}

**SPECIFIC NEWS ANALYSIS:**
News Title: "${newsTitle}"
News Category: ${newsAnalysis.category}
Key Topic: ${newsAnalysis.mainTopic}
Professional Impact: ${newsAnalysis.impact}
Urgency Level: ${newsAnalysis.urgency}

**DETAILED CONTEXT:**
News Content: ${newsContent || 'Not provided'}
Summary: ${summary || 'Not provided'}
Key Points: ${keyPoints?.join(', ') || 'Not provided'}
CA Implications: ${caImplications?.join(', ') || 'Not provided'}

**CONTENT REQUIREMENTS:**
1. Make the content SPECIFICALLY about "${newsTitle}" - not generic
2. Address the exact implications of THIS specific news item
3. Include relevant deadlines, actions, or requirements mentioned in the news
4. Use specific terminology related to ${newsAnalysis.mainTopic}
5. Focus on ${newsAnalysis.impact} for CA professionals
6. Match the ${newsAnalysis.urgency} tone in the content

Generate ${postType} content that is specifically tailored to "${newsTitle}" and follows the format requirements above. Avoid generic templates - make it contextually specific to this exact news item.`;

    console.log('🚀 Making AI API call...');
    
    // Try Perplexity first
    let response;
    let apiUsed = 'perplexity';
    
    try {
      response = await fetch('https://api.perplexity.ai/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${process.env.PERPLEXITY_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'llama-3.1-sonar-large-128k-online',
          messages: [
            {
              role: 'system',
              content: 'You are an expert content creator specializing in professional content for Chartered Accountants in India. You understand ICAI guidelines, regulatory requirements, and effective social media engagement strategies for CA professionals. Create compelling, compliant, and engaging content that resonates with the CA community.'
            },
            {
              role: 'user',
              content: contextualPrompt
            }
          ],
          temperature: 0.4,
          max_tokens: postType === 'article' ? 1500 : postType === 'linkedin' ? 800 : 500
        }),
      });
    } catch (perplexityError) {
      console.log('⚠️ Perplexity failed, trying Gemini...', perplexityError);
      
      // Fallback to Gemini API
      try {
        response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-lite:generateContent?key=${process.env.GEMINI_API_KEY}`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            contents: [{
              parts: [{
                text: `IMPORTANT: Do NOT include <think> tags, reasoning steps, or any internal thoughts in your response. Only provide the final, clean content that users will see. No meta-commentary, no process explanation, no reasoning tags.

You are an expert content creator specializing in professional content for Chartered Accountants in India. You understand ICAI guidelines, regulatory requirements, and effective social media engagement strategies for CA professionals. Create compelling, compliant, and engaging content that resonates with the CA community.

${contextualPrompt}`
              }]
            }],
            generationConfig: {
              temperature: 0.4,
              maxOutputTokens: postType === 'article' ? 1500 : postType === 'linkedin' ? 800 : 500
            }
          }),
        });
        apiUsed = 'gemini';
      } catch (geminiError) {
        console.error('❌ Both Perplexity and Gemini failed:', geminiError);
        throw new Error('All AI APIs failed');
      }
    }

    console.log(`📡 ${apiUsed.toUpperCase()} API Response Status:`, response.status);

    if (!response.ok) {
      const errorData = await response.text();
      console.error(`❌ ${apiUsed.toUpperCase()} API error:`, response.status, errorData);
      
      // If this was Perplexity, try Gemini
      if (apiUsed === 'perplexity' && process.env.GEMINI_API_KEY) {
        console.log('🔄 Perplexity failed, trying Gemini as backup...');
        try {
          response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-lite:generateContent?key=${process.env.GEMINI_API_KEY}`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              contents: [{
                parts: [{
                  text: `IMPORTANT: Do NOT include <think> tags, reasoning steps, or any internal thoughts in your response. Only provide the final, clean content that users will see. No meta-commentary, no process explanation, no reasoning tags.

You are an expert content creator specializing in professional content for Chartered Accountants in India. You understand ICAI guidelines, regulatory requirements, and effective social media engagement strategies for CA professionals. Create compelling, compliant, and engaging content that resonates with the CA community.

${contextualPrompt}`
                }]
              }],
              generationConfig: {
                temperature: 0.4,
                maxOutputTokens: postType === 'article' ? 1500 : postType === 'linkedin' ? 800 : 500
              }
            }),
          });
          apiUsed = 'gemini';
          
          if (!response.ok) {
            throw new Error(`Gemini API error: ${response.status}`);
          }
        } catch (geminiError) {
          console.error('❌ Gemini backup also failed:', geminiError);
          return NextResponse.json({
            success: true,
            content: generateFallbackPost(newsTitle, postType, summary, keyPoints),
            source: 'fallback-all-apis-failed',
            error: `All APIs failed. Last error: ${geminiError}`
          });
        }
      } else {
        return NextResponse.json({
          success: true,
          content: generateFallbackPost(newsTitle, postType, summary, keyPoints),
          source: 'fallback-api-error',
          error: `API Error: ${response.status} - ${errorData}`
        });
      }
    }

    const data = await response.json();
    console.log(`🎉 ${apiUsed.toUpperCase()} API response received`);
    
    // Handle different response formats
    let generatedContent;
    if (apiUsed === 'gemini') {
      generatedContent = data.candidates?.[0]?.content?.parts?.[0]?.text;
    } else {
      generatedContent = data.choices?.[0]?.message?.content;
    }

    if (!generatedContent) {
      console.error(`❌ No content in ${apiUsed.toUpperCase()} response:`, data);
      return NextResponse.json({
        success: true,
        content: generateFallbackPost(newsTitle, postType, summary, keyPoints),
        source: `fallback-empty-response-${apiUsed}`
      });
    }

    // Clean up any <think> tags or internal reasoning from AI responses
    if (apiUsed === 'gemini' || apiUsed === 'groq') {
      generatedContent = generatedContent
        .replace(/<think>[\s\S]*?<\/think>/g, '') // Remove <think></think> blocks
        .replace(/^<think>[\s\S]*?$/gm, '') // Remove standalone <think> lines
        .replace(/^\s*$/gm, '') // Remove empty lines
        .trim(); // Trim whitespace
    }

    console.log(`✅ Successfully generated content via ${apiUsed.toUpperCase()}`);
    return NextResponse.json({
      success: true,
      content: generatedContent,
      source: apiUsed,
      metadata: {
        postType,
        newsTitle,
        wordCount: generatedContent.split(' ').length,
        generatedAt: new Date().toISOString(),
        apiUsed
      }
    });

  } catch (error) {
    console.error('Post generation error:', error);
    
    const requestData = await request.json().catch(() => ({}));
    
    return NextResponse.json({
      success: true,
      content: generateFallbackPost(
        requestData.newsTitle || 'Latest News Update',
        requestData.postType || 'linkedin',
        requestData.summary,
        requestData.keyPoints
      ),
      source: 'fallback',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}

// Fallback post generation for when Perplexity API is unavailable
function generateFallbackPost(
  newsTitle: string,
  postType: 'linkedin' | 'twitter' | 'article',
  summary?: string,
  keyPoints?: string[]
): string {
  
  // Analyze the specific news context for fallback content
  const analysis = analyzeNewsContext(newsTitle, summary || '');
  
  // Generate contextually relevant points based on the news
  let contextualPoints: string[];
  
  if (analysis.category === 'Taxation') {
    contextualPoints = [
      `This ${analysis.mainTopic.toLowerCase()} development requires immediate attention from tax practitioners and their clients`,
      'Updated compliance procedures must be implemented across all affected client portfolios to ensure adherence',
      'Revised filing strategies and comprehensive deadline management protocols need immediate implementation'
    ];
  } else if (analysis.category === 'Banking & Finance') {
    contextualPoints = [
      'Enhanced audit procedures and risk assessment protocols are now required for all banking sector clients',
      'Risk assessment frameworks must be comprehensively updated for financial institutions and their corporate relationships',
      'Credit analysis methodologies and lending compliance review processes require immediate enhancement'
    ];
  } else if (analysis.category === 'Professional Standards') {
    contextualPoints = [
      'ICAI guidelines now require updated professional practice standards and enhanced quality control mechanisms',
      'Continuing education requirements and professional certification standards have been significantly enhanced',
      'Quality control procedures and comprehensive peer review processes must be strengthened across all practices'
    ];
  } else if (analysis.category === 'Regulatory Compliance') {
    contextualPoints = [
      'New comprehensive compliance frameworks require immediate implementation across all affected business operations',
      'Regulatory reporting standards and documentation requirements have been significantly updated and enhanced',
      'Client advisory services must be expanded to address these new regulatory changes and compliance obligations'
    ];
  } else {
    contextualPoints = keyPoints?.slice(0, 3) || [
      'Professional practice standards require comprehensive review and enhancement to meet evolving industry requirements',
      'Client advisory protocols must be updated and expanded to address current regulatory and compliance requirements',
      'Strategic planning processes need significant adjustments to navigate the evolving professional landscape effectively'
    ];
  }

  const points = contextualPoints;

  switch (postType) {
    case 'linkedin':
      const urgencyEmoji = analysis.urgency === 'high' ? '�' : analysis.urgency === 'moderate' ? '📋' : '📊';
      const actionVerb = analysis.requiresImmediateAction ? 'requires immediate action' : 'needs attention';
      
      return `${urgencyEmoji} ${analysis.category} Update: ${newsTitle}

This ${analysis.mainTopic.toLowerCase()} development ${actionVerb} from CA professionals across India.

Key implications for ${analysis.mainTopic}:
• ${points[0]}
• ${points[1]}
• ${points[2]}

Impact on CA Practice: ${analysis.impact}

${analysis.requiresImmediateAction ? 'Immediate action required - ' : ''}How is your practice preparing for these ${analysis.mainTopic.toLowerCase()} changes?

${summary ? `\n📝 Context: ${summary.substring(0, 80)}...\n` : ''}

#CharteredAccountant #${analysis.category.replace(/\s+/g, '')} #CANews #Compliance #ICAI #ProfessionalDevelopment`;

    case 'twitter':
      const tweetEmoji = analysis.urgency === 'high' ? '🚨' : '📢';
      const actionText = analysis.requiresImmediateAction ? 'Immediate action needed' : 'Review and adapt';
      
      return `1/4 ${tweetEmoji} ${analysis.category}: ${newsTitle.length > 100 ? newsTitle.substring(0, 97) + '...' : newsTitle}

${analysis.impact}

2/4 📊 ${analysis.mainTopic} implications:
• ${points[0].substring(0, 60)}...
• ${points[1].substring(0, 60)}...

3/4 ✅ ${actionText}:
${analysis.requiresImmediateAction ? 'Update procedures NOW' : 'Review compliance frameworks and client advisory protocols'}

4/4 💬 How are you handling this ${analysis.mainTopic.toLowerCase()} update?

#${analysis.category.replace(/\s+/g, '')} #CANews #CharteredAccountant`;

    case 'article':
      return `${newsTitle}: ${analysis.category} Analysis for CA Professionals

Executive Summary

${summary || `This ${analysis.mainTopic.toLowerCase()} development in ${analysis.category.toLowerCase()} ${analysis.requiresImmediateAction ? 'requires immediate action' : 'warrants careful attention'} from Chartered Accountants across India. The implications directly affect ${analysis.impact} across the profession.`}

${analysis.mainTopic} Impact Analysis

This ${analysis.category.toLowerCase()} announcement brings several critical considerations for practicing Chartered Accountants specializing in ${analysis.mainTopic.toLowerCase()}:

Impact Area 1: ${points[0]} ${analysis.requiresImmediateAction ? 'Immediate implementation required' : 'Strategic planning needed'} to address compliance and operational changes in ${analysis.mainTopic.toLowerCase()}.

Impact Area 2: ${points[1]} ${analysis.category} standards must be reviewed and updated to ensure alignment with new ${analysis.mainTopic.toLowerCase()} requirements.

Impact Area 3: ${points[2]} ${analysis.urgency === 'high' ? 'Urgent action items' : 'Strategic opportunities'} emerge for specialized ${analysis.mainTopic.toLowerCase()} advisory services.

Professional Action Plan

${analysis.requiresImmediateAction ? 'Immediate Actions (Next 7 Days)' : 'Short-term Actions (Next 30 Days)'}

${analysis.mainTopic} Review: Assess current ${analysis.mainTopic.toLowerCase()} procedures against new requirements and ensure all protocols meet the latest regulatory standards.

Client Impact Analysis: Identify affected clients and prioritize communication to ensure seamless transition and compliance across all service areas.

Compliance Update: ${analysis.requiresImmediateAction ? 'Immediately update' : 'Schedule updates to'} relevant compliance frameworks to maintain professional standards and regulatory adherence.

Medium-term Strategy (Next Quarter)

Team Training: Comprehensive ${analysis.mainTopic.toLowerCase()} training for all team members to ensure expertise in handling new requirements and client needs.

Practice Enhancement: Develop specialized ${analysis.mainTopic.toLowerCase()} service offerings that address emerging market demands and regulatory changes.

Client Advisory: Proactive consultation on ${analysis.mainTopic.toLowerCase()} implications to help clients navigate regulatory changes effectively.

${analysis.category} Context

This development reflects the evolving landscape of ${analysis.category.toLowerCase()} in India, emphasizing the critical role of CA professionals in maintaining compliance and providing strategic guidance in ${analysis.mainTopic.toLowerCase()}. The changes demonstrate the profession's ongoing commitment to adapting to regulatory evolution while maintaining service excellence.

Recommendations for CA Practices

For ${analysis.mainTopic} Specialists: ${analysis.requiresImmediateAction ? 'Immediately review and update' : 'Strategically enhance'} current ${analysis.mainTopic.toLowerCase()} procedures and develop specialized expertise in affected areas of ${analysis.category.toLowerCase()}.

For General Practitioners: Assess client portfolio exposure to ${analysis.mainTopic.toLowerCase()} changes and consider partnership opportunities with ${analysis.mainTopic.toLowerCase()} specialists to provide comprehensive service coverage.

Conclusion

${analysis.requiresImmediateAction ? 'Immediate adaptation to' : 'Strategic positioning around'} this ${analysis.mainTopic.toLowerCase()} development will differentiate successful CA practices. The profession must embrace these ${analysis.category.toLowerCase()} changes while maintaining excellence in client service and regulatory compliance.

${analysis.urgency === 'high' ? 'Note: This analysis reflects urgent regulatory changes requiring immediate professional attention.' : ''}

This ${analysis.category.toLowerCase()} analysis is provided for professional guidance specific to ${analysis.mainTopic.toLowerCase()} and should be supplemented with detailed regulatory research based on individual practice requirements.`;

    default:
      return `Professional update: ${newsTitle}. Key implications for CA professionals require attention to compliance and advisory protocols.`;
  }
}