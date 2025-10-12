import puppeteer, { Browser, Page } from 'puppeteer';
import { JSDOM } from 'jsdom';
import axios from 'axios';
import { INewsArticle } from '@/models/NewsArticle';

export interface ScrapingConfig {
  source: 'ANI' | 'ECONOMIC_TIMES' | 'ICAI';
  baseUrl: string;
  useHeadless: boolean;
  selectors: {
    articleLinks: string;
    title: string;
    content: string;
    date?: string;
    author?: string;
    category?: string;
  };
  filters: {
    keywords: string[];
    excludeKeywords: string[];
  };
}

export class AdvancedWebScraper {
  private browser: Browser | null = null;
  private configs: Record<string, ScrapingConfig> = {
    ANI: {
      source: 'ANI',
      baseUrl: 'https://www.aninews.in',
      useHeadless: true,
      selectors: {
        articleLinks: 'a[href*="/news/"]',
        title: 'h1, .headline, .title',
        content: '.story-content, .article-body, .content-body',
        date: '.date, .published-date, time',
        category: '.category, .section'
      },
      filters: {
        keywords: ['tax', 'gst', 'finance', 'economy', 'audit', 'accounting', 'ca', 'chartered accountant', 'icai', 'compliance'],
        excludeKeywords: ['sports', 'entertainment', 'bollywood', 'cricket']
      }
    },
    ECONOMIC_TIMES: {
      source: 'ECONOMIC_TIMES',
      baseUrl: 'https://economictimes.indiatimes.com',
      useHeadless: true,
      selectors: {
        articleLinks: 'a[href*="/news/"]',
        title: 'h1, .eachStory h3 a, .contentTitle',
        content: '.artText, .story-content, .Normal',
        date: '.time, .publish_on, .date-format',
        author: '.author, .by',
        category: '.secName, .breadcrumb'
      },
      filters: {
        keywords: ['tax', 'gst', 'income tax', 'finance', 'economy', 'audit', 'accounting', 'corporate', 'compliance', 'budget', 'policy'],
        excludeKeywords: ['sports', 'entertainment', 'lifestyle']
      }
    },
    ICAI: {
      source: 'ICAI',
      baseUrl: 'https://www.icai.org',
      useHeadless: true,
      selectors: {
        articleLinks: 'a[href*="/news"], a[href*="/announcement"], a[href*="/update"]',
        title: 'h1, .title, .headline',
        content: '.content, .article-content, .news-content',
        date: '.date, .published, time'
      },
      filters: {
        keywords: ['audit', 'accounting', 'standards', 'ethics', 'examination', 'circular', 'notification', 'guidelines'],
        excludeKeywords: []
      }
    }
  };

  async initialize(): Promise<void> {
    try {
      this.browser = await puppeteer.launch({
        headless: true,
        args: [
          '--no-sandbox',
          '--disable-setuid-sandbox',
          '--disable-dev-shm-usage',
          '--disable-accelerated-2d-canvas',
          '--disable-gpu',
          '--window-size=1920x1080'
        ]
      });
      console.log('Browser initialized successfully');
    } catch (error) {
      console.error('Failed to initialize browser:', error);
      throw error;
    }
  }

  async close(): Promise<void> {
    if (this.browser) {
      await this.browser.close();
      this.browser = null;
    }
  }

  async scrapeFromANI(): Promise<Partial<INewsArticle>[]> {
    const config = this.configs.ANI;
    const articles: Partial<INewsArticle>[] = [];

    try {
      if (!this.browser) await this.initialize();
      
      const page = await this.browser!.newPage();
      await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36');
      
      // Navigate to ANI Business section
      const businessUrl = `${config.baseUrl}/category/business`;
      await page.goto(businessUrl, { waitUntil: 'networkidle2', timeout: 30000 });

      // Extract article links
      const articleLinks = await page.evaluate((selector) => {
        const links = document.querySelectorAll(selector);
        return Array.from(links)
          .map(link => (link as HTMLAnchorElement).href)
          .filter(href => href && href.includes('/news/'))
          .slice(0, 15); // Limit to 15 articles
      }, config.selectors.articleLinks);

      console.log(`Found ${articleLinks.length} article links from ANI`);

      // Scrape each article
      for (const link of articleLinks) {
        try {
          const article = await this.scrapeArticle(page, link, config);
          if (article && this.isRelevantArticle(article, config)) {
            articles.push(article);
          }
        } catch (error) {
          console.error(`Error scraping article ${link}:`, error);
          continue;
        }
      }

      await page.close();
      console.log(`Successfully scraped ${articles.length} articles from ANI`);
      return articles;

    } catch (error) {
      console.error('Error scraping from ANI:', error);
      return articles;
    }
  }

