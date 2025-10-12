import Groq from 'groq-sdk';
import { HfInference } from '@huggingface/inference';
import { INewsArticle } from '@/models/NewsArticle';
import { IGeneratedContent } from '@/models/GeneratedContent';

// Initialize AI clients
const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY!,
});

const hf = new HfInference(process.env.HUGGING_FACE_API_KEY!);

export interface ContentGenerationRequest {
  type: string; // Will be normalized to match enum values
  newsArticles: INewsArticle[];
  customPrompt?: string;
  model?: 'qwen/qwen3-32b';
}

export class AIProcessor {
  // HuggingFace embeddings for content similarity and RAG
  async generateEmbeddings(text: string): Promise<number[]> {
    try {
      const response = await hf.featureExtraction({
        model: 'sentence-transformers/all-MiniLM-L6-v2',
        inputs: text
      });
      
      // Handle different response formats
      if (Array.isArray(response)) {
        return response.flat() as number[];
      }
      return response as number[];
    } catch (error) {
      console.error('Error generating embeddings:', error);
      throw error;
    }
  }

  // Specific methods for automation service
  async generateTaxArticle(newsArticle: any): Promise<string | null> {
    try {
      const prompt = `Generate a COMPLETE, FULL-LENGTH professional tax article for Chartered Accountants. Write the entire article, not a summary or overview.

News Source:
Title: ${newsArticle.title}
Content: ${newsArticle.content}
Source: ${newsArticle.source}

Required Article Structure (FULL ARTICLE, minimum 1000 words):
1. Compelling headline that captures the tax implications
2. Executive summary highlighting key changes
3. Detailed analysis of tax implications and changes
4. Impact assessment on different taxpayer categories
5. Compliance requirements and deadlines
6. Professional advisory recommendations
7. Practical implementation strategies
8. Case study examples where applicable
9. Conclusion with actionable next steps

Write as a complete, publishable article that CA professionals can use directly with their clients. Include specific examples, calculations, and real-world applications.`;

      const response = await this.generateWithGroq(prompt, 'qwen/qwen3-32b');
      return response.content;
    } catch (error) {
      console.error('Error generating tax article:', error);
      return null;
    }
  }

  async generateSEOContent(newsArticle: any): Promise<string | null> {
    try {
      const prompt = `Create a COMPLETE, FULL-LENGTH SEO-optimized article for a CA practice website. Write the entire article, not just an outline.

News Source:
Title: ${newsArticle.title}
Content: ${newsArticle.content}
Source: ${newsArticle.source}

Required Article Structure (FULL ARTICLE, minimum 800 words):
1. SEO-optimized headline with target keywords
2. Engaging introduction that hooks potential clients
3. Detailed explanation of the topic and its relevance
4. Benefits and implications for businesses and individuals
5. How CA professionals can help clients navigate these changes
6. Service offerings and expertise areas
7. Client success stories or case examples
8. Clear calls-to-action throughout
9. Conclusion emphasizing professional value

Target keywords: chartered accountant, tax advisory, compliance services, audit, financial consulting. Write as a complete, publishable article that establishes authority and drives client engagement.`;

      const response = await this.generateWithGroq(prompt, 'qwen/qwen3-32b');
      return response.content;
    } catch (error) {
      console.error('Error generating SEO content:', error);
      return null;
    }
  }

  async generateComplianceGuide(newsArticle: any): Promise<string | null> {
    try {
      const prompt = `Create a COMPLETE, COMPREHENSIVE compliance guide based on this regulatory update. Write the full guide, not just key points.

News Source:
Title: ${newsArticle.title}
Content: ${newsArticle.content}
Source: ${newsArticle.source}

Required Guide Structure (FULL GUIDE, minimum 1200 words):
1. Executive summary of regulatory changes
2. Who is affected and when changes take effect
3. Detailed step-by-step compliance process
4. Required documentation and forms checklist
5. Critical deadlines and timeline
6. Common compliance mistakes and how to avoid them
7. Best practices for implementation
8. Cost implications and budget considerations
9. Professional advisory recommendations
10. Frequently asked questions
11. Next steps and ongoing compliance requirements

Write as a complete, actionable compliance manual that businesses and CA professionals can follow step-by-step.`;

      const response = await this.generateWithGroq(prompt, 'qwen/qwen3-32b');
      return response.content;
    } catch (error) {
      console.error('Error generating compliance guide:', error);
      return null;
    }
  }

