import { PerplexityService } from './perplexity-service';

export interface NewsArticle {
  id: string;
  title: string;
  content: string;
  summary: string;
  source: string;
  url: string;
  publishedAt: Date;
  category: CAServiceCategory;
  tags: string[];
  relevanceScore: number;
  complianceFlags: ComplianceFlag[];
}

export type CAServiceCategory = 
  | 'statutory-audit'
  | 'internal-audit' 
  | 'gst'
  | 'income-tax'
  | 'corporate-law'
  | 'financial-advisory'
  | 'compliance'
  | 'general';

export interface ComplianceFlag {
  type: 'warning' | 'violation' | 'update';
  description: string;
  regulation: string;
  severity: 'low' | 'medium' | 'high';
}

export interface NewsSource {
  name: string;
  url: string;
  type: 'api' | 'rss' | 'scrape';
  category: string[];
}

export class NewsScraperService {
  private perplexityService: PerplexityService;
  private sources: NewsSource[] = [
    {
      name: 'Reuters Finance',
      url: 'https://www.reuters.com/business/finance/',
      type: 'scrape',
      category: ['financial-advisory', 'general']
    },
    {
      name: 'Economic Times CFO',
      url: 'https://cfo.economictimes.indiatimes.com/news',
      type: 'scrape',
      category: ['financial-advisory', 'corporate-law']
    },
    {
      name: 'MoneyControl',
      url: 'https://www.moneycontrol.com/',
      type: 'scrape',
      category: ['financial-advisory', 'general']
    },
    {
      name: 'Economic Times',
      url: 'https://economictimes.indiatimes.com/',
      type: 'scrape',
      category: ['general', 'corporate-law']
    },
    {
      name: 'ICAI Notifications',
      url: 'https://www.icai.org/category/notifications',
      type: 'scrape',
      category: ['compliance', 'statutory-audit']
    },
    {
      name: 'ClearTax',
      url: 'https://cleartax.in/',
      type: 'scrape',
      category: ['gst', 'income-tax']
    },
    {
      name: 'Taxmann',
      url: 'https://www.taxmann.com/',
      type: 'scrape',
      category: ['gst', 'income-tax', 'corporate-law']
    },
    {
      name: 'Indian Kanoon',
      url: 'https://indiankanoon.org/',
      type: 'scrape',
      category: ['corporate-law', 'compliance']
    }
  ];

  constructor() {
    this.perplexityService = new PerplexityService();
  }

  async scrapeDailyNews(): Promise<NewsArticle[]> {
    try {
      const allArticles: NewsArticle[] = [];
      
      // Use Perplexity to gather news from multiple sources
      const newsQuery = this.buildNewsQuery();
      const response = await this.perplexityService.searchNews(newsQuery);
      
      if (response.choices && response.choices.length > 0) {
        const newsContent = response.choices[0].message.content;
        const articles = this.parseNewsResponse(newsContent);
        
        // Process each article for categorization and compliance
        for (const article of articles) {
          const processedArticle = await this.processArticle(article);
          allArticles.push(processedArticle);
        }
      }

      return this.filterAndRankArticles(allArticles);
    } catch (error) {
      console.error('Error scraping news:', error);
      throw new Error('Failed to scrape daily news');
    }
  }

  private buildNewsQuery(): string {
    const today = new Date().toISOString().split('T')[0];
    return `
      Find the latest news from today (${today}) related to:
      - CA (Chartered Accountant) industry updates
      - Tax law changes and GST updates
      - Audit regulations and compliance
      - Corporate finance and accounting standards
      - ICAI notifications and circulars
      - Income tax amendments and notifications
      
      Sources to check:
      - Reuters finance section
      - Economic Times CFO news
      - MoneyControl financial news
      - ICAI official notifications
      - ClearTax updates
      - Taxmann legal updates
      - Indian Kanoon recent judgments
      
      For each news item, provide:
      1. Title
      2. Brief summary
      3. Source URL
      4. Relevance to CA services
      5. Any compliance implications
    `;
  }

  private parseNewsResponse(content: string): Partial<NewsArticle>[] {
    const articles: Partial<NewsArticle>[] = [];
    
    // Parse the structured response from Perplexity
    const sections = content.split(/\n(?=\d+\.)/);
    
    sections.forEach((section, index) => {
      if (section.trim()) {
        const lines = section.split('\n').filter(line => line.trim());
        if (lines.length >= 3) {
          articles.push({
            id: `news_${Date.now()}_${index}`,
            title: this.extractTitle(lines),
            content: section,
            summary: this.extractSummary(lines),
            source: this.extractSource(lines),
            url: this.extractUrl(lines),
            publishedAt: new Date(),
            tags: this.extractTags(section)
          });
        }
      }
    });

    return articles;
  }

  private async processArticle(article: Partial<NewsArticle>): Promise<NewsArticle> {
    // Categorize article based on content
    const category = await this.categorizeArticle(article.content || '');
    
    // Calculate relevance score
    const relevanceScore = this.calculateRelevanceScore(article.content || '', category);
    
    // Check for compliance flags
    const complianceFlags = await this.checkCompliance(article.content || '');

    return {
      id: article.id || `news_${Date.now()}`,
      title: article.title || 'Untitled',
      content: article.content || '',
      summary: article.summary || '',
      source: article.source || 'Unknown',
      url: article.url || '',
      publishedAt: article.publishedAt || new Date(),
      category,
      tags: article.tags || [],
      relevanceScore,
      complianceFlags
    };
  }

