export interface TrendData {import { PerplexityService } from './perplexity-service';import { PerplexityService } from './perplexity-service';import { PerplexityService } from './perplexity-service';

  title: string;

  category: string;

  relevanceScore: number;

  trendScore: number;export interface TrendData {

  keywords: string[];

  summary: string;  title: string;

}

  category: string;export interface TrendData {export interface TrendData {

export interface GeneratedPost {

  id: string;  relevanceScore: number;

  content: string;

  hashtags: string[];  trendScore: number;  title: string;  title: string;

  trendData: TrendData;

  status: 'pending' | 'approved' | 'rejected' | 'published';  keywords: string[];

  createdAt: Date;

}  summary: string;  category: string;  category: string;



export interface ContentPipelineConfig {}

  targetCategories: string[];

  postsPerBatch?: number;  relevanceScore: number;  relevanceScore: number;

  minRelevanceScore?: number;

  maxPostsPerDay?: number;export interface GeneratedPost {

  trendRefreshInterval?: number;

  enableAutoApproval?: boolean;  id: string;  trendScore: number;  trendScore: number;

  autoApprovalThreshold?: number;

}  content: string;



export class LinkedInContentPipeline {  hashtags: string[];  keywords: string[];  keywords: string[];

  private config: Required<ContentPipelineConfig>;

  trendData: TrendData;

  constructor(config: ContentPipelineConfig) {

    this.config = {  status: 'pending' | 'approved' | 'rejected' | 'published';  summary: string;  summary: string;

      targetCategories: config.targetCategories,

      postsPerBatch: config.postsPerBatch || 5,  createdAt: Date;

      minRelevanceScore: config.minRelevanceScore || 0.6,

      maxPostsPerDay: config.maxPostsPerDay || 3,}  source?: string;}

      trendRefreshInterval: config.trendRefreshInterval || 6 * 60 * 60 * 1000,

      enableAutoApproval: config.enableAutoApproval || false,

      autoApprovalThreshold: config.autoApprovalThreshold || 0.85

    };export interface ContentPipelineConfig {  publishedAt?: Date;

  }

  targetCategories: string[];

  async fetchLatestTrends(): Promise<TrendData[]> {

    const trends: TrendData[] = [];  postsPerBatch?: number;  url?: string;  summary: string;  category: 'finance' | 'accounting' | 'tax' | 'business' | 'technology' | 'regulation';

    

    for (const category of this.config.targetCategories) {  minRelevanceScore?: number;

      const mockTrend: TrendData = {

        title: `Latest ${category} developments in India`,  maxPostsPerDay?: number;}

        category: category,

        summary: `Recent updates and changes in ${category} sector affecting CA professionals`,  trendRefreshInterval?: number;

        keywords: [category, 'India', 'update', 'professional'],

        relevanceScore: 0.8,  enableAutoApproval?: boolean;  source?: string;  relevanceScore: number;

        trendScore: 0.9

      };  autoApprovalThreshold?: number;

      trends.push(mockTrend);

    }}export interface GeneratedPost {

    

    return trends;

  }

export class LinkedInContentPipeline {  id: string;  publishedAt?: Date;  publishedAt: Date;

  async generateContentBatch(trends: TrendData[]): Promise<GeneratedPost[]> {

    const posts: GeneratedPost[] = [];  private perplexityService: PerplexityService;

    

    for (const trend of trends.slice(0, this.config.postsPerBatch)) {  private config: Required<ContentPipelineConfig>;  content: string;

      const post: GeneratedPost = {

        id: `post_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,

        content: `Professional insight on ${trend.title}. ${trend.summary} This impacts CA professionals significantly. Stay updated with the latest changes.`,

        hashtags: ['#CharteredAccountant', '#Finance', `#${trend.category}`, '#India', '#Professional'],  constructor(config: ContentPipelineConfig) {  hashtags: string[];  url?: string;  keywords: string[];

        trendData: trend,

        status: 'pending',    this.perplexityService = new PerplexityService(process.env.PERPLEXITY_API_KEY || '');

        createdAt: new Date()

      };    this.config = {  trendData: TrendData;

      posts.push(post);

    }      targetCategories: config.targetCategories,

    

    return posts;      postsPerBatch: config.postsPerBatch || 5,  status: 'pending' | 'approved' | 'rejected' | 'published';}}

  }

}      minRelevanceScore: config.minRelevanceScore || 0.6,

      maxPostsPerDay: config.maxPostsPerDay || 3,  createdAt: Date;

      trendRefreshInterval: config.trendRefreshInterval || 6 * 60 * 60 * 1000,

      enableAutoApproval: config.enableAutoApproval || false,  approvedAt?: Date;

