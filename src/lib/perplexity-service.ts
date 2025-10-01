// Perplexity AI API Service
interface PerplexityMessage {
  role: 'system' | 'user' | 'assistant'
  content: string
}

interface PerplexityRequest {
  model: string
  messages: PerplexityMessage[]
  max_tokens?: number
  temperature?: number
  top_p?: number
  return_citations?: boolean
  search_domain_filter?: string[]
  return_images?: boolean
  return_related_questions?: boolean
  search_recency_filter?: 'month' | 'week' | 'day' | 'hour'
  top_k?: number
  stream?: boolean
  presence_penalty?: number
  frequency_penalty?: number
}

interface PerplexityResponse {
  id: string
  object: string
  created: number
  model: string
  choices: {
    index: number
    finish_reason: string
    message: {
      role: string
      content: string
    }
    delta?: {
      role?: string
      content?: string
    }
  }[]
  usage: {
    prompt_tokens: number
    completion_tokens: number
    total_tokens: number
  }
}

export class PerplexityService {
  private apiKey: string
  private baseUrl: string = 'https://api.perplexity.ai'

  constructor(apiKey: string) {
    this.apiKey = apiKey
  }

  async chat(
    messages: PerplexityMessage[],
    options: Partial<PerplexityRequest> = {}
  ): Promise<PerplexityResponse> {
    const request: PerplexityRequest = {
      model: options.model || 'llama-3.1-sonar-small-128k-online',
      messages,
      max_tokens: options.max_tokens || 2048,
      temperature: options.temperature || 0.2,
      top_p: options.top_p || 0.9,
      return_citations: options.return_citations ?? true,
      return_images: options.return_images ?? false,
      return_related_questions: options.return_related_questions ?? true,
      search_recency_filter: options.search_recency_filter || 'month',
      top_k: options.top_k || 0,
      stream: options.stream || false,
      presence_penalty: options.presence_penalty || 0,
      frequency_penalty: options.frequency_penalty || 1,
      ...options
    }

    try {
      const response = await fetch(`${this.baseUrl}/chat/completions`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(request),
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(`Perplexity API Error: ${response.status} - ${errorData.error?.message || response.statusText}`)
      }

      return await response.json()
    } catch (error) {
      console.error('Perplexity API request failed:', error)
      throw error
    }
  }

  // Specialized method for CA-related queries
  async askCAQuestion(
    question: string,
    context?: string,
    searchRecency: 'month' | 'week' | 'day' | 'hour' = 'month'
  ): Promise<PerplexityResponse> {
    const systemMessage: PerplexityMessage = {
      role: 'system',
      content: `You are an expert Chartered Accountant (CA) assistant specializing in Indian accounting, taxation, and compliance. 
      
      Your expertise includes:
      - Indian Income Tax Act, GST, and corporate law
      - Financial reporting standards (Ind AS, GAAP)
      - Audit procedures and compliance requirements
      - Tax planning and optimization strategies
      - Corporate governance and regulatory matters
      - Recent updates in Indian tax and accounting regulations
      
      Always provide accurate, up-to-date information with proper citations. When discussing tax rates or regulations, specify the assessment year and any recent changes. Include practical examples where helpful.
      
      ${context ? `Additional context: ${context}` : ''}`
    }

    const userMessage: PerplexityMessage = {
      role: 'user',
      content: question
    }

    return await this.chat([systemMessage, userMessage], {
      model: 'llama-3.1-sonar-large-128k-online',
      temperature: 0.1,
      search_recency_filter: searchRecency,
      return_citations: true,
      return_related_questions: true,
      search_domain_filter: ['taxguru.in', 'cleartax.in', 'charteredclub.com', 'incometaxindia.gov.in']
    })
  }

