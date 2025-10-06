import { NextRequest, NextResponse } from 'next/server';

interface SearchResult {
  title: string;
  url: string;
  snippet: string;
  source: string;
  relevance: number;
}

interface WebSearchResponse {
  query: string;
  results: SearchResult[];
  timestamp: number;
  sources_count: number;
}

// Trusted sources for CA/Finance news and information
const TRUSTED_SOURCES = [
  'rbi.org.in',
  'incometax.gov.in', 
  'gst.gov.in',
  'icai.org',
  'mca.gov.in',
  'sebi.gov.in',
  'finmin.nic.in',
  'economictimes.indiatimes.com',
  'business-standard.com',
  'financialexpress.com',
  'moneycontrol.com',
  'livemint.com',
  'thehindubusinessline.com'
];

// Generate search queries based on news headline
function generateSearchQueries(headline: string, category: string[]): string[] {
  const queries: string[] = [];
  
  // Base query with headline
  queries.push(headline);
  
  // Add category-specific queries
  if (category.includes('Banking') || headline.toLowerCase().includes('rbi')) {
    queries.push(`RBI ${headline.split(' ').slice(0, 3).join(' ')}`);
    queries.push(`banking regulation ${headline.split(' ').slice(0, 2).join(' ')}`);
  }
  
  if (category.includes('GST') || headline.toLowerCase().includes('gst')) {
    queries.push(`GST ${headline.split(' ').slice(0, 3).join(' ')}`);
    queries.push(`GST compliance ${headline.split(' ').slice(0, 2).join(' ')}`);
  }
  
  if (category.includes('ICAI') || headline.toLowerCase().includes('icai')) {
    queries.push(`ICAI ${headline.split(' ').slice(0, 3).join(' ')}`);
    queries.push(`chartered accountant ${headline.split(' ').slice(0, 2).join(' ')}`);
  }
  
  if (category.includes('Taxation') || headline.toLowerCase().includes('tax')) {
    queries.push(`income tax ${headline.split(' ').slice(0, 3).join(' ')}`);
    queries.push(`taxation ${headline.split(' ').slice(0, 2).join(' ')}`);
  }
  
  return queries.slice(0, 3); // Return top 3 queries
}

// Mock search function (replace with actual search API like Google Custom Search, Bing, etc.)
async function performWebSearch(query: string): Promise<SearchResult[]> {
  // In production, this would use Google Custom Search API, Bing API, or similar
  // For now, we'll generate relevant results based on the query
  
  const results: SearchResult[] = [];
  
  // Generate relevant results based on query content
  if (query.toLowerCase().includes('rbi')) {
    results.push(
      {
        title: 'RBI Issues New Guidelines on Digital Banking',
        url: 'https://www.rbi.org.in/Scripts/NotificationUser.aspx?Id=12345',
        snippet: 'The Reserve Bank of India has issued comprehensive guidelines for digital banking operations...',
        source: 'Reserve Bank of India',
        relevance: 0.95
      },
      {
        title: 'RBI Monetary Policy Committee Decisions',
        url: 'https://www.rbi.org.in/Scripts/BS_PressReleaseDisplay.aspx?prid=54321',
        snippet: 'Latest decisions from the RBI MPC meeting regarding interest rates and policy measures...',
        source: 'RBI Official',
        relevance: 0.90
      }
    );
  }
  
  if (query.toLowerCase().includes('gst')) {
    results.push(
      {
        title: 'GST Council Announces New Return Filing System',
        url: 'https://www.gst.gov.in/newsandupdates/read/456789',
        snippet: 'The GST Council has approved a new simplified return filing system for taxpayers...',
        source: 'GST Portal',
        relevance: 0.92
      },
      {
        title: 'Latest GST Rates and Notifications',
        url: 'https://www.cbic.gov.in/resources//htdocs-cbec/gst/notifications.html',
        snippet: 'Updated GST rates and recent notifications from the Central Board of Indirect Taxes...',
        source: 'CBIC Official',
        relevance: 0.88
      }
    );
  }
  
  if (query.toLowerCase().includes('icai') || query.toLowerCase().includes('chartered accountant')) {
    results.push(
      {
        title: 'ICAI Launches New Digital Audit Standards',
        url: 'https://www.icai.org/new_post.html?post_id=17890',
        snippet: 'The Institute of Chartered Accountants of India introduces new digital audit standards...',
        source: 'ICAI Official',
        relevance: 0.93
      },
      {
        title: 'CA Examination Schedule and Guidelines',
        url: 'https://www.icai.org/new_category.html?c_id=302',
        snippet: 'Latest updates on CA examination schedule and new guidelines for candidates...',
        source: 'ICAI',
        relevance: 0.85
      }
    );
  }
  
  if (query.toLowerCase().includes('tax') || query.toLowerCase().includes('income')) {
    results.push(
      {
        title: 'Income Tax Filing Deadlines Extended',
        url: 'https://www.incometax.gov.in/iec/foportal/news-and-updates/news-240101',
        snippet: 'The Income Tax Department extends filing deadlines for various categories of taxpayers...',
        source: 'Income Tax Department',
        relevance: 0.91
      },
      {
        title: 'New Tax Compliance Requirements for Businesses',
        url: 'https://www.incometax.gov.in/iec/foportal/help/individual/return-applicable-1',
        snippet: 'Updated tax compliance requirements and procedures for business entities...',
        source: 'IT Department',
        relevance: 0.87
      }
    );
  }
  
  // Add general finance news results
  results.push(
    {
      title: 'Economic Times - Latest Financial News',
      url: 'https://economictimes.indiatimes.com/topic/chartered-accountant',
      snippet: 'Stay updated with the latest news and trends in accounting and finance...',
      source: 'Economic Times',
      relevance: 0.75
    },
    {
      title: 'Business Standard - Accounting Updates',
      url: 'https://www.business-standard.com/topic/accounting',
      snippet: 'Comprehensive coverage of accounting standards and business updates...',
      source: 'Business Standard',
      relevance: 0.72
    }
  );
  
  return results.slice(0, 5); // Return top 5 results
}

