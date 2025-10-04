import { PerplexityService } from './perplexity-service';
import { TrendData } from './linkedin-content-pipeline';

export interface NewsSource {
  name: string;
  category: string;
  rssUrl?: string;
  apiEndpoint?: string;
  keywords: string[];
  reliability: number; // 0-1 score
}

export interface MarketData {
  indices: {
    sensex: { value: number; change: number; changePercent: number };
    nifty: { value: number; change: number; changePercent: number };
    bankNifty: { value: number; change: number; changePercent: number };
  };
  currency: {
    usdInr: { value: number; change: number; changePercent: number };
  };
  commodities: {
    gold: { value: number; change: number; changePercent: number };
    crude: { value: number; change: number; changePercent: number };
  };
  lastUpdated: Date;
}

export class NewsAndTrendsFetcher {
  private perplexityService: PerplexityService;
  private newsSources: NewsSource[];

  constructor() {
    this.perplexityService = new PerplexityService();
    this.initializeNewsSources();
  }

  private initializeNewsSources(): void {
    this.newsSources = [
      {
        name: 'Economic Times',
        category: 'finance',
        keywords: ['market', 'economy', 'finance', 'business', 'stock'],
        reliability: 0.9
      },
      {
        name: 'Business Standard',
        category: 'business',
        keywords: ['corporate', 'industry', 'market', 'economy'],
        reliability: 0.85
      },
      {
        name: 'ICAI Updates',
        category: 'accounting',
        keywords: ['accounting standards', 'ICAI', 'audit', 'compliance'],
        reliability: 0.95
      },
      {
        name: 'Tax Guru',
        category: 'tax',
        keywords: ['tax', 'GST', 'income tax', 'policy', 'government'],
        reliability: 0.8
      },
      {
        name: 'Ministry of Finance',
        category: 'regulation',
        keywords: ['government policy', 'budget', 'fiscal policy', 'regulation'],
        reliability: 0.95
      },
      {
        name: 'RBI Updates',
        category: 'finance',
        keywords: ['monetary policy', 'banking', 'interest rates', 'RBI'],
        reliability: 0.95
      }
    ];
  }

  // Fetch latest trends from multiple sources
  async fetchComprehensiveTrends(timeframe: '24h' | '7d' | '30d' = '24h'): Promise<TrendData[]> {
    try {
      console.log(`🔍 Fetching comprehensive trends for ${timeframe}...`);
      
      const allTrends: TrendData[] = [];
      
      // Fetch from different categories in parallel
      const promises = [
        this.fetchFinanceNews(timeframe),
        this.fetchAccountingUpdates(timeframe),
        this.fetchTaxNews(timeframe),
        this.fetchRegulatoryUpdates(timeframe),
        this.fetchMarketAnalysis(timeframe),
        this.fetchTechnologyTrends(timeframe)
      ];

      const results = await Promise.allSettled(promises);
      
      results.forEach((result, index) => {
        if (result.status === 'fulfilled') {
          allTrends.push(...result.value);
        } else {
          console.error(`Failed to fetch trends from source ${index}:`, result.reason);
        }
      });

      // Remove duplicates and sort by relevance
      const uniqueTrends = this.deduplicateTrends(allTrends);
      return this.rankTrendsByRelevance(uniqueTrends);
      
    } catch (error) {
      console.error('Error fetching comprehensive trends:', error);
      return [];
    }
  }

  // Fetch finance and market news
  private async fetchFinanceNews(timeframe: string): Promise<TrendData[]> {
    const query = this.buildTimeframeQuery(
      'India finance news stock market banking sector corporate earnings financial results',
      timeframe
    );

    const response = await this.perplexityService.searchWeb(query, {
      maxResults: 8,
      includeCitations: true
    });

    if (response.success && response.data) {
      return this.parseNewsResponse(response.data, 'finance', 'Financial Markets');
    }
    
    return [];
  }

  // Fetch accounting standards and ICAI updates
  private async fetchAccountingUpdates(timeframe: string): Promise<TrendData[]> {
    const query = this.buildTimeframeQuery(
      'ICAI updates accounting standards India AS Ind AS audit guidelines financial reporting',
      timeframe
    );

    const response = await this.perplexityService.searchWeb(query, {
      maxResults: 5,
      includeCitations: true
    });

    if (response.success && response.data) {
      return this.parseNewsResponse(response.data, 'accounting', 'ICAI & Standards');
    }
    
    return [];
  }

  // Fetch tax news and policy updates
  private async fetchTaxNews(timeframe: string): Promise<TrendData[]> {
    const query = this.buildTimeframeQuery(
      'India tax news GST updates income tax changes government policy CBDT CBIC notifications',
      timeframe
    );

    const response = await this.perplexityService.searchWeb(query, {
      maxResults: 6,
      includeCitations: true
    });

    if (response.success && response.data) {
      return this.parseNewsResponse(response.data, 'tax', 'Tax & Policy');
    }
    
    return [];
  }