  // Method for SEO content generation
  async generateSEOContent(
    topic: string,
    keywords: string[],
    contentType: 'blog' | 'landing-page' | 'product-description' | 'meta-tags' = 'blog',
    targetAudience?: string
  ): Promise<PerplexityResponse> {
    const systemMessage: PerplexityMessage = {
      role: 'system',
      content: `You are an expert SEO content writer and digital marketing specialist. Your task is to create high-quality, search-engine-optimized content that ranks well and engages readers.

      Your expertise includes:
      - SEO best practices and keyword optimization
      - Content structure for maximum readability and engagement
      - Meta descriptions, title tags, and headers optimization
      - Understanding of search intent and user behavior
      - Current Google algorithm preferences and ranking factors
      - Conversion-focused copywriting techniques

      Always create content that:
      - Naturally incorporates target keywords without stuffing
      - Follows proper heading hierarchy (H1, H2, H3)
      - Includes actionable insights and value for readers
      - Optimizes for featured snippets and voice search
      - Maintains readability and user engagement
      - Includes relevant internal and external linking opportunities

      Content Type: ${contentType}
      ${targetAudience ? `Target Audience: ${targetAudience}` : ''}
      Target Keywords: ${keywords.join(', ')}`
    }

    const userMessage: PerplexityMessage = {
      role: 'user',
      content: `Create comprehensive SEO-optimized content for the topic: "${topic}"

      Please include:
      1. SEO-optimized title and meta description
      2. Well-structured content with proper headings
      3. Natural keyword integration
      4. Call-to-action elements
      5. Related keywords and LSI terms
      6. Content outline for additional sections

      Focus on creating content that provides real value while being optimized for search engines.`
    }

    return await this.chat([systemMessage, userMessage], {
      model: 'llama-3.1-sonar-large-128k-online',
      temperature: 0.3,
      search_recency_filter: 'week',
      return_citations: true,
      return_related_questions: true,
      max_tokens: 4000
    })
  }

  // Method for marketing strategy generation
  async generateMarketingStrategy(
    businessType: string,
    targetMarket: string,
    budget?: string,
    goals?: string[]
  ): Promise<PerplexityResponse> {
    const systemMessage: PerplexityMessage = {
      role: 'system',
      content: `You are an expert digital marketing strategist and business consultant with extensive knowledge of modern marketing techniques, customer acquisition, and growth strategies.

      Your expertise includes:
      - Digital marketing strategy development
      - Customer persona creation and targeting
      - Multi-channel marketing campaigns
      - Performance tracking and analytics
      - Budget optimization and ROI maximization
      - Current marketing trends and best practices
      - Platform-specific strategies (Google, Facebook, LinkedIn, etc.)

      Always provide actionable, data-driven marketing recommendations with specific tactics, timelines, and success metrics.`
    }

    const userMessage: PerplexityMessage = {
      role: 'user',
      content: `Create a comprehensive marketing strategy for:

      Business Type: ${businessType}
      Target Market: ${targetMarket}
      ${budget ? `Budget: ${budget}` : ''}
      ${goals ? `Goals: ${goals.join(', ')}` : ''}

      Please include:
      1. Market analysis and competitive landscape
      2. Customer persona and targeting strategy
      3. Channel recommendations and tactics
      4. Content marketing strategy
      5. Budget allocation recommendations
      6. KPIs and success metrics
      7. Implementation timeline
      8. Risk assessment and mitigation strategies

      Focus on practical, implementable strategies with clear ROI expectations.`
    }

    return await this.chat([systemMessage, userMessage], {
      model: 'llama-3.1-sonar-large-128k-online',
      temperature: 0.2,
      search_recency_filter: 'week',
      return_citations: true,
      return_related_questions: true,
      max_tokens: 4000
    })
  }
}

// Utility function to create service instance
export function createPerplexityService(): PerplexityService {
  const apiKey = process.env.PERPLEXITY_API_KEY
  if (!apiKey) {
    throw new Error('PERPLEXITY_API_KEY environment variable is required')
  }
  return new PerplexityService(apiKey)
}

// Rate limiting and caching utilities
export class PerplexityCache {
  private cache = new Map<string, { data: any; timestamp: number; ttl: number }>()

  set(key: string, data: any, ttlMinutes: number = 30): void {
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      ttl: ttlMinutes * 60 * 1000
    })
  }

  get(key: string): any | null {
    const item = this.cache.get(key)
    if (!item) return null

    if (Date.now() - item.timestamp > item.ttl) {
      this.cache.delete(key)
      return null
    }

    return item.data
  }

  clear(): void {
    this.cache.clear()
  }

  generateKey(messages: PerplexityMessage[], options: any): string {
    return Buffer.from(JSON.stringify({ messages, options })).toString('base64').slice(0, 50)
  }
}

export const perplexityCache = new PerplexityCache()