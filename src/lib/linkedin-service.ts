export interface LinkedInPostData {
  text: string;
  hashtags?: string[];
  mediaUrls?: string[];
  link?: {
    url: string;
    title?: string;
    description?: string;
  };
}

export interface LinkedInPostResult {
  success: boolean;
  postId?: string;
  error?: string;
  response?: any;
}

export interface LinkedInProfile {
  id: string;
  firstName: string;
  lastName: string;
  headline: string;
  profilePictureUrl?: string;
  numConnections: number;
}

export interface LinkedInAnalytics {
  impressions: number;
  clicks: number;
  likes: number;
  comments: number;
  shares: number;
  engagementRate: number;
}

export class LinkedInService {
  private accessToken: string | null = null;
  private profileId: string | null = null;
  private apiBaseUrl = 'https://api.linkedin.com/v2';

  constructor() {
    // Initialize with stored token if available
    this.loadStoredCredentials();
  }

  // Load stored credentials from environment or storage
  private loadStoredCredentials(): void {
    this.accessToken = process.env.LINKEDIN_ACCESS_TOKEN || null;
    this.profileId = process.env.LINKEDIN_PROFILE_ID || null;
  }

  // Set access token (from OAuth flow)
  setAccessToken(token: string): void {
    this.accessToken = token;
    // Store token securely (implement based on your storage solution)
    this.storeCredentials();
  }

  // Store credentials securely
  private async storeCredentials(): Promise<void> {
    // Implement secure storage logic
    // This could be environment variables, encrypted database, etc.
    console.log('🔐 Storing LinkedIn credentials securely');
  }

  // Check if service is authenticated
  isAuthenticated(): boolean {
    return !!this.accessToken;
  }

