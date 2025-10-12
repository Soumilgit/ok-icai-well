export interface LinkedInPost {
  id: string;
  content: string;
  hashtags: string[];
  scheduledFor?: Date;
  status: 'draft' | 'scheduled' | 'published' | 'failed';
  engagement?: {
    likes: number;
    comments: number;
    shares: number;
    views: number;
  };
  createdAt: Date;
  publishedAt?: Date;
}

export interface LinkedInProfile {
  id: string;
  name: string;
  headline: string;
  connections: number;
  followers: number;
  posts: number;
  engagementRate: number;
  lastActivity: Date;
  industry: string;
  location: string;
  mutualConnections: number;
  interactionScore: number; // Based on likes, comments, profile views
}

export interface ScheduleOptions {
  frequency: 'daily' | 'weekly' | 'bi-weekly' | 'custom';
  times: string[]; // Array of time strings like "09:00", "15:30"
  days: number[]; // 0-6 (Sunday-Saturday)
  timezone: string;
}

export interface AutomationSettings {
  enabled: boolean;
  scheduleOptions: ScheduleOptions;
  contentTypes: string[];
  topics: string[];
  autoHashtags: boolean;
  autoEngagement: boolean;
  complianceCheck: boolean;
}

export class LinkedInAutomationService {
  private baseUrl = process.env.LINKEDIN_API_URL || 'https://api.linkedin.com/v2';
  private accessToken: string | null = null;

  constructor() {
    this.accessToken = process.env.LINKEDIN_ACCESS_TOKEN || null;
  }

