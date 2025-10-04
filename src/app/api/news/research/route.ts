import { NextRequest, NextResponse } from 'next/server';
import { PerplexityService } from '@/lib/perplexity-service';

export async function POST(request: NextRequest) {
  try {
    const { newsTitle, newsContent, userId, focus = 'ca-implications' } = await request.json();

    if (!newsTitle) {
      return NextResponse.json(
        { success: false, error: 'News title is required' },
        { status: 400 }
      );
    }

    const perplexityService = new PerplexityService();
    
    // Create focused research query for CA professionals
    const researchQuery = generateResearchQuery(newsTitle, newsContent, focus);
    
    // Conduct research
    const researchResult = await perplexityService.research(researchQuery);
    
    // Extract key insights for post creation
    const insights = extractCAInsights(researchResult);
    
    return NextResponse.json({
      success: true,
      data: {
        originalNews: {
          title: newsTitle,
          content: newsContent
        },
        research: {
          summary: researchResult.summary,
          keyPoints: insights.keyPoints,
          caImplications: insights.caImplications,
          actionableItems: insights.actionableItems,
          sources: researchResult.sources,
          confidence: researchResult.confidence
        },
        postSuggestions: {
          angles: insights.postAngles,
          hooks: insights.hooks,
          callToActions: insights.callToActions
        }
      }
    });

  } catch (error) {
    console.error('News research error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to research news article' },
      { status: 500 }
    );
  }
}

function generateResearchQuery(title: string, content: string, focus: string) {
  const queries = {
    'ca-implications': `Research the accounting and auditing implications of: "${title}". Focus on how this affects chartered accountants, compliance requirements, and professional practices in 2025. Include regulatory impacts and practical steps for CA firms.`,
    
    'client-impact': `Analyze how "${title}" will impact clients of chartered accountants. Focus on business implications, tax consequences, and compliance requirements that CAs should advise their clients about in 2025.`,
    
    'regulatory-changes': `Research the regulatory and legal implications of: "${title}". Focus on new compliance requirements, deadlines, and procedural changes that chartered accountants must be aware of in 2025.`,
    
    'technology-impact': `Analyze the technology and digital transformation aspects of: "${title}". Focus on how this affects CA firms' operations, client services, and professional tools in 2025.`,
    
    'industry-trends': `Research the broader industry trends and market implications of: "${title}". Focus on how this shapes the accounting profession and creates opportunities for chartered accountants in 2025.`
  };

  return queries[focus as keyof typeof queries] || queries['ca-implications'];
}

function extractCAInsights(researchResult: any) {
  // Extract structured insights from research result
  const text = researchResult.summary || '';
  
  return {
    keyPoints: extractKeyPoints(text),
    caImplications: extractCAImplications(text),
    actionableItems: extractActionableItems(text),
    postAngles: generatePostAngles(text),
    hooks: generateHooks(text),
    callToActions: generateCallToActions(text)
  };
}

function extractKeyPoints(text: string): string[] {
  // Extract 3-5 key points from the research
  const sentences = text.split('.').filter(s => s.trim().length > 20);
  return sentences.slice(0, 5).map(s => s.trim() + '.');
}

function extractCAImplications(text: string): string[] {
  // Extract specific implications for CA professionals
  const implications = [];
  
  if (text.includes('compliance') || text.includes('regulation')) {
    implications.push('New compliance requirements may affect audit procedures');
  }
  
  if (text.includes('tax') || text.includes('GST')) {
    implications.push('Tax advisory services may need updates');
  }
  
  if (text.includes('digital') || text.includes('technology')) {
    implications.push('Digital transformation may require new skills');
  }
  
  if (text.includes('reporting') || text.includes('disclosure')) {
    implications.push('Financial reporting standards may be impacted');
  }
  
  return implications.length > 0 ? implications : ['Professional practice may be affected - stay updated'];
}

function extractActionableItems(text: string): string[] {
  return [
    'Review current client advisory procedures',
    'Update compliance checklists',
    'Communicate changes to relevant clients',
    'Consider additional training needs',
    'Monitor official notifications for updates'
  ];
}

function generatePostAngles(text: string): string[] {
  return [
    'Educational: Explain the implications for businesses',
    'Advisory: Provide actionable steps for clients',
    'Industry insight: Share professional perspective',
    'Compliance focus: Highlight regulatory requirements',
    'Future outlook: Discuss long-term implications'
  ];
}

function generateHooks(text: string): string[] {
  return [
    'Breaking: What every CA needs to know about...',
    'This changes everything for...',
    '3 things this means for your clients...',
    'Here\'s what the experts aren\'t telling you...',
    'The hidden implications of...'
  ];
}

function generateCallToActions(text: string): string[] {
  return [
    'What are your thoughts on this development?',
    'How are you preparing your clients for this change?',
    'Share this with fellow CAs who need to know',
    'Comment below if you have questions',
    'Follow for more professional updates'
  ];
}