      autoApprovalThreshold: config.autoApprovalThreshold || 0.85

    };  publishedAt?: Date;

  }

  scheduledFor?: Date;export interface GeneratedPost {export interface GeneratedPost {

  async fetchLatestTrends(): Promise<TrendData[]> {

    const trends: TrendData[] = [];  rejectionReason?: string;

    

    for (const category of this.config.targetCategories) {  engagementPrediction?: {  id: string;  id: string;

      const mockTrend: TrendData = {

        title: `Latest ${category} developments in India`,    expectedLikes: number;

        category: category,

        summary: `Recent updates and changes in ${category} sector affecting CA professionals`,    expectedComments: number;  content: string;  content: string;

        keywords: [category, 'India', 'update', 'professional'],

        relevanceScore: 0.8,    expectedShares: number;

        trendScore: 0.9

      };    confidenceScore: number;  hashtags: string[];  hashtags: string[];

      trends.push(mockTrend);

    }  };

    

    return trends;}  trendData: TrendData;  trendId: string;

  }



  async generateContentBatch(trends: TrendData[]): Promise<GeneratedPost[]> {

    const posts: GeneratedPost[] = [];export interface ContentPipelineConfig {  status: 'pending' | 'approved' | 'rejected' | 'published';  trendData: TrendData;

    

    for (const trend of trends.slice(0, this.config.postsPerBatch)) {  targetCategories: string[];

      const post: GeneratedPost = {

        id: `post_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,  postsPerBatch?: number;  createdAt: Date;  engagement_type: 'educational' | 'news_analysis' | 'insight' | 'tip' | 'question';

        content: `Professional insight on ${trend.title}. ${trend.summary} This impacts CA professionals significantly. Stay updated with the latest changes.`,

        hashtags: ['#CharteredAccountant', '#Finance', `#${trend.category}`, '#India', '#Professional'],  minRelevanceScore?: number;

        trendData: trend,

        status: 'pending',  maxPostsPerDay?: number;  approvedAt?: Date;  status: 'draft' | 'pending_approval' | 'approved' | 'rejected' | 'published';

        createdAt: new Date()

      };  trendRefreshInterval?: number;

      posts.push(post);

    }  enableAutoApproval?: boolean;  publishedAt?: Date;  generatedAt: Date;

    

    return posts;  autoApprovalThreshold?: number;

  }

}}  scheduledFor?: Date;  approvedAt?: Date;



export default LinkedInContentPipeline;

export class LinkedInContentPipeline {  engagementPrediction?: {  publishedAt?: Date;

  private perplexityService: PerplexityService;

  private config: Required<ContentPipelineConfig>;    expectedLikes: number;  approvedBy?: string;



  constructor(config: ContentPipelineConfig) {    expectedComments: number;  rejectionReason?: string;

    this.perplexityService = new PerplexityService(process.env.PERPLEXITY_API_KEY || '');

    this.config = {    expectedShares: number;  scheduledFor?: Date;

      targetCategories: config.targetCategories,

      postsPerBatch: config.postsPerBatch || 5,    confidenceScore: number;  performance?: {

      minRelevanceScore: config.minRelevanceScore || 0.6,

      maxPostsPerDay: config.maxPostsPerDay || 3,  };    likes: number;

      trendRefreshInterval: config.trendRefreshInterval || 6 * 60 * 60 * 1000,

      enableAutoApproval: config.enableAutoApproval || false,}    comments: number;

      autoApprovalThreshold: config.autoApprovalThreshold || 0.85

    };    shares: number;

  }

export interface ContentPipelineConfig {    impressions: number;

  // Fetch latest market trends using Perplexity

  async fetchLatestTrends(): Promise<TrendData[]> {  targetCategories?: string[];  };

    try {

      console.log('📊 Fetching latest market trends...');  postsPerBatch?: number;}

      

      const trends: TrendData[] = [];  minRelevanceScore?: number;

      

      for (const category of this.config.targetCategories) {  maxPostsPerDay?: number;export interface ContentPipelineConfig {

        const query = this.buildTrendQuery(category);

        const searchResponse = await this.perplexityService.searchWeb(query);  trendRefreshInterval?: number;  enabled: boolean;

        

        if (searchResponse) {  enableAutoApproval?: boolean;  posting_frequency: 'daily' | 'twice_daily' | 'every_12_hours' | 'custom';

          const categoryTrends = this.parseTrendsFromResponse(searchResponse, category);

          trends.push(...categoryTrends);  autoApprovalThreshold?: number;  custom_interval_hours?: number;

        }

        }  preferred_posting_times: string[]; // ["09:00", "14:00", "17:00"]

        // Add delay to respect rate limits

        await this.sleep(1000);  categories: string[];

      }

      export class LinkedInContentPipeline {  auto_approve_threshold?: number; // Auto approve if AI confidence > threshold

      // Sort by relevance and trend score

      const sortedTrends = trends  private perplexityService: PerplexityService | null;  human_approval_required: boolean;

        .filter(trend => trend.relevanceScore >= this.config.minRelevanceScore)

        .sort((a, b) => (b.relevanceScore + b.trendScore) - (a.relevanceScore + a.trendScore));  private config: ContentPipelineConfig;  max_posts_per_day: number;

      

      console.log(`✅ Found ${sortedTrends.length} relevant trends`);    content_tone: 'professional' | 'conversational' | 'authoritative' | 'educational';

      return sortedTrends;

        constructor(config: ContentPipelineConfig = {}) {  include_call_to_action: boolean;

    } catch (error) {

      console.error('❌ Error fetching trends:', error);    this.config = {  brand_voice_guidelines?: string;

      return [];

    }      targetCategories: config.targetCategories || ['finance', 'accounting', 'tax'],}

  }

      postsPerBatch: config.postsPerBatch || 5,

  // Generate LinkedIn posts from trends

  async generateContentBatch(trends: TrendData[]): Promise<GeneratedPost[]> {      minRelevanceScore: config.minRelevanceScore || 0.6,export class LinkedInContentPipeline {

    try {

      console.log(`✏️ Generating content from ${trends.length} trends...`);      maxPostsPerDay: config.maxPostsPerDay || 3,  private perplexityService: PerplexityService;

      

      const posts: GeneratedPost[] = [];      trendRefreshInterval: config.trendRefreshInterval || 6 * 60 * 60 * 1000,  private config: ContentPipelineConfig;

      const batchSize = Math.min(trends.length, this.config.postsPerBatch);

            enableAutoApproval: config.enableAutoApproval || false,  

      for (let i = 0; i < batchSize; i++) {

        const trend = trends[i];      autoApprovalThreshold: config.autoApprovalThreshold || 0.85  constructor(config: ContentPipelineConfig = {

        

        try {    };    targetCategories: ['finance', 'accounting', 'tax'],

          const post = await this.generateSinglePost(trend);

          if (post) {        postsPerBatch: 5,

            posts.push(post);

          }    const apiKey = process.env.PERPLEXITY_API_KEY;    minRelevanceScore: 0.6,

        } catch (error) {

          console.error(`❌ Error generating post for trend "${trend.title}":`, error);    if (!apiKey) {    maxPostsPerDay: 3,

        }

              console.warn('⚠️ PERPLEXITY_API_KEY not found. Using mock data for LinkedIn content generation.');    trendRefreshInterval: 6 * 60 * 60 * 1000,

        // Add delay between generations

        await this.sleep(2000);      this.perplexityService = null;    enableAutoApproval: false,

      }

          } else {    autoApprovalThreshold: 0.85

      console.log(`✅ Generated ${posts.length} posts`);

      return posts;      this.perplexityService = new PerplexityService(apiKey);  }) {

      

    } catch (error) {    }    this.config = config;

      console.error('❌ Error in batch content generation:', error);

      return [];  }    this.perplexityService = new PerplexityService(process.env.PERPLEXITY_API_KEY || '');

    }

  }  }