  // Fetch regulatory updates from RBI, SEBI, etc.
  private async fetchRegulatoryUpdates(timeframe: string): Promise<TrendData[]> {
    const query = this.buildTimeframeQuery(
      'RBI SEBI IRDAI regulatory updates India banking insurance capital markets compliance',
      timeframe
    );

    const response = await this.perplexityService.searchWeb(query, {
      maxResults: 5,
      includeCitations: true
    });

    if (response.success && response.data) {
      return this.parseNewsResponse(response.data, 'regulation', 'Regulatory Bodies');
    }
    
    return [];
  }

  // Fetch market analysis and insights
  private async fetchMarketAnalysis(timeframe: string): Promise<TrendData[]> {
    const query = this.buildTimeframeQuery(
      'India market analysis stock market outlook economic indicators GDP inflation corporate performance',
      timeframe
    );

    const response = await this.perplexityService.searchWeb(query, {
      maxResults: 5,
      includeCitations: true
    });

    if (response.success && response.data) {
      return this.parseNewsResponse(response.data, 'business', 'Market Analysis');
    }
    
    return [];
  }

  // Fetch fintech and technology trends
  private async fetchTechnologyTrends(timeframe: string): Promise<TrendData[]> {
    const query = this.buildTimeframeQuery(
      'India fintech digital banking technology automation accounting software blockchain',
      timeframe
    );

    const response = await this.perplexityService.searchWeb(query, {
      maxResults: 4,
      includeCitations: true
    });

    if (response.success && response.data) {
      return this.parseNewsResponse(response.data, 'technology', 'Fintech & Innovation');
    }
    
    return [];
  }

  // Get current market data for context
  async getCurrentMarketData(): Promise<MarketData | null> {
    try {
      const query = 'current Indian stock market Sensex Nifty Bank Nifty USD INR gold crude oil prices today';
      
      const response = await this.perplexityService.searchWeb(query, {
        maxResults: 3,
        includeCitations: false
      });

      if (response.success && response.data) {
        return this.parseMarketData(response.data);
      }
      
      return null;
    } catch (error) {
      console.error('Error fetching market data:', error);
      return null;
    }
  }

  // Parse market data from response
  private parseMarketData(response: any): MarketData {
    // This would typically parse structured market data
    // For now, return sample data structure
    return {
      indices: {
        sensex: { value: 65000, change: 150, changePercent: 0.23 },
        nifty: { value: 19500, change: 45, changePercent: 0.23 },
        bankNifty: { value: 45000, change: 120, changePercent: 0.27 }
      },
      currency: {
        usdInr: { value: 83.25, change: -0.15, changePercent: -0.18 }
      },
      commodities: {
        gold: { value: 62500, change: 200, changePercent: 0.32 },
        crude: { value: 6800, change: -50, changePercent: -0.73 }
      },
      lastUpdated: new Date()
    };
  }

  // Build timeframe-specific query
  private buildTimeframeQuery(baseQuery: string, timeframe: string): string {
    const timeframeMap = {
      '24h': 'latest news today past 24 hours',
      '7d': 'news this week past 7 days',
      '30d': 'news this month past 30 days'
    };

    return `${baseQuery} ${timeframeMap[timeframe]} recent updates`;
  }

  // Parse news response into structured trend data
  private async parseNewsResponse(response: any, category: string, source: string): Promise<TrendData[]> {
    const trends: TrendData[] = [];
    
    try {
      const content = response.choices?.[0]?.message?.content || response.answer || '';
      const citations = response.citations || [];
      
      // Extract individual news items using AI
      const parsePrompt = `
Analyze this ${category} news content and extract 3-5 most important individual news items. 
Return as JSON array with this exact structure:

Content: ${content}

Required JSON structure:
[
  {
    "title": "Concise headline (max 80 chars)",
    "summary": "2-3 sentence summary with key details and implications",
    "keywords": ["keyword1", "keyword2", "keyword3"],
    "relevanceScore": 0.8,
    "publishedAt": "2025-10-03",
    "impact": "high/medium/low"
  }
]

Focus on news that would be valuable for Chartered Accountants and finance professionals.
Return only valid JSON, no markdown formatting.
`;

      const parseResponse = await this.perplexityService.askQuestion(parsePrompt);
      
      if (parseResponse.success) {
        try {
          const cleanedResponse = parseResponse.data.answer.replace(/```json\n?|\n?```/g, '').trim();
          const parsed = JSON.parse(cleanedResponse);
          
          if (Array.isArray(parsed)) {
            parsed.forEach((item: any, index: number) => {
              if (item.title && item.summary) {
                trends.push({
                  id: `trend_${category}_${Date.now()}_${index}`,
                  title: item.title,
                  source: source,
                  summary: item.summary,
                  category: category as any,
                  relevanceScore: item.relevanceScore || 0.7,
                  publishedAt: new Date(item.publishedAt || new Date()),
                  keywords: item.keywords || [],
                  url: citations[index]?.url
                });
              }
            });
          }
        } catch (parseError) {
          console.error(`Error parsing ${category} trends JSON:`, parseError);
        }
      }
    } catch (error) {
      console.error(`Error parsing ${category} news response:`, error);
    }
    
    return trends;
  }