  async generateAuditChecklist(newsArticle: any): Promise<string | null> {
    try {
      const prompt = `Create a comprehensive audit checklist for this regulatory update:

Title: ${newsArticle.title}
Content: ${newsArticle.content}
Source: ${newsArticle.source}

Include:
1. Specific audit procedures
2. Documentation requirements
3. Risk assessment points
4. Compliance verification steps
5. Internal control considerations
6. Reporting requirements

Format as a professional ${new Date().getFullYear()} audit checklist with checkbox items.`;

      const response = await this.generateWithGroq(prompt, 'qwen/qwen3-32b');
      return response.content;
    } catch (error) {
      console.error('Error generating audit checklist:', error);
      return null;
    }
  }

  async generateExamQuestions(newsArticle: any): Promise<string | null> {
    try {
      const prompt = `Create 10 CA exam-style questions for this regulatory update:

Title: ${newsArticle.title}
Content: ${newsArticle.content}
Source: ${newsArticle.source}

Requirements:
1. Test understanding of the topic
2. Include theoretical and practical scenarios
3. Cover different difficulty levels
4. Follow ICAI exam patterns
5. Include detailed answers with explanations
6. Reference relevant provisions

Format: Question followed by detailed answer.`;

      const response = await this.generateWithGroq(prompt, 'qwen/qwen3-32b');
      return response.content;
    } catch (error) {
      console.error('Error generating exam questions:', error);
      return null;
    }
  }

  async generateLoopholeAnalysis(newsArticle: any): Promise<string | null> {
    try {
      const prompt = `Create a COMPLETE, IN-DEPTH loophole analysis and strategic planning report based on this regulatory update. Write the full analysis, not just bullet points.

News Source:
Title: ${newsArticle.title}
Content: ${newsArticle.content}
Source: ${newsArticle.source}

Required Analysis Structure (FULL REPORT, minimum 1000 words):
1. Executive summary of regulatory changes and opportunities
2. Detailed identification of legitimate tax planning opportunities
3. Analysis of potential compliance gaps and interpretation ambiguities
4. Strategic implementation frameworks and methodologies
5. Comprehensive risk assessment matrix
6. Ethical considerations and professional boundaries
7. Case study examples and practical applications
8. Cost-benefit analysis of different strategies
9. Timeline for implementation before regulatory clarifications
10. Professional best practices and ICAI compliance requirements
11. Client communication strategies
12. Documentation and record-keeping requirements

Write as a complete strategic planning document that CA professionals can use to advise clients while maintaining the highest ethical standards.`;

      const response = await this.generateWithGroq(prompt, 'qwen/qwen3-32b');
      return response.content;
    } catch (error) {
      console.error('Error generating loophole analysis:', error);
      return null;
    }
  }