  // Get user profile information
  async getProfile(): Promise<LinkedInProfile | null> {
    if (!this.accessToken) {
      throw new Error('LinkedIn access token not set');
    }

    try {
      // Updated LinkedIn API v2 endpoint for profile info
      const response = await fetch(`${this.apiBaseUrl}/userinfo`, {
        headers: {
          'Authorization': `Bearer ${this.accessToken}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        // Fallback to people endpoint if userinfo fails
        const fallbackResponse = await fetch(`${this.apiBaseUrl}/people/~:(id,localizedFirstName,localizedLastName,localizedHeadline,profilePicture(displayImage~:playableStreams))`, {
          headers: {
            'Authorization': `Bearer ${this.accessToken}`,
            'Content-Type': 'application/json',
            'X-Restli-Protocol-Version': '2.0.0'
          }
        });
        
        if (!fallbackResponse.ok) {
          throw new Error(`LinkedIn API error: ${response.status} ${response.statusText}`);
        }
        
        const fallbackData = await fallbackResponse.json();
        this.profileId = fallbackData.id;
        
        return {
          id: fallbackData.id,
          firstName: fallbackData.localizedFirstName || '',
          lastName: fallbackData.localizedLastName || '',
          headline: fallbackData.localizedHeadline || '',
          profilePictureUrl: this.extractProfilePictureUrl(fallbackData.profilePicture),
          numConnections: 0
        };
      }

      const data = await response.json();
      
      // Extract profile ID from sub field (LinkedIn userinfo format)
      this.profileId = data.sub || data.id;
      
      return {
        id: this.profileId || 'unknown',
        firstName: data.given_name || data.name?.split(' ')[0] || '',
        lastName: data.family_name || data.name?.split(' ').slice(1).join(' ') || '',
        headline: data.headline || '',
        profilePictureUrl: data.picture,
        numConnections: 0
      };
    } catch (error) {
      console.error('❌ Failed to get LinkedIn profile:', error);
      return null;
    }
  }

  // Extract profile picture URL from LinkedIn response
  private extractProfilePictureUrl(profilePicture: any): string | undefined {
    try {
      const streams = profilePicture?.displayImage?.['com.linkedin.common.VectorImage']?.rootUrl;
      const artifacts = profilePicture?.displayImage?.['com.linkedin.common.VectorImage']?.artifacts;
      
      if (streams && artifacts && artifacts.length > 0) {
        // Get the largest image
        const largestArtifact = artifacts.reduce((prev: any, current: any) => 
          (current.width > prev.width) ? current : prev
        );
        return `${streams}${largestArtifact.fileIdentifyingUrlPathSegment}`;
      }
    } catch (error) {
      console.error('Error extracting profile picture URL:', error);
    }
    return undefined;
  }

  // Publish a post to LinkedIn
  async publishPost(postData: LinkedInPostData): Promise<LinkedInPostResult> {
    if (!this.accessToken) {
      return {
        success: false,
        error: 'LinkedIn access token not set'
      };
    }

    if (!this.profileId) {
      const profile = await this.getProfile();
      if (!profile) {
        return {
          success: false,
          error: 'Failed to get LinkedIn profile'
        };
      }
    }

    try {
      // Prepare post content
      let content = postData.text;
      
      // Add hashtags if provided
      if (postData.hashtags && postData.hashtags.length > 0) {
        const hashtagString = postData.hashtags.map(tag => 
          tag.startsWith('#') ? tag : `#${tag}`
        ).join(' ');
        content += `\n\n${hashtagString}`;
      }

      // Prepare the post payload
      const postPayload: any = {
        author: `urn:li:person:${this.profileId}`,
        lifecycleState: 'PUBLISHED',
        specificContent: {
          'com.linkedin.ugc.ShareContent': {
            shareCommentary: {
              text: content
            },
            shareMediaCategory: 'NONE'
          }
        },
        visibility: {
          'com.linkedin.ugc.MemberNetworkVisibility': 'PUBLIC'
        }
      };

      // Add link if provided
      if (postData.link) {
        postPayload.specificContent['com.linkedin.ugc.ShareContent'].shareMediaCategory = 'ARTICLE';
        postPayload.specificContent['com.linkedin.ugc.ShareContent'].media = [{
          status: 'READY',
          description: {
            text: postData.link.description || ''
          },
          originalUrl: postData.link.url,
          title: {
            text: postData.link.title || ''
          }
        }];
      }

      // Make the API call
      const response = await fetch(`${this.apiBaseUrl}/ugcPosts`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.accessToken}`,
          'Content-Type': 'application/json',
          'X-Restli-Protocol-Version': '2.0.0'
        },
        body: JSON.stringify(postPayload)
      });

      if (!response.ok) {
        const errorData = await response.text();
        throw new Error(`LinkedIn API error: ${response.status} ${response.statusText} - ${errorData}`);
      }

      const responseData = await response.json();
      const postId = responseData.id;

      console.log(`✅ Successfully published LinkedIn post: ${postId}`);
      
      return {
        success: true,
        postId: postId,
        response: responseData
      };

    } catch (error) {
      console.error('❌ Failed to publish LinkedIn post:', error);
      
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      };
    }
  }

  // Get post analytics (if available)
  async getPostAnalytics(postId: string): Promise<LinkedInAnalytics | null> {
    if (!this.accessToken) {
      throw new Error('LinkedIn access token not set');
    }

    try {
      // Note: Analytics API requires additional permissions and may not be available for all applications
      const response = await fetch(`${this.apiBaseUrl}/socialMetadata/${postId}`, {
        headers: {
          'Authorization': `Bearer ${this.accessToken}`,
          'Content-Type': 'application/json',
          'X-Restli-Protocol-Version': '2.0.0'
        }
      });

      if (!response.ok) {
        throw new Error(`LinkedIn API error: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      
      return {
        impressions: data.impressions || 0,
        clicks: data.clicks || 0,
        likes: data.likes || 0,
        comments: data.comments || 0,
        shares: data.shares || 0,
        engagementRate: data.engagementRate || 0
      };
    } catch (error) {
      console.error('❌ Failed to get post analytics:', error);
      return null;
    }
  }

  // Get recent posts from user's feed
  async getRecentPosts(limit: number = 10): Promise<any[]> {
    if (!this.accessToken || !this.profileId) {
      throw new Error('LinkedIn authentication required');
    }

    try {
      const response = await fetch(`${this.apiBaseUrl}/ugcPosts?q=authors&authors=List(urn:li:person:${this.profileId})&count=${limit}`, {
        headers: {
          'Authorization': `Bearer ${this.accessToken}`,
          'Content-Type': 'application/json',
          'X-Restli-Protocol-Version': '2.0.0'
        }
      });

      if (!response.ok) {
        throw new Error(`LinkedIn API error: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      return data.elements || [];
    } catch (error) {
      console.error('❌ Failed to get recent posts:', error);
      return [];
    }
  }

  // Validate post content before publishing
  validatePostContent(postData: LinkedInPostData): {
    isValid: boolean;
    errors: string[];
    warnings: string[];
  } {
    const errors: string[] = [];
    const warnings: string[] = [];

    // Check text length (LinkedIn limit is 3000 characters)
    if (!postData.text || postData.text.trim().length === 0) {
      errors.push('Post text is required');
    } else if (postData.text.length > 3000) {
      errors.push('Post text exceeds 3000 character limit');
    } else if (postData.text.length > 2000) {
      warnings.push('Post text is quite long, consider shortening for better engagement');
    }

    // Check hashtags
    if (postData.hashtags && postData.hashtags.length > 30) {
      warnings.push('Too many hashtags (>30), consider reducing for better readability');
    }

    // Check for spam indicators
    const spamIndicators = [
      /buy now/gi,
      /click here/gi,
      /limited time/gi,
      /act fast/gi,
      /make money/gi
    ];

    const hasSpamContent = spamIndicators.some(pattern => pattern.test(postData.text));
    if (hasSpamContent) {
      warnings.push('Content contains potential spam indicators');
    }

    // Check for professional tone
    if (postData.text.includes('!!!') || postData.text.includes('???')) {
      warnings.push('Consider using more professional punctuation');
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings
    };
  }

  // Generate OAuth URL for authentication
  generateAuthUrl(clientId: string, redirectUri: string, state?: string): string {
    // Updated LinkedIn API v2 scopes
    const scopes = [
      'profile',           // Basic profile information
      'email',            // Email address
      'w_member_social'   // Share content on behalf of the user
    ];
    
    const params = new URLSearchParams({
      response_type: 'code',
      client_id: clientId,
      redirect_uri: redirectUri,
      scope: scopes.join(' '),
      state: state || Math.random().toString(36).substring(7)
    });

    return `https://www.linkedin.com/oauth/v2/authorization?${params.toString()}`;
  }

  // Exchange authorization code for access token
  async exchangeCodeForToken(
    code: string,
    clientId: string,
    clientSecret: string,
    redirectUri: string
  ): Promise<{ accessToken: string; expiresIn: number } | null> {
    try {
      const response = await fetch('https://www.linkedin.com/oauth/v2/accessToken', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
          grant_type: 'authorization_code',
          code: code,
          redirect_uri: redirectUri,
          client_id: clientId,
          client_secret: clientSecret
        })
      });

      if (!response.ok) {
        throw new Error(`Token exchange failed: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      
      this.setAccessToken(data.access_token);
      
      return {
        accessToken: data.access_token,
        expiresIn: data.expires_in
      };
    } catch (error) {
      console.error('❌ Failed to exchange code for token:', error);
      return null;
    }
  }

  // Get connection insights (if available)
  async getConnectionInsights(): Promise<{
    totalConnections: number;
    recentConnections: number;
    connectionGrowthRate: number;
  } | null> {
    const profile = await this.getProfile();
    if (!profile) return null;

    // This is a simplified version - full implementation would require additional API calls
    return {
      totalConnections: profile.numConnections,
      recentConnections: 0, // Would need historical data
      connectionGrowthRate: 0 // Would need historical data
    };
  }

  // Format post for preview
  formatPostPreview(postData: LinkedInPostData): string {
    let preview = postData.text;
    
    if (postData.hashtags && postData.hashtags.length > 0) {
      const hashtags = postData.hashtags.map(tag => 
        tag.startsWith('#') ? tag : `#${tag}`
      ).join(' ');
      preview += `\n\n${hashtags}`;
    }
    
    if (postData.link) {
      preview += `\n\n🔗 ${postData.link.url}`;
    }
    
    return preview;
  }
}

export default LinkedInService;