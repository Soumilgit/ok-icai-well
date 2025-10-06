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
    const processedNews = mockNews.map(news => {
      const sentiment = analyzeSentiment(news.title + ' ' + news.content);
      const relevanceScore = calculateRelevanceScore(news.title, news.content);
      
      return {
        ...news,
        sentiment,
        relevanceScore
      };
    });
    
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