  private async categorizeArticle(content: string): Promise<CAServiceCategory> {
    const prompt = `
      Categorize this news article into one of the following CA service categories:
      - statutory-audit: Statutory audit, audit reports, audit standards
      - internal-audit: Internal audit, risk management, internal controls
      - gst: GST law, GST compliance, GST procedures
      - income-tax: Income tax law, IT compliance, tax planning
      - corporate-law: Company law, corporate governance, board matters
      - financial-advisory: Financial planning, investment advice, valuation
      - compliance: General compliance, regulatory updates, ICAI matters
      - general: General business news, economic updates
      
      Article content: ${content.substring(0, 1000)}
      
      Return only the category name.
    `;

    try {
      const response = await this.perplexityService.askQuestion(prompt);
      const category = response.choices[0]?.message.content.trim().toLowerCase();
      
      const validCategories: CAServiceCategory[] = [
        'statutory-audit', 'internal-audit', 'gst', 'income-tax', 
        'corporate-law', 'financial-advisory', 'compliance', 'general'
      ];
      
      return validCategories.includes(category as CAServiceCategory) 
        ? category as CAServiceCategory 
        : 'general';
    } catch (error) {
      console.error('Error categorizing article:', error);
      return 'general';
    }
  }

  private async checkCompliance(content: string): Promise<ComplianceFlag[]> {
    const prompt = `
      Analyze this news content for ICAI compliance implications:
      
      Content: ${content.substring(0, 1000)}
      
      Check for:
      1. New regulations that CAs must comply with
      2. Changes to existing standards or procedures
      3. Deadlines or important dates
      4. Ethical violations or warnings
      5. Professional conduct issues
      
      For each compliance issue found, provide:
      - Type: warning/violation/update
      - Description: Brief explanation
      - Regulation: Relevant law/standard
      - Severity: low/medium/high
      
      Format as JSON array.
    `;

    try {
      const response = await this.perplexityService.askQuestion(prompt);
      const flagsText = response.choices[0]?.message.content;
      
      // Parse JSON response
      const flags = JSON.parse(flagsText);
      return Array.isArray(flags) ? flags : [];
    } catch (error) {
      console.error('Error checking compliance:', error);
      return [];
    }
  }

  private calculateRelevanceScore(content: string, category: CAServiceCategory): number {
    let score = 0.5; // Base score
    
    // Keywords that increase relevance
    const relevantKeywords = [
      'CA', 'chartered accountant', 'ICAI', 'audit', 'tax', 'GST', 
      'compliance', 'financial', 'accounting', 'regulation'
    ];
    
    const contentLower = content.toLowerCase();
    relevantKeywords.forEach(keyword => {
      if (contentLower.includes(keyword.toLowerCase())) {
        score += 0.1;
      }
    });

    // Category-specific boost
    if (category !== 'general') {
      score += 0.2;
    }

    return Math.min(score, 1.0);
  }

  private filterAndRankArticles(articles: NewsArticle[]): NewsArticle[] {
    return articles
      .filter(article => article.relevanceScore > 0.3) // Filter low relevance
      .sort((a, b) => b.relevanceScore - a.relevanceScore) // Sort by relevance
      .slice(0, 50); // Limit to top 50 articles
  }

  private extractTitle(lines: string[]): string {
    return lines[0]?.replace(/^\d+\.\s*/, '') || 'Untitled';
  }

  private extractSummary(lines: string[]): string {
    return lines.find(line => line.toLowerCase().includes('summary:'))
      ?.replace(/summary:\s*/i, '') || lines[1] || '';
  }

  private extractSource(lines: string[]): string {
    return lines.find(line => line.toLowerCase().includes('source:'))
      ?.replace(/source:\s*/i, '') || 'Unknown';
  }

  private extractUrl(lines: string[]): string {
    const urlLine = lines.find(line => line.includes('http'));
    const urlMatch = urlLine?.match(/(https?:\/\/[^\s]+)/);
    return urlMatch ? urlMatch[1] : '';
  }

  private extractTags(content: string): string[] {
    const tags: string[] = [];
    const contentLower = content.toLowerCase();
    
    const tagMap = {
      'gst': ['gst', 'goods and services tax'],
      'income-tax': ['income tax', 'it act', 'tax planning'],
      'audit': ['audit', 'auditing', 'auditor'],
      'compliance': ['compliance', 'regulatory', 'icai'],
      'corporate': ['corporate', 'company law', 'board'],
      'finance': ['financial', 'finance', 'accounting']
    };

    Object.entries(tagMap).forEach(([tag, keywords]) => {
      if (keywords.some(keyword => contentLower.includes(keyword))) {
        tags.push(tag);
      }
    });

    return tags;
  }

  async getNewsByCategory(category: CAServiceCategory): Promise<NewsArticle[]> {
    const allNews = await this.scrapeDailyNews();
    return allNews.filter(article => article.category === category);
  }

  async searchNews(query: string): Promise<NewsArticle[]> {
    try {
      const searchQuery = `
        Search for recent news related to: ${query}
        Focus on CA, accounting, tax, audit, and compliance topics.
        Provide detailed summaries and source information.
      `;
      
      const response = await this.perplexityService.searchNews(searchQuery);
      
      if (response.choices && response.choices.length > 0) {
        const newsContent = response.choices[0].message.content;
        const articles = this.parseNewsResponse(newsContent);
        
        const processedArticles: NewsArticle[] = [];
        for (const article of articles) {
          const processed = await this.processArticle(article);
          processedArticles.push(processed);
        }
        
        return processedArticles;
      }
      
      return [];
    } catch (error) {
      console.error('Error searching news:', error);
      throw new Error('Failed to search news');
    }
  }
}