import { NextRequest, NextResponse } from 'next/server';

interface NewsItem {
  id: string;
  title: string;
  content: string;
  url?: string;
  publishedAt: string;
  source: string;
  sentiment: {
    score: number;
    label: 'positive' | 'negative' | 'neutral';
    confidence: number;
  };
  relevanceScore: number;
  categories: string[];
}

// Simple sentiment analysis function
function analyzeSentiment(text: string) {
  const positiveWords = ['growth', 'profit', 'success', 'increase', 'benefit', 'opportunity', 'positive', 'gain', 'improvement', 'achievement'];
  const negativeWords = ['loss', 'decline', 'fall', 'decrease', 'risk', 'threat', 'negative', 'crisis', 'problem', 'issue'];
  
  const words = text.toLowerCase().split(/\s+/);
  let positiveCount = 0;
  let negativeCount = 0;
  
  words.forEach(word => {
    if (positiveWords.some(pw => word.includes(pw))) positiveCount++;
    if (negativeWords.some(nw => word.includes(nw))) negativeCount++;
  });
  
  const totalSentimentWords = positiveCount + negativeCount;
  if (totalSentimentWords === 0) {
    return { score: 0, label: 'neutral' as const, confidence: 0.5 };
  }
  
  const score = (positiveCount - negativeCount) / totalSentimentWords;
  const confidence = Math.min(totalSentimentWords / 10, 1); // Higher confidence with more sentiment words
  
  let label: 'positive' | 'negative' | 'neutral';
  if (score > 0.1) label = 'positive';
  else if (score < -0.1) label = 'negative';
  else label = 'neutral';
  
  return { score, label, confidence };
}

// Calculate relevance score for CA/Finance content
function calculateRelevanceScore(title: string, content: string): number {
  const caKeywords = [
    'chartered accountant', 'ca', 'audit', 'tax', 'taxation', 'gst', 'compliance', 
    'financial', 'accounting', 'icai', 'rbi', 'sebi', 'income tax', 'corporate',
    'balance sheet', 'profit loss', 'financial statement', 'regulatory'
  ];
  
  const text = (title + ' ' + content).toLowerCase();
  const matchingKeywords = caKeywords.filter(keyword => text.includes(keyword));
  return Math.min(matchingKeywords.length / caKeywords.length * 2, 1); // Max score of 1
}