  async scrapeFromEconomicTimes(): Promise<Partial<INewsArticle>[]> {
    const config = this.configs.ECONOMIC_TIMES;
    const articles: Partial<INewsArticle>[] = [];

    try {
      if (!this.browser) await this.initialize();
      
      const page = await this.browser!.newPage();
      await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36');
      
      // Navigate to Economic Times sections
      const sections = [
        `${config.baseUrl}/news/economy`,
        `${config.baseUrl}/topic/gst`,
        `${config.baseUrl}/topic/income-tax`,
        `${config.baseUrl}/news/company/corporate-trends`
      ];

      for (const sectionUrl of sections) {
        try {
          await page.goto(sectionUrl, { waitUntil: 'networkidle2', timeout: 30000 });

          // Extract article links
          const articleLinks = await page.evaluate((selector) => {
            const links = document.querySelectorAll('a[href*="/news/"]');
            return Array.from(links)
              .map(link => (link as HTMLAnchorElement).href)
              .filter(href => href && href.includes('/news/'))
              .slice(0, 8); // Limit per section
          }, config.selectors.articleLinks);

          console.log(`Found ${articleLinks.length} article links from ET section: ${sectionUrl}`);

          // Scrape each article
          for (const link of articleLinks) {
            try {
              const article = await this.scrapeArticle(page, link, config);
              if (article && this.isRelevantArticle(article, config)) {
                articles.push(article);
              }
            } catch (error) {
              console.error(`Error scraping ET article ${link}:`, error);
              continue;
            }
          }
        } catch (error) {
          console.error(`Error scraping ET section ${sectionUrl}:`, error);
          continue;
        }
      }

      await page.close();
      console.log(`Successfully scraped ${articles.length} articles from Economic Times`);
      return articles;

    } catch (error) {
      console.error('Error scraping from Economic Times:', error);
      return articles;
    }
  }

  async scrapeFromICAI(): Promise<Partial<INewsArticle>[]> {
    const config = this.configs.ICAI;
    const articles: Partial<INewsArticle>[] = [];

    try {
      if (!this.browser) await this.initialize();
      
      const page = await this.browser!.newPage();
      await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36');
      
      // Navigate to ICAI sections
      const sections = [
        `${config.baseUrl}/news`,
        `${config.baseUrl}/new_post.html?id=8`,  // Announcements
        `${config.baseUrl}/new_post.html?id=5`,  // Circulars
        `${config.baseUrl}/new_post.html?id=34`  // Guidelines
      ];

      for (const sectionUrl of sections) {
        try {
          await page.goto(sectionUrl, { waitUntil: 'networkidle2', timeout: 30000 });

          // Extract article/announcement links
          const articleLinks = await page.evaluate(() => {
            const links = document.querySelectorAll('a[href*="post"], a[href*="news"], a[href*="announcement"]');
            return Array.from(links)
              .map(link => {
                const href = (link as HTMLAnchorElement).href;
                // Convert relative URLs to absolute
                if (href && !href.startsWith('http')) {
                  return `https://www.icai.org${href}`;
                }
                return href;
              })
              .filter(href => href)
              .slice(0, 10);
          });

          console.log(`Found ${articleLinks.length} links from ICAI section: ${sectionUrl}`);

          // Scrape each article
          for (const link of articleLinks) {
            try {
              const article = await this.scrapeArticle(page, link, config);
              if (article && this.isRelevantArticle(article, config)) {
                articles.push(article);
              }
            } catch (error) {
              console.error(`Error scraping ICAI article ${link}:`, error);
              continue;
            }
          }
        } catch (error) {
          console.error(`Error scraping ICAI section ${sectionUrl}:`, error);
          continue;
        }
      }

      await page.close();
      console.log(`Successfully scraped ${articles.length} articles from ICAI`);
      return articles;

    } catch (error) {
      console.error('Error scraping from ICAI:', error);
      return articles;
    }
  }