  // Generate a single LinkedIn post from a trend  // Fetch latest trends and market news

  private async generateSinglePost(trend: TrendData): Promise<GeneratedPost | null> {

    try {  async fetchLatestTrends(categories: string[] = this.config.targetCategories || ['finance', 'accounting', 'tax']): Promise<TrendData[]> {  // Fetch latest trends and market news

      const prompt = `Create a professional LinkedIn post for CA/finance professionals about this trend:

    try {  async fetchLatestTrends(categories: string[] = ['finance', 'accounting', 'tax']): Promise<TrendData[]> {

TREND: ${trend.title}

SUMMARY: ${trend.summary}      console.log(`🔍 Fetching trends for categories: ${categories.join(', ')}`);    try {

CATEGORY: ${trend.category}

KEYWORDS: ${trend.keywords.join(', ')}            const trends: TrendData[] = [];



POST REQUIREMENTS:      if (!this.perplexityService) {      

- Professional tone suitable for Chartered Accountants

- 1-3 paragraphs, under 1300 characters        return this.getMockTrends(categories);      for (const category of categories) {

- Include actionable insights

- Add relevant hashtags (5-8 maximum)      }        const query = this.buildTrendQuery(category);

- Make it engaging and informative

- Focus on practical implications for CA professionals              const response = await this.perplexityService.chat([



Format the response as:      const trends: TrendData[] = [];          {

CONTENT:

[post content here]                  role: 'user',



HASHTAGS:      for (const category of categories) {            content: query

[hashtags separated by spaces]`;

        console.log(`🔍 Fetching ${category} trends...`);          }

      const response = await this.perplexityService.generateSEOContent(prompt);

                      ], {

      if (!response) {

        throw new Error('No response from content generation');        const query = this.buildTrendQuery(category);          max_tokens: 1024,

      }

                  search_recency_filter: 'month'

      const { content, hashtags } = this.parseGeneratedContent(response);

              try {        });

      if (!content) {

        throw new Error('Failed to parse generated content');          const response = await this.perplexityService.chat([

      }

            {        if (response.choices && response.choices[0]) {

      const post: GeneratedPost = {

        id: `post_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,              role: 'user',          const categoryTrends = await this.parseTrendsFromResponse(response.choices[0].message.content, category);

        content: content,

        hashtags: hashtags,              content: query          trends.push(...categoryTrends);

        trendData: trend,

        status: 'pending',            }        }

        createdAt: new Date(),

        engagementPrediction: this.predictEngagement(content, hashtags, trend)          ], {      }

      };

            max_tokens: 1024,

      return post;

            search_recency_filter: 'week',      // Sort by relevance and recency

    } catch (error) {

      console.error('Error generating single post:', error);            temperature: 0.3      return trends.sort((a, b) => {

      return null;

    }          });        const relevanceDiff = b.relevanceScore - a.relevanceScore;

  }

        if (Math.abs(relevanceDiff) > 0.1) return relevanceDiff;

  // Build search query for specific category

  private buildTrendQuery(category: string): string {          if (response.choices && response.choices[0]) {        return b.publishedAt.getTime() - a.publishedAt.getTime();

    const queries: { [key: string]: string } = {

      'finance': 'latest financial news trends India banking RBI policy changes 2025',            const content = response.choices[0].message.content;      });

      'accounting': 'new accounting standards IFRS updates India GST changes 2025',

      'tax': 'latest tax updates India income tax GST changes budget 2025',            const categoryTrends = this.parseTrendsFromResponse(content, category);    } catch (error) {

      'business': 'business news India corporate updates regulatory changes 2025',

      'regulation': 'regulatory updates India compliance changes SEBI RBI notifications 2025'            trends.push(...categoryTrends);      console.error('Error fetching trends:', error);

    };

            console.log(`✅ Found ${categoryTrends.length} trends for ${category}`);      return [];

    return queries[category] || `latest ${category} news trends India 2025`;

  }          }    }



  // Parse trends from Perplexity response        } catch (error) {  }

  private parseTrendsFromResponse(response: string, category: string): TrendData[] {

    const trends: TrendData[] = [];          console.error(`❌ Error fetching ${category} trends:`, error);

    

    try {          // Add mock trend for this category  // Generate LinkedIn post content from trend data

      // Split response into sections and extract key information

      const sections = response.split('\n\n').filter(section => section.trim().length > 0);          trends.push(...this.getMockTrends([category]));  async generatePostContent(trend: TrendData, config: ContentPipelineConfig): Promise<GeneratedPost> {

      

      for (let i = 0; i < Math.min(sections.length, 3); i++) {        }    try {

        const section = sections[i];

              }      const prompt = this.buildContentPrompt(trend, config);

        if (section.length < 50) continue; // Skip very short sections

              

        const trend: TrendData = {

          title: this.extractTitle(section) || `${category} Update ${i + 1}`,      // Filter and sort trends by relevance      const response = await this.perplexityService.chat([

          category: category,

          summary: section.substring(0, 300) + '...',      const filteredTrends = trends        {

          keywords: this.extractKeywords(section, category),

          relevanceScore: this.calculateRelevanceScore(section, category),        .filter(trend => trend.relevanceScore >= (this.config.minRelevanceScore || 0.6))          role: 'user',

          trendScore: 0.7 + (Math.random() * 0.3), // Random score between 0.7-1.0

          source: 'Perplexity Search',        .sort((a, b) => b.relevanceScore - a.relevanceScore)          content: prompt

          publishedAt: new Date()

        };        .slice(0, this.config.postsPerBatch || 5);        }

        

        trends.push(trend);      ], {

      }

            console.log(`📊 Total relevant trends found: ${filteredTrends.length}`);        max_tokens: 2048,

    } catch (error) {

      console.error('Error parsing trends:', error);      return filteredTrends;        temperature: 0.7

    }

          });

    return trends;

  }    } catch (error) {      



  // Extract title from content      console.error('❌ Error fetching trends:', error);      if (response.success && response.data) {

  private extractTitle(content: string): string | null {

    // Look for title patterns      return this.getMockTrends(categories);        const parsedContent = this.parseGeneratedContent(response.data.answer);

    const titlePatterns = [

      /^([A-Z][^.!?]*[.!?])/,  // First sentence starting with capital    }        

      /^([^.!?]{10,80})/,      // First line if reasonable length

    ];  }        const post: GeneratedPost = {

    

    for (const pattern of titlePatterns) {          id: `post_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,

      const match = content.match(pattern);

      if (match) {  // Generate content batch from trends          content: parsedContent.content,

        return match[1].trim();

      }  async generateContentBatch(trends: TrendData[]): Promise<GeneratedPost[]> {          hashtags: parsedContent.hashtags,

    }

        const posts: GeneratedPost[] = [];          trendId: trend.id,

    // Fallback: take first 50 characters

    return content.substring(0, 50).trim() + '...';              trendData: trend,

  }

    console.log(`📝 Generating content for ${trends.length} trends...`);          engagement_type: this.determineEngagementType(parsedContent.content),

  // Extract relevant keywords

  private extractKeywords(content: string, category: string): string[] {              status: config.human_approval_required ? 'pending_approval' : 'draft',

    const keywords: string[] = [];

        for (const trend of trends) {          generatedAt: new Date()

    // Category-specific keyword patterns

    const keywordPatterns: { [key: string]: RegExp[] } = {      try {        };

      'finance': [/\b(RBI|banking|interest rate|inflation|GDP|FDI|investment)\b/gi],

      'accounting': [/\b(IFRS|IndAS|accounting standard|audit|financial statement)\b/gi],        const post = await this.generateSinglePost(trend);

      'tax': [/\b(GST|income tax|tax rate|deduction|exemption|ITR|TDS)\b/gi],

      'business': [/\b(startup|IPO|merger|acquisition|corporate|compliance)\b/gi],        if (post) {        return post;

      'regulation': [/\b(SEBI|RBI|notification|circular|amendment|compliance)\b/gi]

    };          posts.push(post);      }

    

    const patterns = keywordPatterns[category] || [];        }      

    

    for (const pattern of patterns) {      } catch (error) {      throw new Error('Failed to generate content');

      const matches = content.match(pattern);

      if (matches) {        console.error(`❌ Error generating post for trend "${trend.title}":`, error);    } catch (error) {

        keywords.push(...matches.map(match => match.toLowerCase()));

      }      }      console.error('Error generating post content:', error);

    }

        }      throw error;

    // Remove duplicates and limit to 8 keywords

    return [...new Set(keywords)].slice(0, 8);        }

  }

    console.log(`✅ Generated ${posts.length} posts from ${trends.length} trends`);  }

  // Calculate relevance score for CA professionals

  private calculateRelevanceScore(content: string, category: string): number {    return posts;

    let score = 0.5; // Base score

      }  // Generate multiple posts from trending topics

    // High relevance keywords for CA professionals

    const highRelevanceKeywords = [  async generateBatchContent(trends: TrendData[], config: ContentPipelineConfig): Promise<GeneratedPost[]> {

      'chartered accountant', 'CA', 'audit', 'tax', 'GST', 'income tax',

      'financial statement', 'accounting', 'compliance', 'IFRS', 'IndAS',  // Generate a single LinkedIn post from trend data    const posts: GeneratedPost[] = [];

      'RBI', 'SEBI', 'budget', 'investment', 'corporate law'

    ];  private async generateSinglePost(trend: TrendData): Promise<GeneratedPost | null> {    const maxPosts = Math.min(trends.length, config.max_posts_per_day);

    

    const contentLower = content.toLowerCase();    try {    

    

    // Boost score for relevant keywords      if (!this.perplexityService) {    for (let i = 0; i < maxPosts; i++) {

    for (const keyword of highRelevanceKeywords) {

      if (contentLower.includes(keyword.toLowerCase())) {        return this.getMockPost(trend);      try {

        score += 0.1;

      }      }        const post = await this.generatePostContent(trends[i], config);

    }

            posts.push(post);

    // Category-specific boosts

    const categoryBoosts: { [key: string]: number } = {      const prompt = this.buildContentPrompt(trend);        

      'finance': 0.2,

      'accounting': 0.3,              // Add delay to avoid rate limiting

      'tax': 0.3,

      'regulation': 0.25,      const response = await this.perplexityService.chat([        await new Promise(resolve => setTimeout(resolve, 2000));

      'business': 0.15

    };        {      } catch (error) {

    

    score += categoryBoosts[category] || 0;          role: 'system',        console.error(`Error generating post for trend ${trends[i].id}:`, error);

    

    // Length penalty for very short content          content: 'You are a professional LinkedIn content creator for Chartered Accountants and finance professionals. Create engaging, professional posts that provide value to CA community.'      }

    if (content.length < 100) {

      score -= 0.2;        },    }

    }

            {    

    return Math.min(Math.max(score, 0), 1); // Clamp between 0 and 1

  }          role: 'user',    return posts;



  // Parse generated content from AI response          content: prompt  }

  private parseGeneratedContent(response: string): { content: string; hashtags: string[] } {

    let content = '';        }

    let hashtags: string[] = [];

          ], {  // Build search query for specific category

    try {

      const lines = response.split('\n');        max_tokens: 800,  private buildTrendQuery(category: string): string {

      let inContent = false;

      let inHashtags = false;        temperature: 0.7    const categoryQueries = {

      

      for (const line of lines) {      });      'finance': 'latest finance news India financial markets banking sector updates',

        const trimmed = line.trim();

              'accounting': 'accounting standards updates ICAI news financial reporting changes India',

        if (trimmed.toUpperCase().includes('CONTENT:')) {

          inContent = true;      if (response.choices && response.choices[0]) {      'tax': 'latest tax news India GST updates income tax changes government policy',

          inHashtags = false;

          continue;        const content = response.choices[0].message.content;      'business': 'Indian business news corporate updates startup funding market trends',

        }

                const parsedContent = this.parseGeneratedContent(content);      'technology': 'fintech India digital transformation accounting technology automation',

        if (trimmed.toUpperCase().includes('HASHTAGS:')) {

          inContent = false;              'regulation': 'financial regulations India compliance updates regulatory changes SEBI RBI'

          inHashtags = true;

          continue;        const post: GeneratedPost = {    };

        }

                  id: `post_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,

        if (inContent && trimmed) {

          content += (content ? '\n' : '') + trimmed;          content: parsedContent.content,    const baseQuery = categoryQueries[category as keyof typeof categoryQueries] || category;

        }

                  hashtags: parsedContent.hashtags,    return `${baseQuery} latest news today past 7 days`;

        if (inHashtags && trimmed) {

          const hashtagMatches = trimmed.match(/#\w+/g);          trendData: trend,  }

          if (hashtagMatches) {

            hashtags.push(...hashtagMatches);          status: 'pending',

          } else {

            // Parse hashtags without # symbol          createdAt: new Date(),  // Parse trends from Perplexity response

            const words = trimmed.split(/\s+/).filter(word => word.length > 2);

            hashtags.push(...words.map(word => word.startsWith('#') ? word : `#${word}`));          engagementPrediction: this.predictEngagement(parsedContent.content, trend)  private async parseTrendsFromResponse(response: any, category: string): Promise<TrendData[]> {

          }

        }        };    const trends: TrendData[] = [];

      }

          

      // Fallback: if structured parsing fails, try to extract from whole response

      if (!content) {        console.log(`✅ Generated post: "${post.content.substring(0, 50)}..."`);    try {

        const sentences = response.split(/[.!?]+/).filter(s => s.trim().length > 20);

        content = sentences.slice(0, 3).join('. ').trim();        return post;      // Extract key information from response

        if (content && !content.endsWith('.')) content += '.';

      }      }      const content = response.choices?.[0]?.message?.content || response.answer || '';

      

      // Ensure we have some hashtags            const citations = response.citations || [];

      if (hashtags.length === 0) {

        hashtags = ['#CharteredAccountant', '#Finance', '#Tax', '#Business', '#India'];      return this.getMockPost(trend);      

      }

          } catch (error) {      // Use AI to parse structured trend data

      // Limit hashtags

      hashtags = hashtags.slice(0, 8);      console.error('❌ Error generating single post:', error);      const parsePrompt = `

      

    } catch (error) {      return this.getMockPost(trend);Parse the following news content and extract individual news items/trends. Return as JSON array:

      console.error('Error parsing generated content:', error);

      content = 'Error generating content. Please try again.';    }

      hashtags = ['#CharteredAccountant', '#Finance'];

    }  }Content: ${content}

    

    return { content, hashtags };

  }

  // Get mock trends for testingFor each trend, provide:

  // Predict engagement metrics

  private predictEngagement(content: string, hashtags: string[], trend: TrendData): {  private getMockTrends(categories: string[]): TrendData[] {- title: Brief descriptive title

    expectedLikes: number;

    expectedComments: number;    const mockTrends: TrendData[] = [- summary: 2-3 sentence summary

    expectedShares: number;

    confidenceScore: number;      {- keywords: Array of relevant keywords

  } {

    // Base engagement prediction algorithm        title: "New GST Return Filing Requirements Announced for FY 2024-25",- relevanceScore: 0-1 score based on importance to CA/finance professionals

    let likesBase = 20;

    let commentsBase = 3;        category: "tax",- publishedAt: Estimated date (use today if unclear)

    let sharesBase = 2;

    let confidence = 0.6;        relevanceScore: 0.9,

    

    // Boost based on trend relevance        trendScore: 0.85,Return only valid JSON array format.

    const relevanceMultiplier = 1 + (trend.relevanceScore - 0.5);

            keywords: ["GST", "Return Filing", "Compliance", "CBIC"],`;

    // Boost based on hashtag quality

    const qualityHashtags = hashtags.filter(tag =>         summary: "Government announces new simplified GST return filing process with enhanced compliance measures for the upcoming financial year.",

      tag.toLowerCase().includes('ca') || 

      tag.toLowerCase().includes('tax') ||         publishedAt: new Date()      const parseResponse = await this.perplexityService.askQuestion(parsePrompt);

      tag.toLowerCase().includes('finance') ||

      tag.toLowerCase().includes('accounting')      },      

    ).length;

          {      if (parseResponse.success) {

    const hashtagBoost = 1 + (qualityHashtags * 0.1);

            title: "IndAS 116 Implementation Updates for Lease Accounting",        try {

    // Content length optimization (LinkedIn sweet spot: 150-300 chars)

    const contentLength = content.length;        category: "accounting",          const parsed = JSON.parse(parseResponse.data.answer.replace(/```json\n?|\n?```/g, ''));

    const lengthBoost = contentLength >= 150 && contentLength <= 300 ? 1.2 : 

                       contentLength < 150 ? 0.9 : 0.8;        relevanceScore: 0.8,          

    

    // Apply multipliers        trendScore: 0.75,          if (Array.isArray(parsed)) {

    const expectedLikes = Math.round(likesBase * relevanceMultiplier * hashtagBoost * lengthBoost);

    const expectedComments = Math.round(commentsBase * relevanceMultiplier * lengthBoost);        keywords: ["IndAS 116", "Lease Accounting", "ICAI", "Financial Reporting"],            parsed.forEach((item: any, index: number) => {

    const expectedShares = Math.round(sharesBase * relevanceMultiplier * lengthBoost);

            summary: "ICAI releases updated guidance on IndAS 116 implementation for lease accounting with practical examples.",              if (item.title && item.summary) {

    // Confidence based on factors

    confidence = Math.min(0.95, confidence + (trend.relevanceScore * 0.3) + (qualityHashtags * 0.05));        publishedAt: new Date()                trends.push({

    

    return {      },                  id: `trend_${Date.now()}_${index}`,

      expectedLikes,

      expectedComments,      {                  title: item.title,

      expectedShares,

      confidenceScore: Math.round(confidence * 100) / 100        title: "RBI Monetary Policy: Impact on Banking and Financial Services",                  source: 'Web Search',

    };

  }        category: "finance",                  summary: item.summary,



  // Utility function for delays        relevanceScore: 0.85,                  category: category as any,

  private sleep(ms: number): Promise<void> {

    return new Promise(resolve => setTimeout(resolve, ms));        trendScore: 0.8,                  relevanceScore: item.relevanceScore || 0.7,

  }

        keywords: ["RBI", "Monetary Policy", "Interest Rates", "Banking"],                  publishedAt: item.publishedAt ? new Date(item.publishedAt) : new Date(),

  // Get pipeline configuration

  getConfig(): Required<ContentPipelineConfig> {        summary: "Latest RBI monetary policy decisions and their implications for banking sector and financial planning.",                  keywords: item.keywords || [],

    return { ...this.config };

  }        publishedAt: new Date()                  url: citations[index]?.url



  // Update pipeline configuration      }                });

  updateConfig(newConfig: Partial<ContentPipelineConfig>): void {

    this.config = { ...this.config, ...newConfig };    ];              }

  }

}            });



export default LinkedInContentPipeline;    return mockTrends.filter(trend => categories.includes(trend.category));          }

  }        } catch (parseError) {

          console.error('Error parsing trends JSON:', parseError);

  // Get mock post for testing        }

  private getMockPost(trend: TrendData): GeneratedPost {      }

    const mockContents = {    } catch (error) {

      tax: `🚨 Important Update for CAs!       console.error('Error parsing trends:', error);

    }

The recent ${trend.title} brings significant changes to our practice. Here's what every CA needs to know:    

    return trends;

🔹 New compliance requirements effective immediately  }

🔹 Enhanced documentation needed for submissions

🔹 Updated timelines for filing processes  // Build content generation prompt

  private buildContentPrompt(trend: TrendData, config: ContentPipelineConfig): string {

This affects how we handle client advisory services and compliance management. Have you started preparing your clients for these changes?    return `

Create a professional LinkedIn post about this recent trend for Chartered Accountants and finance professionals:

What's your experience with similar regulatory updates? Share your insights below! 👇`,

            TREND: ${trend.title}

      accounting: `📊 Accounting Professionals Alert!       SUMMARY: ${trend.summary}

      CATEGORY: ${trend.category}

${trend.title} - here's what this means for our practice:      KEYWORDS: ${trend.keywords.join(', ')}POST REQUIREMENTS:

- Tone: ${config.content_tone}

✅ Updated standards require careful implementation- Length: 150-300 words

✅ Client communication is crucial during transition- Include relevant hashtags (5-8)

✅ Training teams on new requirements is essential- ${config.include_call_to_action ? 'Include subtle call-to-action' : 'No direct call-to-action'}

- Focus on insights and practical implications for CAs

The key is staying ahead of these changes and helping our clients navigate smoothly. - Make it engaging and shareable



How is your firm handling these accounting standard updates? Let's discuss strategies! 💭`,BRAND VOICE: ${config.brand_voice_guidelines || 'Professional yet approachable, focus on expertise and value'}

      

      finance: `💼 Finance Update for CAs!Format your response as:

CONTENT: [Post content here]

${trend.title} creates new opportunities and challenges:HASHTAGS: [comma-separated hashtags]

ENGAGEMENT_TYPE: [educational/news_analysis/insight/tip/question]

📈 Market implications for client portfolios`;

📈 Regulatory compliance considerations    }

📈 Strategic planning adjustments needed

  // Parse generated content response

As trusted advisors, we need to help clients understand these impacts and adjust their financial strategies accordingly.  private parseGeneratedContent(response: string): { content: string; hashtags: string[]; } {

    const contentMatch = response.match(/CONTENT:\s*(.*?)(?=HASHTAGS:|$)/s);

What trends are you seeing in client reactions to these changes? Share your thoughts! 🤝`    const hashtagsMatch = response.match(/HASHTAGS:\s*(.*?)(?=ENGAGEMENT_TYPE:|$)/s);

    };    

    const content = contentMatch?.[1]?.trim() || response;

    const defaultContent = `🔔 Professional Update!    const hashtagsStr = hashtagsMatch?.[1]?.trim() || '';

    const hashtags = hashtagsStr.split(',').map(tag => tag.trim().replace(/^#/, '')).filter(Boolean);

${trend.title}     

    return { content, hashtags };

This development in ${trend.category} sector requires our attention as finance professionals. Key takeaways:  }



• Monitor regulatory changes closely  // Determine engagement type from content

• Update client advisory processes  private determineEngagementType(content: string): GeneratedPost['engagement_type'] {

• Ensure compliance with new requirements    const lowerContent = content.toLowerCase();

    

How do you stay updated with industry changes? Let's connect and share best practices!     if (lowerContent.includes('?') || lowerContent.includes('what do you think')) {

      return 'question';

#CharteredAccountant #${trend.category.charAt(0).toUpperCase() + trend.category.slice(1)}Updates`;    } else if (lowerContent.includes('tip:') || lowerContent.includes('remember:')) {

      return 'tip';

    return {    } else if (lowerContent.includes('breaking:') || lowerContent.includes('news:')) {

      id: `mock_post_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,      return 'news_analysis';

      content: mockContents[trend.category as keyof typeof mockContents] || defaultContent,    } else if (lowerContent.includes('insight:') || lowerContent.includes('key takeaway:')) {

      hashtags: ['#CharteredAccountant', `#${trend.category}`, '#Compliance', '#ProfessionalUpdate'],      return 'insight';

      trendData: trend,    } else {

      status: 'pending',      return 'educational';

      createdAt: new Date(),    }

      engagementPrediction: this.predictEngagement('', trend)  }

    };

  }  // Calculate optimal posting times based on engagement data

  async getOptimalPostingTimes(historicalData?: GeneratedPost[]): Promise<string[]> {

  // Build search query for trends    // Default optimal times for professional audience

  private buildTrendQuery(category: string): string {    const defaultTimes = ['09:00', '13:00', '17:00'];

    const currentMonth = new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' });    

        if (!historicalData || historicalData.length < 10) {

    const categoryQueries = {      return defaultTimes;

      finance: `Latest financial news and regulations in India ${currentMonth} - GST updates, income tax changes, banking regulations, RBI notifications`,    }

      accounting: `New accounting standards and practices ${currentMonth} - IndAS updates, ICAI announcements, audit requirements, compliance changes`,

      tax: `Recent tax law changes and updates ${currentMonth} - direct tax, indirect tax, GST notifications, CBDT circulars, tax court judgments`,    // Analyze historical performance by hour

      business: `Business and corporate news affecting CAs ${currentMonth} - MCA notifications, company law updates, regulatory changes`,    const performanceByHour: { [hour: number]: number } = {};

      regulation: `Latest regulatory changes for professionals ${currentMonth} - professional standards, ethics updates, regulatory compliance`    

    };    historicalData.forEach(post => {

      if (post.publishedAt && post.performance) {

    return categoryQueries[category as keyof typeof categoryQueries] ||         const hour = post.publishedAt.getHours();

           `Latest ${category} news and updates for chartered accountants ${currentMonth}`;        const engagementScore = (post.performance.likes * 1) + 

  }                              (post.performance.comments * 3) + 

                              (post.performance.shares * 5);

  // Parse trends from API response        

  private parseTrendsFromResponse(content: string, category: string): TrendData[] {        performanceByHour[hour] = (performanceByHour[hour] || 0) + engagementScore;

    const trends: TrendData[] = [];      }

        });

    try {

      // Extract trend information from the response    // Find top 3 performing hours

      const lines = content.split('\n').filter(line => line.trim());    const sortedHours = Object.entries(performanceByHour)

      let currentTrend: Partial<TrendData> = {};      .sort(([,a], [,b]) => b - a)

            .slice(0, 3)

      for (const line of lines) {      .map(([hour]) => `${hour.padStart(2, '0')}:00`);

        const cleanLine = line.trim();

            return sortedHours.length > 0 ? sortedHours : defaultTimes;

        // Look for trend indicators  }

        if (cleanLine.includes('GST') || cleanLine.includes('Tax') || 

            cleanLine.includes('ICAI') || cleanLine.includes('MCA') ||  // Generate content suggestions for manual review

            cleanLine.includes('RBI') || cleanLine.includes('SEBI')) {  async generateContentSuggestions(count: number = 5): Promise<GeneratedPost[]> {

              const trends = await this.fetchLatestTrends();

          if (currentTrend.title) {    

            // Complete the previous trend    const config: ContentPipelineConfig = {

            const trend = this.completeTrendData(currentTrend, category, content);      enabled: true,

            if (trend) trends.push(trend);      posting_frequency: 'daily',

          }      preferred_posting_times: ['09:00', '13:00', '17:00'],

                categories: ['finance', 'accounting', 'tax'],

          // Start new trend      human_approval_required: true,

          currentTrend = {      max_posts_per_day: count,

            title: cleanLine.substring(0, 100), // Limit title length      content_tone: 'professional',

            category: category      include_call_to_action: true

          };    };

        }

      }    return this.generateBatchContent(trends.slice(0, count), config);

        }

      // Complete the last trend}

      if (currentTrend.title) {

        const trend = this.completeTrendData(currentTrend, category, content);export default LinkedInContentPipeline;
        if (trend) trends.push(trend);
      }
      
      // If no trends found, create one from the content
      if (trends.length === 0) {
        const fallbackTrend = this.createFallbackTrend(content, category);
        if (fallbackTrend) trends.push(fallbackTrend);
      }
      
    } catch (error) {
      console.error('Error parsing trends:', error);
      // Create fallback trend
      const fallbackTrend = this.createFallbackTrend(content, category);
      if (fallbackTrend) trends.push(fallbackTrend);
    }
    
    return trends;
  }

  // Complete trend data with defaults
  private completeTrendData(partialTrend: Partial<TrendData>, category: string, fullContent: string): TrendData | null {
    if (!partialTrend.title) return null;
    
    const keywords = this.extractKeywords(fullContent, category);
    
    return {
      title: partialTrend.title,
      category: category,
      relevanceScore: this.calculateRelevanceScore(partialTrend.title, keywords, category),
      trendScore: Math.random() * 0.3 + 0.7, // Random score between 0.7-1.0
      keywords: keywords,
      summary: this.createSummary(partialTrend.title, fullContent),
      publishedAt: new Date()
    };
  }

  // Create fallback trend when parsing fails
  private createFallbackTrend(content: string, category: string): TrendData | null {
    const title = `Latest ${category} updates`;
    const keywords = this.extractKeywords(content, category);
    
    if (keywords.length === 0) return null;
    
    return {
      title: title,
      category: category,
      relevanceScore: 0.6,
      trendScore: 0.7,
      keywords: keywords,
      summary: content.substring(0, 200) + '...',
      publishedAt: new Date()
    };
  }

  // Extract keywords from content
  private extractKeywords(content: string, category: string): string[] {
    const categoryKeywords = {
      finance: ['GST', 'Income Tax', 'TDS', 'Banking', 'RBI', 'Financial', 'Revenue'],
      accounting: ['IndAS', 'ICAI', 'Audit', 'Financial Statements', 'Compliance', 'Standards'],
      tax: ['Direct Tax', 'Indirect Tax', 'CBDT', 'Tax Court', 'Assessment', 'Notice'],
      business: ['MCA', 'Company Law', 'Corporate', 'Governance', 'ROC', 'Compliance'],
      regulation: ['Notification', 'Circular', 'Amendment', 'Rules', 'Guidelines', 'Standards']
    };

    const defaultKeywords = categoryKeywords[category as keyof typeof categoryKeywords] || [];
    const foundKeywords = defaultKeywords.filter(keyword => 
      content.toLowerCase().includes(keyword.toLowerCase())
    );

    return foundKeywords.length > 0 ? foundKeywords : [category.toUpperCase()];
  }

  // Calculate relevance score
  private calculateRelevanceScore(title: string, keywords: string[], category: string): number {
    let score = 0.5; // Base score
    
    // Boost for category-specific keywords
    const keywordBoost = Math.min(keywords.length * 0.1, 0.3);
    score += keywordBoost;
    
    // Boost for urgent/important terms
    const urgentTerms = ['notification', 'update', 'new', 'amendment', 'circular'];
    const urgentBoost = urgentTerms.some(term => 
      title.toLowerCase().includes(term)
    ) ? 0.2 : 0;
    score += urgentBoost;
    
    return Math.min(score, 1.0);
  }

  // Create summary from content
  private createSummary(title: string, content: string): string {
    // Take first meaningful paragraph or first 200 characters
    const sentences = content.split('.').filter(s => s.trim().length > 20);
    if (sentences.length > 0) {
      return sentences[0].trim() + '.';
    }
    return content.substring(0, 200).trim() + '...';
  }

  // Build content generation prompt
  private buildContentPrompt(trend: TrendData): string {
    return `Create a professional LinkedIn post for Chartered Accountants about this trend:

TREND: ${trend.title}
SUMMARY: ${trend.summary}
CATEGORY: ${trend.category}
KEYWORDS: ${trend.keywords.join(', ')}

POST REQUIREMENTS:
- Write in professional but engaging tone
- Target audience: Chartered Accountants, Tax Professionals, Finance Managers
- Length: 150-300 words
- Include practical insights or implications
- End with a question to encourage engagement
- Provide 5-8 relevant hashtags

FORMAT:
CONTENT:
[Your LinkedIn post content here]

HASHTAGS:
[List hashtags separated by spaces]

ENGAGEMENT_TYPE: question`;
  }

  // Parse generated content
  private parseGeneratedContent(response: string): { content: string; hashtags: string[] } {
    const contentMatch = response.match(/CONTENT:\s*(.*?)(?=HASHTAGS:|$)/i);
    const hashtagsMatch = response.match(/HASHTAGS:\s*(.*?)(?=ENGAGEMENT_TYPE:|$)/i);
    
    let content = contentMatch ? contentMatch[1].trim() : response;
    let hashtags: string[] = [];
    
    if (hashtagsMatch) {
      hashtags = hashtagsMatch[1]
        .split(/[\s,]+/)
        .map(tag => tag.trim().replace(/^#+/, '#'))
        .filter(tag => tag.length > 1);
    }
    
    // Fallback hashtags if none found
    if (hashtags.length === 0) {
      hashtags = ['#CharteredAccountant', '#TaxUpdates', '#Compliance', '#FinanceNews'];
    }
    
    // Clean content
    content = content.replace(/^\s*CONTENT:\s*/i, '').trim();
    
    return { content, hashtags };
  }

  // Predict engagement metrics
  private predictEngagement(content: string, trend: TrendData): {
    expectedLikes: number;
    expectedComments: number;
    expectedShares: number;
    confidenceScore: number;
  } {
    const baseEngagement = {
      likes: Math.floor(Math.random() * 50) + 10,
      comments: Math.floor(Math.random() * 15) + 2,
      shares: Math.floor(Math.random() * 10) + 1
    };
    
    // Boost based on trend relevance
    const multiplier = 1 + (trend.relevanceScore - 0.5);
    
    return {
      expectedLikes: Math.floor(baseEngagement.likes * multiplier),
      expectedComments: Math.floor(baseEngagement.comments * multiplier),
      expectedShares: Math.floor(baseEngagement.shares * multiplier),
      confidenceScore: trend.relevanceScore
    };
  }
}

export default LinkedInContentPipeline;