  // Enhanced content generation with embeddings
  async generateContentWithRAG(query: string, contentType: string): Promise<string | null> {
    try {
      // Generate embeddings for the query
      const queryEmbeddings = await this.generateEmbeddings(query);
      
      // Get relevant news articles (this would ideally use vector similarity search)
      const { connectToDatabase } = await import('./database');
      await connectToDatabase();
      const NewsArticle = (await import('@/models/NewsArticle')).default;
      
      const relevantArticles = await NewsArticle.find({
        $or: [
          { title: { $regex: query, $options: 'i' } },
          { content: { $regex: query, $options: 'i' } },
          { tags: { $in: [query.toLowerCase()] } }
        ]
      }).limit(3);

      if (relevantArticles.length === 0) {
        return null;
      }

      // Generate content based on relevant articles
      const context = relevantArticles.map(article => 
        `${article.title}: ${article.summary || article.content.substring(0, 500)}`
      ).join('\n\n');

      const prompt = `Based on the following context about CA law and regulations, generate ${contentType}:

Context:
${context}

Query: ${query}

Generate comprehensive, professional content that addresses the query using the provided context.`;

      const response = await this.generateWithGroq(prompt, 'qwen/qwen3-32b');
      return response.content;
    } catch (error) {
      console.error('Error generating content with RAG:', error);
      return null;
    }
  }
  private readonly prompts = {
    tax_article: `You are an expert Chartered Accountant and tax advisor. Create a COMPLETE, COMPREHENSIVE tax article (minimum 1000 words) that:

1. Provides detailed explanation of new tax reforms in professional yet accessible language
2. Thoroughly analyzes key changes affecting individuals, businesses, and different entity types
3. Offers comprehensive practical implications with specific examples and calculations
4. Includes detailed actionable advice and implementation strategies for Chartered Accountants
5. Maintains strict compliance with ICAI guidelines and professional standards
6. Uses clear, engaging language with real-world case studies and scenarios
7. Addresses common client questions and concerns
8. Provides timeline for implementation and compliance deadlines
9. Includes risk assessment and mitigation strategies

Write as a complete, publishable article that CAs can use directly for client education and practice development.`,

    audit_checklist: `You are an experienced auditor and compliance expert. Based on the provided news articles about regulatory changes, create a comprehensive audit checklist that:

1. Lists specific procedures to verify compliance with new regulations
2. Includes risk assessment points
3. Provides documentation requirements
4. Covers internal control considerations
5. Addresses disclosure requirements
6. Follows standard audit methodology

Make it practical and actionable for audit professionals.`,

    exam_questions: `You are an expert in Chartered Accountancy education. Based on the provided news articles about regulatory updates, generate 10 exam-style questions that:

1. Test understanding of new regulations and reforms
2. Include both theoretical and practical scenarios
3. Cover different difficulty levels (basic to advanced)
4. Follow ICAI exam pattern and style
5. Include detailed answers with explanations
6. Reference relevant sections and provisions

Focus on topics that are likely to appear in CA exams.`,

    seo_content: `You are a content marketing expert specializing in professional services. Create a COMPLETE, FULL-LENGTH SEO-optimized article (minimum 800 words) that:

1. Targets relevant keywords for CA practice (chartered accountant, tax services, audit, compliance)  
2. Appeals to potential clients seeking professional tax/audit services
3. Establishes thought leadership and demonstrates expertise
4. Includes clear calls-to-action throughout the content
5. Uses engaging, professional tone that builds trust
6. Optimizes for search engines while maintaining excellent readability
7. Includes practical examples and client benefits
8. Addresses common client pain points and solutions

Write as a complete, publishable article that drives client engagement and establishes authority.`,

    compliance_guide: `You are a compliance expert and regulatory advisor. Create a COMPREHENSIVE, COMPLETE compliance guide (minimum 1200 words) that:

1. Breaks down complex regulations into detailed, actionable steps
2. Provides clear timelines, deadlines, and milestone checkpoints
3. Includes comprehensive documentation and form requirements
4. Highlights common pitfalls and provides specific avoidance strategies
5. Offers practical implementation tips with real-world examples
6. Addresses different business sizes, types, and industry sectors
7. Includes cost considerations and budget planning
8. Provides troubleshooting guidance for common issues
9. Offers templates and checklists where applicable

Write as a complete compliance manual that professionals can follow step-by-step.`,

    loophole_analysis: `You are a tax expert and legal advisor. Create a DETAILED, COMPREHENSIVE strategic analysis report (minimum 1000 words) that:

1. Identifies and explains legitimate tax planning opportunities in detail
2. Analyzes complex provisions with clear, practical explanations
3. Provides thorough risk assessment and compliance considerations
4. Addresses ethical boundaries and professional responsibilities
5. Suggests detailed implementation strategies with timelines
6. Warns against aggressive tax avoidance with specific examples
7. Includes case studies and real-world applications
8. Provides cost-benefit analysis of different strategies
9. Addresses regulatory risks and future law changes
10. Offers client communication and documentation strategies

Write as a complete strategic planning document that maintains the highest ethical standards while providing valuable professional insights.`
  };

  async generateContent(request: ContentGenerationRequest): Promise<IGeneratedContent> {
    try {
      const { newsArticles, customPrompt, model = 'qwen/qwen3-32b' } = request;
      const type = this.normalizeContentType(request.type);
      
      // Prepare context from news articles
      const context = this.prepareContext(newsArticles);
      
      // Get the appropriate prompt
      const basePrompt = customPrompt || this.prompts[type];
      const fullPrompt = `${basePrompt}\n\nNews Articles Context:\n${context}`;

      // Generate content with Groq
      const response = await this.generateWithGroq(fullPrompt, model);
      
      // Generate title
      const title = await this.generateTitle(response.content, type);

      // Calculate metadata
      const metadata = this.calculateMetadata(response.content);

      const generatedContent: Partial<IGeneratedContent> = {
        type,
        title,
        content: response.content,
        sourceNewsIds: newsArticles.map(article => article._id || article.id),
        prompt: fullPrompt,
        model,
        tokens: response.tokens,
        cost: response.cost,
        metadata,
        status: 'draft'
      };

      return generatedContent as IGeneratedContent;
    } catch (error) {
      console.error('Error generating content:', error);
      throw error;
    }
  }