  // LinkedIn OAuth flow - SERVER-SIDE ONLY
  async initiateOAuth(): Promise<string> {
    // This method should only be called from server-side API routes
    // Make a request to our secure server-side endpoint
    try {
      const response = await fetch('/api/linkedin/auth', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      
      if (!response.ok) {
        throw new Error('Failed to initiate LinkedIn OAuth');
      }
      
      const data = await response.json();
      return data.authUrl;
    } catch (error) {
      console.error('Error initiating OAuth:', error);
      throw new Error('Failed to start LinkedIn authentication. Please check your configuration.');
    }
  }

  async exchangeCodeForToken(code: string): Promise<string> {
    const clientId = process.env.LINKEDIN_CLIENT_ID;
    const clientSecret = process.env.LINKEDIN_CLIENT_SECRET;
    const redirectUri = process.env.LINKEDIN_REDIRECT_URI;

    if (!clientId || clientId === 'your_linkedin_client_id_here') {
      throw new Error('LinkedIn Client ID is not configured.');
    }
    
    if (!clientSecret || clientSecret === 'your_linkedin_client_secret_here') {
      throw new Error('LinkedIn Client Secret is not configured.');
    }

    const response = await fetch('https://www.linkedin.com/oauth/v2/accessToken', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        grant_type: 'authorization_code',
        code,
        client_id: clientId!,
        client_secret: clientSecret!,
        redirect_uri: redirectUri!,
      }),
    });

    const data = await response.json();
    this.accessToken = data.access_token;
    return data.access_token;
  }

  // Post creation and publishing
  async createPost(content: string, hashtags: string[] = []): Promise<LinkedInPost> {
    const postContent = `${content}\n\n${hashtags.join(' ')}`;
    
    const post: LinkedInPost = {
      id: `post_${Date.now()}`,
      content: postContent,
      hashtags,
      status: 'draft',
      createdAt: new Date(),
    };

    // Store in local storage or database
    this.savePost(post);
    
    return post;
  }

  async publishPost(postId: string): Promise<boolean> {
    try {
      const post = await this.getPost(postId);
      if (!post) throw new Error('Post not found');

      if (!this.accessToken) {
        console.warn('LinkedIn access token not available. Post saved as draft.');
        return false;
      }

      const response = await fetch(`${this.baseUrl}/ugcPosts`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.accessToken}`,
          'Content-Type': 'application/json',
          'X-Restli-Protocol-Version': '2.0.0',
        },
        body: JSON.stringify({
          author: `urn:li:person:${await this.getCurrentUserId()}`,
          lifecycleState: 'PUBLISHED',
          specificContent: {
            'com.linkedin.ugc.ShareContent': {
              shareCommentary: {
                text: post.content,
              },
              shareMediaCategory: 'NONE',
            },
          },
          visibility: {
            'com.linkedin.ugc.MemberNetworkVisibility': 'PUBLIC',
          },
        }),
      });

      if (response.ok) {
        post.status = 'published';
        post.publishedAt = new Date();
        await this.updatePost(post);
        return true;
      } else {
        post.status = 'failed';
        await this.updatePost(post);
        console.error('Failed to publish post:', await response.text());
        return false;
      }
    } catch (error) {
      console.error('Error publishing post:', error);
      return false;
    }
  }

  async schedulePost(postId: string, scheduledFor: Date): Promise<boolean> {
    try {
      const post = await this.getPost(postId);
      if (!post) throw new Error('Post not found');

      post.scheduledFor = scheduledFor;
      post.status = 'scheduled';
      
      await this.updatePost(post);
      
      // Set up scheduling (in production, use a job queue)
      this.schedulePostForPublishing(postId, scheduledFor);
      
      return true;
    } catch (error) {
      console.error('Error scheduling post:', error);
      return false;
    }
  }

  private schedulePostForPublishing(postId: string, scheduledFor: Date) {
    const delay = scheduledFor.getTime() - Date.now();
    
    if (delay > 0) {
      setTimeout(async () => {
        await this.publishPost(postId);
      }, delay);
    }
  }

  // Automation features
  async setupAutomation(settings: AutomationSettings): Promise<boolean> {
    try {
      // Store automation settings
      localStorage.setItem('linkedin_automation_settings', JSON.stringify(settings));
      
      if (settings.enabled) {
        this.startAutomation(settings);
      }
      
      return true;
    } catch (error) {
      console.error('Error setting up automation:', error);
      return false;
    }
  }

  private startAutomation(settings: AutomationSettings) {
    // Set up recurring schedule based on settings
    if (settings.scheduleOptions.frequency === 'daily') {
      this.setupDailyAutomation(settings);
    } else if (settings.scheduleOptions.frequency === 'weekly') {
      this.setupWeeklyAutomation(settings);
    }
  }

  private setupDailyAutomation(settings: AutomationSettings) {
    settings.scheduleOptions.times.forEach(time => {
      const [hours, minutes] = time.split(':').map(Number);
      
      const scheduleDaily = () => {
        const now = new Date();
        const scheduledTime = new Date();
        scheduledTime.setHours(hours, minutes, 0, 0);
        
        if (scheduledTime <= now) {
          scheduledTime.setDate(scheduledTime.getDate() + 1);
        }
        
        const delay = scheduledTime.getTime() - now.getTime();
        
        setTimeout(async () => {
          await this.generateAndScheduleContent(settings);
          scheduleDaily(); // Reschedule for next day
        }, delay);
      };
      
      scheduleDaily();
    });
  }

  private setupWeeklyAutomation(settings: AutomationSettings) {
    settings.scheduleOptions.days.forEach(day => {
      settings.scheduleOptions.times.forEach(time => {
        const [hours, minutes] = time.split(':').map(Number);
        
        const scheduleWeekly = () => {
          const now = new Date();
          const scheduledTime = new Date();
          
          // Set to next occurrence of the specified day
          const daysUntilTarget = (day - now.getDay() + 7) % 7;
          scheduledTime.setDate(now.getDate() + daysUntilTarget);
          scheduledTime.setHours(hours, minutes, 0, 0);
          
          if (scheduledTime <= now) {
            scheduledTime.setDate(scheduledTime.getDate() + 7);
          }
          
          const delay = scheduledTime.getTime() - now.getTime();
          
          setTimeout(async () => {
            await this.generateAndScheduleContent(settings);
            scheduleWeekly(); // Reschedule for next week
          }, delay);
        };
        
        scheduleWeekly();
      });
    });
  }

  private async generateAndScheduleContent(settings: AutomationSettings) {
    try {
      // This would integrate with your content generator
      const topic = settings.topics[Math.floor(Math.random() * settings.topics.length)];
      const contentType = settings.contentTypes[Math.floor(Math.random() * settings.contentTypes.length)];
      
      // Generate content using your existing content generator
      // const content = await this.contentGenerator.generateContent({...});
      
      // For now, create a placeholder post
      const post = await this.createPost(`Automated post about ${topic}`, ['#CA', '#Accounting']);
      await this.publishPost(post.id);
    } catch (error) {
      console.error('Error in automated content generation:', error);
    }
  }

  // Network analysis for connection opportunities
  async analyzeNetworkOpportunities(): Promise<LinkedInProfile[]> {
    try {
      if (!this.accessToken) {
        return [];
      }

      // Get recent activity from connections
      const connections = await this.getConnectionActivity();
      
      // Score connections based on engagement
      const scoredProfiles = connections.map(profile => ({
        ...profile,
        interactionScore: this.calculateInteractionScore(profile)
      }));

      // Sort by interaction score and return top opportunities
      return scoredProfiles
        .sort((a, b) => b.interactionScore - a.interactionScore)
        .slice(0, 20);
        
    } catch (error) {
      console.error('Error analyzing network opportunities:', error);
      return [];
    }
  }

  private async getConnectionActivity(): Promise<LinkedInProfile[]> {
    // In production, this would make actual LinkedIn API calls
    // For now, return mock data
    return [
      {
        id: '1',
        name: 'John Smith',
        headline: 'Senior CA at Big Firm',
        connections: 500,
        followers: 1200,
        posts: 50,
        engagementRate: 3.5,
        lastActivity: new Date(),
        industry: 'Accounting',
        location: 'Mumbai',
        mutualConnections: 15,
        interactionScore: 0
      }
    ];
  }

  private calculateInteractionScore(profile: LinkedInProfile): number {
    let score = 0;
    
    // Recent activity weight
    const daysSinceActivity = (Date.now() - profile.lastActivity.getTime()) / (1000 * 60 * 60 * 24);
    score += Math.max(0, 10 - daysSinceActivity); // Max 10 points for recent activity
    
    // Engagement rate
    score += profile.engagementRate * 2;
    
    // Mutual connections
    score += Math.min(profile.mutualConnections, 20); // Max 20 points
    
    // Industry relevance
    if (profile.industry.toLowerCase().includes('account') || 
        profile.industry.toLowerCase().includes('finance') ||
        profile.industry.toLowerCase().includes('audit')) {
      score += 15;
    }
    
    return score;
  }

  // Post management
  async getPosts(): Promise<LinkedInPost[]> {
    const stored = localStorage.getItem('linkedin_posts');
    return stored ? JSON.parse(stored) : [];
  }

  async getPost(postId: string): Promise<LinkedInPost | null> {
    const posts = await this.getPosts();
    return posts.find(p => p.id === postId) || null;
  }

  private async savePost(post: LinkedInPost): Promise<void> {
    const posts = await this.getPosts();
    const existingIndex = posts.findIndex(p => p.id === post.id);
    
    if (existingIndex >= 0) {
      posts[existingIndex] = post;
    } else {
      posts.push(post);
    }
    
    localStorage.setItem('linkedin_posts', JSON.stringify(posts));
  }

  private async updatePost(post: LinkedInPost): Promise<void> {
    await this.savePost(post);
  }

  private async getCurrentUserId(): Promise<string> {
    if (!this.accessToken) throw new Error('No access token');
    
    const response = await fetch('https://api.linkedin.com/v2/people/~', {
      headers: {
        'Authorization': `Bearer ${this.accessToken}`,
      },
    });
    
    const data = await response.json();
    return data.id;
  }

  // Analytics
  async getPostAnalytics(postId: string): Promise<any> {
    if (!this.accessToken) return null;
    
    try {
      const response = await fetch(`${this.baseUrl}/shares/${postId}`, {
        headers: {
          'Authorization': `Bearer ${this.accessToken}`,
        },
      });
      
      return await response.json();
    } catch (error) {
      console.error('Error fetching post analytics:', error);
      return null;
    }
  }

  async getBulkAnalytics(startDate: Date, endDate: Date): Promise<any> {
    // Fetch analytics for all posts in date range
    const posts = await this.getPosts();
    const filteredPosts = posts.filter(post => 
      post.publishedAt && 
      post.publishedAt >= startDate && 
      post.publishedAt <= endDate
    );

    const analytics = await Promise.all(
      filteredPosts.map(post => this.getPostAnalytics(post.id))
    );

    return {
      totalPosts: filteredPosts.length,
      totalEngagement: analytics.reduce((sum, a) => sum + (a?.engagement || 0), 0),
      averageEngagement: analytics.length > 0 ? 
        analytics.reduce((sum, a) => sum + (a?.engagement || 0), 0) / analytics.length : 0,
      posts: filteredPosts.map((post, index) => ({
        ...post,
        analytics: analytics[index]
      }))
    };
  }
}