  // Remove duplicate trends based on title similarity
  private deduplicateTrends(trends: TrendData[]): TrendData[] {
    const uniqueTrends: TrendData[] = [];
    const seenTitles = new Set<string>();
    
    for (const trend of trends) {
      const normalizedTitle = trend.title.toLowerCase().replace(/[^\w\s]/g, '');
      
      // Check for similar titles (basic deduplication)
      let isDuplicate = false;
      for (const seenTitle of seenTitles) {
        const similarity = this.calculateStringSimilarity(normalizedTitle, seenTitle);
        if (similarity > 0.7) {
          isDuplicate = true;
          break;
        }
      }
      
      if (!isDuplicate) {
        uniqueTrends.push(trend);
        seenTitles.add(normalizedTitle);
      }
    }
    
    return uniqueTrends;
  }

  // Calculate string similarity (simple implementation)
  private calculateStringSimilarity(str1: string, str2: string): number {
    const longer = str1.length > str2.length ? str1 : str2;
    const shorter = str1.length > str2.length ? str2 : str1;
    
    if (longer.length === 0) return 1.0;
    
    const distance = this.levenshteinDistance(longer, shorter);
    return (longer.length - distance) / longer.length;
  }

  // Calculate Levenshtein distance
  private levenshteinDistance(str1: string, str2: string): number {
    const matrix: number[][] = [];
    
    for (let i = 0; i <= str2.length; i++) {
      matrix[i] = [i];
    }
    
    for (let j = 0; j <= str1.length; j++) {
      matrix[0][j] = j;
    }
    
    for (let i = 1; i <= str2.length; i++) {
      for (let j = 1; j <= str1.length; j++) {
        if (str2.charAt(i - 1) === str1.charAt(j - 1)) {
          matrix[i][j] = matrix[i - 1][j - 1];
        } else {
          matrix[i][j] = Math.min(
            matrix[i - 1][j - 1] + 1,
            matrix[i][j - 1] + 1,
            matrix[i - 1][j] + 1
          );
        }
      }
    }
    
    return matrix[str2.length][str1.length];
  }

  // Rank trends by relevance for CA audience
  private rankTrendsByRelevance(trends: TrendData[]): TrendData[] {
    return trends.sort((a, b) => {
      // Primary: relevance score
      if (Math.abs(a.relevanceScore - b.relevanceScore) > 0.1) {
        return b.relevanceScore - a.relevanceScore;
      }
      
      // Secondary: category importance for CAs
      const categoryWeights = {
        'accounting': 1.0,
        'tax': 0.95,
        'regulation': 0.9,
        'finance': 0.85,
        'business': 0.8,
        'technology': 0.75
      };
      
      const weightA = categoryWeights[a.category] || 0.5;
      const weightB = categoryWeights[b.category] || 0.5;
      
      if (Math.abs(weightA - weightB) > 0.05) {
        return weightB - weightA;
      }
      
      // Tertiary: recency
      return b.publishedAt.getTime() - a.publishedAt.getTime();
    });
  }

  // Get trending topics for specific time period
  async getTrendingTopics(timeframe: '24h' | '7d' | '30d' = '7d'): Promise<{ topic: string; count: number; relevance: number }[]> {
    const trends = await this.fetchComprehensiveTrends(timeframe);
    const topicCounts: { [topic: string]: { count: number; relevanceSum: number } } = {};
    
    trends.forEach(trend => {
      trend.keywords.forEach(keyword => {
        const key = keyword.toLowerCase();
        if (!topicCounts[key]) {
          topicCounts[key] = { count: 0, relevanceSum: 0 };
        }
        topicCounts[key].count++;
        topicCounts[key].relevanceSum += trend.relevanceScore;
      });
    });
    
    return Object.entries(topicCounts)
      .map(([topic, data]) => ({
        topic,
        count: data.count,
        relevance: data.relevanceSum / data.count
      }))
      .filter(item => item.count > 1) // Only topics mentioned multiple times
      .sort((a, b) => b.count * b.relevance - a.count * a.relevance)
      .slice(0, 20);
  }
}

export default NewsAndTrendsFetcher;