  private prepareContext(newsArticles: INewsArticle[]): string {
    return newsArticles.map((article, index) => {
      return `Article ${index + 1} - ${article.title} (${article.source}):
Published: ${article.publishedAt.toISOString().split('T')[0]}
Summary: ${article.summary}
Content: ${article.content.substring(0, 1000)}...
Category: ${article.category}
Impact: ${article.impact}
Tags: ${article.tags.join(', ')}
---`;
    }).join('\n\n');
  }

  private async generateWithGroq(prompt: string, model: string): Promise<{ content: string; tokens: number; cost: number }> {
    const response = await groq.chat.completions.create({
      model: model,
      messages: [
        {
          role: 'system',
          content: 'You are an expert Chartered Accountant and professional content creator. CRITICAL INSTRUCTIONS FOR CLEAN OUTPUT: \n\n🚫 ABSOLUTELY FORBIDDEN:\n- NO <think>, <thinking>, [thinking], or ANY thinking tags\n- NO thinking process, analysis steps, or reasoning explanation\n- NO introductory phrases: "Here is...", "Based on...", "I will...", "Let me...", "First,", "To create this...", "In this article...", "This content...", "I have prepared...", "I have created..."\n- NO meta-commentary about the content or your process\n- NO explanations of what you are doing or going to do\n\n✅ REQUIRED OUTPUT FORMAT:\n- START IMMEDIATELY with the actual content (title, headings, body text)\n- Write as if you ARE the final published article/content itself\n- Provide FULL, COMPLETE articles with detailed information\n- Be direct, professional, and comprehensive\n- Include specific examples, case studies, and practical applications\n- Maintain ICAI compliance and professional standards\n- Generate substantial, valuable content that CAs can immediately use\n\nRemember: The user should see ONLY the final polished content, never your thought process!'
        },
        {
          role: 'user',
          content: prompt
        }
      ],
      max_tokens: 4000,
      temperature: 0.7
    });

    let content = response.choices[0]?.message?.content || '';
    const tokens = response.usage?.total_tokens || 0;
    const cost = this.calculateGroqCost(tokens, model);

    // Filter out <think> tags and their content
    content = this.filterThinkingContent(content);

    return { content, tokens, cost };
  }