  private async scrapeArticle(page: Page, url: string, config: ScrapingConfig): Promise<Partial<INewsArticle> | null> {
    try {
      await page.goto(url, { waitUntil: 'networkidle2', timeout: 30000 });

      const articleData = await page.evaluate((selectors) => {
        const getTextContent = (selector: string): string => {
          const elements = document.querySelectorAll(selector);
          for (const element of elements) {
            const text = element.textContent?.trim();
            if (text && text.length > 10) return text;
          }
          return '';
        };

        const title = getTextContent(selectors.title);
        const content = getTextContent(selectors.content);
        const dateText = selectors.date ? getTextContent(selectors.date) : '';
        const author = selectors.author ? getTextContent(selectors.author) : '';
        const category = selectors.category ? getTextContent(selectors.category) : '';

        return {
          title,
          content,
          dateText,
          author,
          category
        };
      }, config.selectors);

      if (!articleData.title || !articleData.content) {
        return null;
      }

      // Parse date
      let publishedAt = new Date();
      if (articleData.dateText) {
        const parsedDate = new Date(articleData.dateText);
        if (!isNaN(parsedDate.getTime())) {
          publishedAt = parsedDate;
        }
      }

      // Generate summary
      const summary = this.generateSummary(articleData.content);

      // Categorize article
      const category = this.categorizeArticle(articleData.title, articleData.content);

      // Determine impact
      const impact = this.determineImpact(articleData.title, articleData.content);

      // Extract tags
      const tags = this.extractTags(articleData.title, articleData.content);

      const article: Partial<INewsArticle> = {
        title: articleData.title,
        content: articleData.content,
        summary,
        source: config.source,
        url,
        publishedAt,
        category,
        impact,
        tags,
        createdAt: new Date(),
        updatedAt: new Date()
      };

      return article;

    } catch (error) {
      console.error(`Error scraping article ${url}:`, error);
      return null;
    }
  }

  private isRelevantArticle(article: Partial<INewsArticle>, config: ScrapingConfig): boolean {
    const text = ((article.title || '') + ' ' + (article.content || '')).toLowerCase();
    
    // Check if article contains relevant keywords
    const hasRelevantKeywords = config.filters.keywords.some(keyword => 
      text.includes(keyword.toLowerCase())
    );

    // Check if article contains excluded keywords
    const hasExcludedKeywords = config.filters.excludeKeywords.some(keyword => 
      text.includes(keyword.toLowerCase())
    );

    return hasRelevantKeywords && !hasExcludedKeywords;
  }

  private generateSummary(content: string): string {
    if (!content) return '';
    
    // Basic summary generation (first 2-3 sentences)
    const sentences = content.split(/[.!?]+/).filter(s => s.trim().length > 10);
    return sentences.slice(0, 2).join('. ').trim() + '.';
  }

  private categorizeArticle(title: string, content: string): 'tax' | 'compliance' | 'audit' | 'general' {
    const text = (title + ' ' + content).toLowerCase();
    
    if (text.includes('tax') || text.includes('gst') || text.includes('income tax') || text.includes('tds')) {
      return 'tax';
    }
    if (text.includes('compliance') || text.includes('regulation') || text.includes('rule') || text.includes('circular')) {
      return 'compliance';
    }
    if (text.includes('audit') || text.includes('auditing') || text.includes('auditor')) {
      return 'audit';
    }
    return 'general';
  }

  private determineImpact(title: string, content: string): 'low' | 'medium' | 'high' {
    const text = (title + ' ' + content).toLowerCase();
    
    const highImpactKeywords = ['mandatory', 'compulsory', 'penalty', 'fine', 'deadline', 'new rule', 'amendment', 'notification'];
    const mediumImpactKeywords = ['guideline', 'clarification', 'update', 'change', 'circular'];
    
    if (highImpactKeywords.some(keyword => text.includes(keyword))) {
      return 'high';
    }
    if (mediumImpactKeywords.some(keyword => text.includes(keyword))) {
      return 'medium';
    }
    return 'low';
  }

  private extractTags(title: string, content: string): string[] {
    const text = (title + ' ' + content).toLowerCase();
    const possibleTags = ['gst', 'income tax', 'tds', 'audit', 'compliance', 'icai', 'corporate', 'banking', 'finance', 'accounting', 'tax reform', 'budget', 'policy'];
    
    return possibleTags.filter(tag => text.includes(tag));
  }

  // Public method to scrape all sources
  async scrapeAllSources(): Promise<Partial<INewsArticle>[]> {
    const allArticles: Partial<INewsArticle>[] = [];

    try {
      await this.initialize();

      // Scrape from all sources
      const [aniArticles, etArticles, icaiArticles] = await Promise.allSettled([
        this.scrapeFromANI(),
        this.scrapeFromEconomicTimes(),
        this.scrapeFromICAI()
      ]);

      // Collect successful results
      if (aniArticles.status === 'fulfilled') {
        allArticles.push(...aniArticles.value);
      } else {
        console.error('ANI scraping failed:', aniArticles.reason);
      }

      if (etArticles.status === 'fulfilled') {
        allArticles.push(...etArticles.value);
      } else {
        console.error('Economic Times scraping failed:', etArticles.reason);
      }

      if (icaiArticles.status === 'fulfilled') {
        allArticles.push(...icaiArticles.value);
      } else {
        console.error('ICAI scraping failed:', icaiArticles.reason);
      }

      console.log(`Total articles scraped: ${allArticles.length}`);
      return allArticles;

    } catch (error) {
      console.error('Error in scrapeAllSources:', error);
      return allArticles;
    } finally {
      await this.close();
    }
  }
}

// Export singleton instance
export const advancedScraper = new AdvancedWebScraper();