// Calculate relevance score based on source trustworthiness and content match
function calculateSourceRelevance(url: string, query: string): number {
  let relevance = 0.5; // Base relevance
  
  // Boost relevance for trusted sources
  const domain = new URL(url).hostname.toLowerCase();
  if (TRUSTED_SOURCES.some(source => domain.includes(source))) {
    relevance += 0.3;
  }
  
  // Boost relevance if domain matches query context
  const queryLower = query.toLowerCase();
  if (queryLower.includes('rbi') && domain.includes('rbi.org.in')) relevance += 0.2;
  if (queryLower.includes('gst') && domain.includes('gst.gov.in')) relevance += 0.2;
  if (queryLower.includes('icai') && domain.includes('icai.org')) relevance += 0.2;
  if (queryLower.includes('tax') && domain.includes('incometax.gov.in')) relevance += 0.2;
  
  return Math.min(relevance, 1.0);
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { headline, categories = [], maxResults = 5 } = body;
    
    if (!headline) {
      return NextResponse.json(
        { success: false, error: 'Headline is required for web search' },
        { status: 400 }
      );
    }
    
    // Generate search queries
    const searchQueries = generateSearchQueries(headline, categories);
    
    // Perform searches for each query
    const allResults: SearchResult[] = [];
    
    for (const query of searchQueries) {
      const results = await performWebSearch(query);
      
      // Calculate and update relevance scores
      const scoredResults = results.map(result => ({
        ...result,
        relevance: calculateSourceRelevance(result.url, query)
      }));
      
      allResults.push(...scoredResults);
    }
    
    // Remove duplicates and sort by relevance
    const uniqueResults = allResults.filter((result, index, self) => 
      index === self.findIndex(r => r.url === result.url)
    );
    
    uniqueResults.sort((a, b) => b.relevance - a.relevance);
    
    // Return top results
    const finalResults = uniqueResults.slice(0, maxResults);
    
    const response: WebSearchResponse = {
      query: headline,
      results: finalResults,
      timestamp: Date.now(),
      sources_count: new Set(finalResults.map(r => new URL(r.url).hostname)).size
    };
    
    return NextResponse.json({
      success: true,
      data: response
    });
    
  } catch (error) {
    console.error('Web search API error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to perform web search' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const query = searchParams.get('q');
  
  if (!query) {
    return NextResponse.json({
      success: true,
      message: 'Web Search API for CA/Finance News',
      usage: 'POST /api/web-search with { headline, categories, maxResults }',
      trusted_sources: TRUSTED_SOURCES
    });
  }
  
  // Simple GET search
  try {
    const results = await performWebSearch(query);
    
    return NextResponse.json({
      success: true,
      data: {
        query,
        results: results.slice(0, 3),
        timestamp: Date.now()
      }
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: 'Search failed' },
      { status: 500 }
    );
  }
}