  private async generateTitle(content: string, type: string): Promise<string> {
    try {
      const titlePrompt = `Based on this content, generate a compelling, SEO-friendly title (max 60 characters):

${content.substring(0, 500)}...

The title should be:
- Clear and descriptive
- Include relevant keywords
- Appeal to Chartered Accountants and their clients
- Match the content type: ${type}`;

      const response = await groq.chat.completions.create({
        model: 'qwen/qwen3-32b',
        messages: [
          {
            role: 'system',
            content: '🚫 CRITICAL: Generate ONLY the title text - NO <think>, <thinking>, [thinking] tags, NO explanation, NO preamble, NO analysis, NO commentary. Just the clean title text that will be displayed to users. ABSOLUTELY NO THINKING PROCESS!'
          },
          {
            role: 'user',
            content: titlePrompt
          }
        ],
        max_tokens: 100,
        temperature: 0.7
      });

      let title = response.choices[0]?.message?.content?.trim() || `Generated ${type} - ${new Date().toLocaleDateString()}`;
      
      // Apply comprehensive filtering to remove any thinking content from title
      title = this.filterThinkingContent(title);
      
      // Additional title-specific cleaning
      title = title.replace(/^(Title:|TITLE:)/gi, '').trim();
      title = title.replace(/^["']|["']$/g, '').trim(); // Remove quotes
      
      // If title is still problematic, generate a fallback
      if (title.includes('<think>') || title.includes('<thinking>') || title.length < 5) {
        title = `${type.replace('_', ' ').toUpperCase()} - ${new Date().toLocaleDateString()}`;
      }
      
      return title;
    } catch (error) {
      console.error('Error generating title:', error);
      return `Generated ${type} - ${new Date().toLocaleDateString()}`;
    }
  }

  private calculateMetadata(content: string) {
    const wordCount = content.split(/\s+/).length;
    const readingTime = Math.ceil(wordCount / 200); // Average reading speed: 200 words per minute

    // Basic SEO score calculation
    const seoScore = this.calculateSEOScore(content);

    return {
      wordCount,
      readingTime,
      category: 'general',
      tags: [],
      seoScore
    };
  }

  private calculateSEOScore(content: string): number {
    let score = 0;
    const text = content.toLowerCase();

    // Check for relevant keywords
    const keywords = ['tax', 'audit', 'compliance', 'regulation', 'gst', 'icai', 'chartered accountant'];
    const keywordCount = keywords.filter(keyword => text.includes(keyword)).length;
    score += keywordCount * 10;

    // Check content length
    if (content.length > 1000) score += 20;
    if (content.length > 2000) score += 10;

    // Check for headings
    const headingCount = (content.match(/#{1,6}\s/g) || []).length;
    score += headingCount * 5;

    // Check for lists
    const listCount = (content.match(/^\s*[-*]\s/gm) || []).length;
    score += Math.min(listCount * 2, 10);

    return Math.min(score, 100);
  }

  private calculateGroqCost(tokens: number, model: string): number {
    const pricing = {
      'qwen/qwen3-32b': 0.0008 / 1000, // $0.0008 per 1K tokens (estimated for Qwen3)
      'qwen/qwen2.5-72b-instruct': 0.0008 / 1000, // $0.0008 per 1K tokens (legacy)
      'llama3-8b-8192': 0.0002 / 1000, // $0.0002 per 1K tokens (legacy)
      'llama3-70b-8192': 0.0008 / 1000, // $0.0008 per 1K tokens (legacy)
      'mixtral-8x7b-32768': 0.0006 / 1000 // $0.0006 per 1K tokens (legacy)
    };
    return tokens * (pricing[model as keyof typeof pricing] || pricing['qwen/qwen3-32b']);
  }

  async generateSimpleContent(query: string, type: string): Promise<IGeneratedContent> {
    try {
      // Get recent news articles from database
      const { connectToDatabase } = await import('./database');
      await connectToDatabase();
      const NewsArticle = (await import('@/models/NewsArticle')).default;
      
      // Find articles related to the query
      const newsArticles = await NewsArticle.find({
        $or: [
          { title: { $regex: query, $options: 'i' } },
          { content: { $regex: query, $options: 'i' } },
          { tags: { $in: [query.toLowerCase()] } }
        ]
      }).limit(5);

      if (newsArticles.length === 0) {
        // Fallback to latest articles if no matches found
        const latestArticles = await NewsArticle.find().sort({ publishedAt: -1 }).limit(3);
        if (latestArticles.length === 0) {
          throw new Error('No news articles found in database');
        }
        newsArticles.push(...latestArticles);
      }

      // Normalize type to match enum values
      const normalizedType = this.normalizeContentType(type);
      
      // Generate content based on retrieved articles
      const request: ContentGenerationRequest = {
        type: normalizedType,
        newsArticles,
        model: 'qwen/qwen3-32b'
      };

      return await this.generateContent(request);
    } catch (error) {
      console.error('Error generating simple content:', error);
      throw error;
    }
  }

  // Normalize content type to match enum values
  private normalizeContentType(type: string): 'tax_article' | 'audit_checklist' | 'exam_questions' | 'seo_content' | 'compliance_guide' | 'loophole_analysis' {
    // Convert hyphens to underscores and handle common variations
    const normalized = type.toLowerCase().replace(/-/g, '_');
    
    const typeMap: Record<string, 'tax_article' | 'audit_checklist' | 'exam_questions' | 'seo_content' | 'compliance_guide' | 'loophole_analysis'> = {
      'tax_article': 'tax_article',
      'tax-article': 'tax_article',
      'tax article': 'tax_article',
      'audit_checklist': 'audit_checklist',
      'audit-checklist': 'audit_checklist',
      'audit checklist': 'audit_checklist',
      'exam_questions': 'exam_questions',
      'exam-questions': 'exam_questions',
      'exam questions': 'exam_questions',
      'seo_content': 'seo_content',
      'seo-content': 'seo_content',
      'seo content': 'seo_content',
      'compliance_guide': 'compliance_guide',
      'compliance-guide': 'compliance_guide',
      'compliance guide': 'compliance_guide',
      'loophole_analysis': 'loophole_analysis',
      'loophole-analysis': 'loophole_analysis',
      'loophole analysis': 'loophole_analysis'
    };
    
    const mappedType = typeMap[normalized] || typeMap[type.toLowerCase()];
    
    if (!mappedType) {
      console.warn(`Unknown content type: ${type}, defaulting to tax_article`);
      return 'tax_article';
    }
    
    return mappedType;
  }

  // Filter out thinking content and unwanted meta-commentary
  private filterThinkingContent(content: string): string {
    // Remove ALL thinking tag patterns (comprehensive list)
    content = content.replace(/<think>[\s\S]*?<\/think>/gi, '');
    content = content.replace(/<thinking>[\s\S]*?<\/thinking>/gi, '');
    content = content.replace(/\[thinking\][\s\S]*?\[\/thinking\]/gi, '');
    content = content.replace(/\[think\][\s\S]*?\[\/think\]/gi, '');
    content = content.replace(/\*\*thinking\*\*[\s\S]*?\*\*\/thinking\*\*/gi, '');
    content = content.replace(/\*\*think\*\*[\s\S]*?\*\*\/think\*\*/gi, '');
    content = content.replace(/\(\(thinking[\s\S]*?\)\)/gi, '');
    content = content.replace(/\{\{thinking[\s\S]*?\}\}/gi, '');
    
    // Remove thinking headers and blocks
    content = content.replace(/\*\*Thinking:\*\*[\s\S]*?(?=\n\n|\n\*\*|$)/gi, '');
    content = content.replace(/\*Thinking\*:[\s\S]*?(?=\n\n|\n\*|$)/gi, '');
    content = content.replace(/Thinking:[\s\S]*?(?=\n\n|\n[A-Z]|$)/gi, '');
    content = content.replace(/THINKING:[\s\S]*?(?=\n\n|\n[A-Z]|$)/gi, '');
    
    // Remove thinking process phrases
    content = content.replace(/Let me think[\s\S]*?(?=\n\n|$)/gi, '');
    content = content.replace(/Let me analyze[\s\S]*?(?=\n\n|$)/gi, '');
    content = content.replace(/First, I need to[\s\S]*?(?=\n\n|$)/gi, '');
    content = content.replace(/I'll analyze[\s\S]*?(?=\n\n|$)/gi, '');
    content = content.replace(/I need to[\s\S]*?(?=\n\n|$)/gi, '');
    content = content.replace(/Analysis:[\s\S]*?(?=\n\n|\n[A-Z#])/gi, '');
    content = content.replace(/My analysis:[\s\S]*?(?=\n\n|\n[A-Z#])/gi, '');
    
    // Remove ALL meta-commentary and introductory phrases
    content = content.replace(/^(Here is|Here's|Based on|I will|Let me|Okay,|I'll|Let's|Now,|Actually,|So,|Well,)[\s\S]*?(?=\n\n|\n[A-Z#])/gm, '');
    content = content.replace(/^(Here is a|Here's a|This is a|I've created a|I've prepared a|I have created|I have prepared|I've written|I have written)[\s\S]*?(?=\n\n|\n[A-Z#])/gm, '');
    content = content.replace(/^(Below is|Following is|The following is|What follows is)[\s\S]*?(?=\n\n|\n[A-Z#])/gm, '');
    
    // Remove process explanation sentences
    content = content.replace(/^(To create this|In creating this|For this|When writing this|While writing|In writing this)[\s\S]*?(?=\n\n|\n[A-Z#])/gm, '');
    content = content.replace(/^(I will now|I'll now|Now I will|Now I'll)[\s\S]*?(?=\n\n|\n[A-Z#])/gm, '');
    
    // Remove lines with process-oriented verbs
    content = content.replace(/^.*?(analyzing|considering|examining|reviewing|evaluating|preparing|creating|writing|developing|formulating|constructing).*?$/gmi, '');
    
    // Remove any remaining standalone thinking indicators
    content = content.replace(/^(Hmm|Okay|Alright|Right|Sure|Certainly)[\.,]?\s*$/gmi, '');
    
    // Remove empty parentheses or brackets that might be left over
    content = content.replace(/\(\s*\)/g, '');
    content = content.replace(/\[\s*\]/g, '');
    content = content.replace(/\{\s*\}/g, '');
    
    // Clean up extra whitespace and empty lines
    content = content.replace(/\n\s*\n\s*\n/g, '\n\n');
    content = content.replace(/^\s*\n+/, ''); // Remove leading empty lines
    content = content.replace(/\n+$/, ''); // Remove trailing empty lines
    content = content.trim();
    
    return content;
  }
}

// Export singleton instance
export const aiProcessor = new AIProcessor();
