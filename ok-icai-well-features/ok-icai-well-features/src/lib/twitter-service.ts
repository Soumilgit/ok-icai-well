import { ICAIComplianceChecker, ComplianceResult } from './icai-guidelines';

export interface TwitterPostRequest {
  content: string;
  images?: string[];
  scheduledFor?: string;
  checkCompliance?: boolean;
}

export interface TwitterPostResponse {
  success: boolean;
  postId?: string;
  compliance?: ComplianceResult;
  error?: string;
  suggestions?: string[];
}

export interface TwitterCredentials {
  apiKey: string;
  apiSecret: string;
  accessToken: string;
  accessTokenSecret: string;
  bearerToken: string;
}

export class TwitterService {
  private credentials: TwitterCredentials;

  constructor(credentials: TwitterCredentials) {
    this.credentials = credentials;
  }

  async createPost(request: TwitterPostRequest): Promise<TwitterPostResponse> {
    try {
      // First, check ICAI compliance
      let compliance: ComplianceResult | undefined;
      if (request.checkCompliance !== false) {
        compliance = ICAIComplianceChecker.checkContent(request.content);
        
        if (!compliance.isCompliant && compliance.violations.some(v => v.guideline.severity === 'critical')) {
          return {
            success: false,
            compliance,
            error: 'Post violates critical ICAI guidelines and cannot be published',
            suggestions: ICAIComplianceChecker.generateComplianceSuggestions(request.content)
          };
        }
      }

      // Check character limit (280 for Twitter)
      if (request.content.length > 280) {
        return {
          success: false,
          error: 'Post exceeds Twitter character limit (280 characters)',
          suggestions: ['Consider splitting into a thread', 'Shorten the content', 'Move detailed content to a linked article']
        };
      }

      // For demo purposes, simulate Twitter API call
      // In production, you would use the Twitter API v2
      const postId = this.generateMockPostId();
      
      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 1000));

      // Log the post attempt (in production, this would be the actual API call)
      console.log('Twitter Post Created:', {
        postId,
        content: request.content,
        compliance: compliance?.score,
        timestamp: new Date().toISOString()
      });

      return {
        success: true,
        postId,
        compliance,
        suggestions: compliance?.isCompliant ? undefined : ICAIComplianceChecker.generateComplianceSuggestions(request.content)
      };

    } catch (error) {
      console.error('Twitter posting error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      };
    }
  }

  async schedulePost(request: TwitterPostRequest): Promise<TwitterPostResponse> {
    if (!request.scheduledFor) {
      return {
        success: false,
        error: 'Scheduled time is required for scheduled posts'
      };
    }

    // Add scheduling logic here
    const scheduledTime = new Date(request.scheduledFor);
    const now = new Date();

    if (scheduledTime <= now) {
      return {
        success: false,
        error: 'Scheduled time must be in the future'
      };
    }

    // For now, just validate and return success
    const compliance = ICAIComplianceChecker.checkContent(request.content);
    
    return {
      success: true,
      postId: `scheduled_${this.generateMockPostId()}`,
      compliance,
      suggestions: compliance.isCompliant ? undefined : ICAIComplianceChecker.generateComplianceSuggestions(request.content)
    };
  }

  private generateMockPostId(): string {
    return `tw_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  // Helper method to format content for Twitter
  static formatForTwitter(content: string): string {
    // Add relevant hashtags for CA content
    const caHashtags = ['#CharterAccountant', '#ICAI', '#TaxTips', '#Accounting'];
    let formatted = content;

    // Ensure content ends with appropriate hashtags if there's space
    const availableSpace = 280 - content.length;
    if (availableSpace > 20) {
      const hashtagsToAdd = caHashtags.slice(0, Math.floor(availableSpace / 15));
      formatted += '\n\n' + hashtagsToAdd.join(' ');
    }

    return formatted;
  }

  // Method to convert long content into Twitter thread
  static createThread(content: string): string[] {
    const maxLength = 250; // Leave room for thread indicators
    const sentences = content.split(/[.!?]+/).filter(s => s.trim().length > 0);
    const thread: string[] = [];
    let currentTweet = '';

    sentences.forEach((sentence, index) => {
      const trimmedSentence = sentence.trim() + '.';
      
      if ((currentTweet + ' ' + trimmedSentence).length <= maxLength) {
        currentTweet += (currentTweet ? ' ' : '') + trimmedSentence;
      } else {
        if (currentTweet) {
          thread.push(currentTweet);
        }
        currentTweet = trimmedSentence;
      }
    });

    if (currentTweet) {
      thread.push(currentTweet);
    }

    // Add thread indicators
    return thread.map((tweet, index) => {
      if (thread.length > 1) {
        return `${index + 1}/${thread.length} ${tweet}`;
      }
      return tweet;
    });
  }
}