// Generate relevant web links using intelligent search
async function generateRelevantLinks(title: string, category: string[]): Promise<Array<{url: string, title: string, source: string}>> {
  const links: Array<{url: string, title: string, source: string}> = [];
  
  try {
    // Try to call web search API for dynamic results
    const response = await fetch('http://localhost:3000/api/web-search', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        headline: title,
        categories: category,
        maxResults: 3
      })
    });
    
    if (response.ok) {
      const searchData = await response.json();
      if (searchData.success && searchData.data.results) {
        return searchData.data.results.slice(0, 3).map((result: any) => ({
          url: result.url,
          title: result.title,
          source: result.source
        }));
      }
    }
  } catch (error) {
    // Fallback to static links if web search fails
    console.log('Using fallback static links');
  }
  
  // Static fallback links based on content analysis
  const titleLower = title.toLowerCase();
  
  // RBI related links
  if (titleLower.includes('rbi') || category.includes('Banking')) {
    links.push({
      url: 'https://www.rbi.org.in/Scripts/NotificationUser.aspx',
      title: 'RBI Latest Notifications',
      source: 'Reserve Bank of India'
    });
    links.push({
      url: 'https://www.rbi.org.in/Scripts/BS_PressReleaseDisplay.aspx',
      title: 'RBI Press Releases',
      source: 'RBI Official'
    });
  }
  
  // GST related links
  if (titleLower.includes('gst') || category.includes('GST')) {
    links.push({
      url: 'https://www.gst.gov.in/newsandupdates',
      title: 'GST Portal - News & Updates',
      source: 'GST Official Portal'
    });
    links.push({
      url: 'https://www.cbic.gov.in/resources//htdocs-cbec/gst/notifications.html',
      title: 'GST Notifications - CBIC',
      source: 'Central Board of Indirect Taxes'
    });
  }
  
  // ICAI related links
  if (titleLower.includes('icai') || category.includes('ICAI')) {
    links.push({
      url: 'https://www.icai.org/new_category.html?c_id=302',
      title: 'ICAI Latest Updates',
      source: 'The Institute of Chartered Accountants of India'
    });
    links.push({
      url: 'https://www.icai.org/new_category.html?c_id=89',
      title: 'ICAI Announcements',
      source: 'ICAI Official'
    });
  }
  
  // Income Tax related links
  if (titleLower.includes('income tax') || titleLower.includes('tax') || category.includes('Taxation')) {
    links.push({
      url: 'https://www.incometax.gov.in/iec/foportal/news-and-updates',
      title: 'Income Tax - News & Updates',
      source: 'Income Tax Department'
    });
    links.push({
      url: 'https://www.incometax.gov.in/iec/foportal/help/individual/return-applicable-1',
      title: 'Tax Filing Guidelines',
      source: 'IT Department Official'
    });
  }
  
  // Ministry of Corporate Affairs
  if (titleLower.includes('corporate') || titleLower.includes('company') || category.includes('Corporate')) {
    links.push({
      url: 'https://www.mca.gov.in/content/mca/global/en/mca/master-data/md-news.html',
      title: 'MCA Latest News',
      source: 'Ministry of Corporate Affairs'
    });
    links.push({
      url: 'https://www.mca.gov.in/content/mca/global/en/acts-rules/notifications.html',
      title: 'MCA Notifications',
      source: 'MCA Official'
    });
  }
  
  // SEBI related links
  if (titleLower.includes('sebi') || category.includes('Securities')) {
    links.push({
      url: 'https://www.sebi.gov.in/sebiweb/other/OtherAction.do?doRecognisedFpi=yes&intmId=13',
      title: 'SEBI Press Releases',
      source: 'Securities and Exchange Board of India'
    });
    links.push({
      url: 'https://www.sebi.gov.in/legal/circulars',
      title: 'SEBI Circulars',
      source: 'SEBI Official'
    });
  }
  
  // Finance Ministry
  if (title.toLowerCase().includes('finance') || title.toLowerCase().includes('budget') || category.includes('Finance')) {
    links.push({
      url: 'https://finmin.nic.in/press_room/newsrelease',
      title: 'Finance Ministry Press Releases',
      source: 'Ministry of Finance'
    });
    links.push({
      url: 'https://www.finmin.nic.in/',
      title: 'Finance Ministry Official',
      source: 'Government of India'
    });
  }
  
  // General CA News sources
  links.push({
    url: 'https://economictimes.indiatimes.com/topic/chartered-accountant',
    title: 'Economic Times - CA News',
    source: 'Economic Times'
  });
  
  links.push({
    url: 'https://www.business-standard.com/topic/accounting',
    title: 'Business Standard - Accounting',
    source: 'Business Standard'
  });
  
  return links.slice(0, 3); // Return top 3 most relevant links
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '10');
    const includeTopNews = searchParams.get('topNews') === 'true';
    
    // Mock news data - in production, this would come from news APIs
    const mockNews: NewsItem[] = [
      {
        id: '1',
        title: 'RBI Announces New Guidelines for Digital Banking Compliance',
        content: 'The Reserve Bank of India has released comprehensive guidelines for digital banking operations, focusing on enhanced security measures and compliance frameworks for chartered accountants.',
        url: 'https://example.com/news/1',
        publishedAt: new Date(Date.now() - 1000 * 60 * 30).toISOString(), // 30 minutes ago
        source: 'Financial Express',
        sentiment: { score: 0, label: 'neutral', confidence: 0 },
        relevanceScore: 0,
        categories: ['Banking', 'Compliance', 'RBI']
      },
      {
        id: '2',
        title: 'GST Revenue Collections Show Positive Growth Trend in Q3',
        content: 'The latest GST collections indicate a significant improvement in tax compliance, with chartered accountants playing a crucial role in ensuring proper filing procedures.',
        url: 'https://example.com/news/2',
        publishedAt: new Date(Date.now() - 1000 * 60 * 60).toISOString(), // 1 hour ago
        source: 'Economic Times',
        sentiment: { score: 0, label: 'neutral', confidence: 0 },
        relevanceScore: 0,
        categories: ['Taxation', 'GST', 'Growth']
      },
      {
        id: '3',
        title: 'ICAI Launches New Certification Program for Digital Auditing',
        content: 'The Institute of Chartered Accountants of India announces a comprehensive certification program focusing on digital auditing tools and AI-assisted compliance checking.',
        url: 'https://example.com/news/3',
        publishedAt: new Date(Date.now() - 1000 * 60 * 90).toISOString(), // 1.5 hours ago
        source: 'Business Standard',
        sentiment: { score: 0, label: 'neutral', confidence: 0 },
        relevanceScore: 0,
        categories: ['ICAI', 'Education', 'Technology']
      },
      {
        id: '4',
        title: 'Corporate Tax Filing Deadline Extended Due to Technical Issues',
        content: 'The government has announced an extension for corporate tax filing deadlines following widespread technical problems with the income tax portal, affecting thousands of CA firms.',
        url: 'https://example.com/news/4',
        publishedAt: new Date(Date.now() - 1000 * 60 * 120).toISOString(), // 2 hours ago
        source: 'Hindu Business Line',
        sentiment: { score: 0, label: 'neutral', confidence: 0 },
        relevanceScore: 0,
        categories: ['Taxation', 'Government', 'Deadline']
      },
      {
        id: '5',
        title: 'Fintech Sector Sees Record Investment Growth in Compliance Technology',
        content: 'Investment in compliance technology solutions has reached new heights, with particular focus on tools that assist chartered accountants in regulatory reporting and risk management.',
        url: 'https://example.com/news/5',
        publishedAt: new Date(Date.now() - 1000 * 60 * 180).toISOString(), // 3 hours ago
        source: 'Mint',
        sentiment: { score: 0, label: 'neutral', confidence: 0 },
        relevanceScore: 0,
        categories: ['Fintech', 'Investment', 'Technology']
      }
    ];
    
    // Process each news item
    const processedNews = await Promise.all(mockNews.map(async (news) => {
      const sentiment = analyzeSentiment(news.title + ' ' + news.content);
      const relevanceScore = calculateRelevanceScore(news.title, news.content);
      const relevantLinks = await generateRelevantLinks(news.title, news.categories);
      
      return {
        ...news,
        sentiment,
        relevanceScore,
        relevantLinks
      };
    }));
    
    // Sort by relevance score and recency
    const sortedNews = processedNews.sort((a, b) => {
      const scoreA = a.relevanceScore * 0.7 + (new Date(a.publishedAt).getTime() / Date.now()) * 0.3;
      const scoreB = b.relevanceScore * 0.7 + (new Date(b.publishedAt).getTime() / Date.now()) * 0.3;
      return scoreB - scoreA;
    });
    
    // If requesting top news, return only the top 3
    const finalNews = includeTopNews ? sortedNews.slice(0, 3) : sortedNews.slice(0, limit);
    
    return NextResponse.json({
      success: true,
      data: {
        news: finalNews,
        summary: {
          total: finalNews.length,
          sentimentDistribution: {
            positive: finalNews.filter(n => n.sentiment.label === 'positive').length,
            negative: finalNews.filter(n => n.sentiment.label === 'negative').length,
            neutral: finalNews.filter(n => n.sentiment.label === 'neutral').length
          },
          averageRelevance: finalNews.reduce((sum, n) => sum + n.relevanceScore, 0) / finalNews.length
        }
      }
    });
    
  } catch (error) {
    console.error('Enhanced news API error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch enhanced news data' },
      { status: 500 }
    );
  }
}