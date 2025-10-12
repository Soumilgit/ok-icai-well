import { GeneratedPost, ContentPipelineConfig } from './content-pipeline-simple';
import { LinkedInService } from './linkedin-service';

export interface ScheduledPost {
  id: string;
  postId: string;
  scheduledFor: Date;
  status: 'scheduled' | 'posted' | 'failed' | 'cancelled';
  attempts: number;
  lastAttempt?: Date;
  error?: string;
  createdAt: Date;
  postedAt?: Date;
}

export interface SchedulingRule {
  id: string;
  name: string;
  enabled: boolean;
  frequency: 'daily' | 'twice_daily' | 'custom';
  customIntervalHours?: number;
  preferredTimes: string[]; // ["09:00", "14:00"]
  daysOfWeek: number[]; // [1,2,3,4,5] for weekdays
  maxPostsPerDay: number;
  categories: string[];
  autoApproveThreshold?: number;
  createdAt: Date;
  updatedAt: Date;
}

export class ContentSchedulingSystem {
  private linkedInService: LinkedInService;
  private scheduledPosts: Map<string, ScheduledPost> = new Map();
  private schedulingRules: Map<string, SchedulingRule> = new Map();
  private schedulingInterval?: NodeJS.Timeout;

  constructor() {
    this.linkedInService = new LinkedInService();
    this.initializeDefaultRules();
    this.startScheduler();
  }

  // Initialize default scheduling rules
  private initializeDefaultRules(): void {
    const defaultRule: SchedulingRule = {
      id: 'default_ca_posting',
      name: 'Default CA Content Schedule',
      enabled: true,
      frequency: 'daily',
      preferredTimes: ['09:00', '13:00', '17:00'],
      daysOfWeek: [1, 2, 3, 4, 5], // Monday to Friday
      maxPostsPerDay: 2,
      categories: ['finance', 'accounting', 'tax', 'business'],
      autoApproveThreshold: 0.8,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    this.schedulingRules.set(defaultRule.id, defaultRule);
  }

  // Schedule a post for publication
  async schedulePost(post: GeneratedPost, scheduledFor: Date): Promise<ScheduledPost> {
    const scheduledPost: ScheduledPost = {
      id: `schedule_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      postId: post.id,
      scheduledFor: scheduledFor,
      status: 'scheduled',
      attempts: 0,
      createdAt: new Date()
    };

    this.scheduledPosts.set(scheduledPost.id, scheduledPost);
    
    // Save to database (you'd implement this based on your storage solution)
    await this.saveScheduledPost(scheduledPost);
    
    console.log(`📅 Scheduled post ${post.id} for ${scheduledFor.toISOString()}`);
    return scheduledPost;
  }

  // Auto-schedule posts based on rules
  async autoSchedulePosts(posts: GeneratedPost[], ruleId: string = 'default_ca_posting'): Promise<ScheduledPost[]> {
    const rule = this.schedulingRules.get(ruleId);
    if (!rule || !rule.enabled) {
      throw new Error(`Scheduling rule ${ruleId} not found or disabled`);
    }

    const scheduledPosts: ScheduledPost[] = [];
    const now = new Date();
    
    // Filter posts that match the rule criteria
    const eligiblePosts = posts.filter(post => 
      rule.categories.includes(post.trendData.category) &&
      (post.status === 'approved' || 
       (rule.autoApproveThreshold && post.trendData.relevanceScore >= rule.autoApproveThreshold))
    );

    // Calculate next posting slots
    const nextSlots = this.calculateNextPostingSlots(rule, eligiblePosts.length);
    
    for (let i = 0; i < Math.min(eligiblePosts.length, nextSlots.length); i++) {
      const post = eligiblePosts[i];
      const scheduledFor = nextSlots[i];
      
      // Update post status to approved if auto-approved
      if (post.status !== 'approved' && rule.autoApproveThreshold && 
          post.trendData.relevanceScore >= rule.autoApproveThreshold) {
        post.status = 'approved';
        post.scheduledFor = scheduledFor;
      }

      const scheduledPost = await this.schedulePost(post, scheduledFor);
      scheduledPosts.push(scheduledPost);
    }

    return scheduledPosts;
  }

  // Calculate next available posting slots based on rule
  private calculateNextPostingSlots(rule: SchedulingRule, count: number): Date[] {
    const slots: Date[] = [];
    const now = new Date();
    let currentDate = new Date(now);
    
    // Start from next day if we're past business hours
    if (now.getHours() >= 18) {
      currentDate.setDate(currentDate.getDate() + 1);
    }
    
    while (slots.length < count) {
      // Check if this day is in allowed days of week
      if (rule.daysOfWeek.includes(currentDate.getDay())) {
        // Add posting slots for this day
        const dailySlots = this.getDailyPostingSlots(currentDate, rule);
        const availableSlots = dailySlots.filter(slot => {
          // Don't schedule for past times
          return slot > now && !this.isSlotTaken(slot);
        });
        
        slots.push(...availableSlots.slice(0, rule.maxPostsPerDay));
      }
      
      // Move to next day
      currentDate.setDate(currentDate.getDate() + 1);
      
      // Safety break to avoid infinite loop
      if (currentDate.getTime() > now.getTime() + (30 * 24 * 60 * 60 * 1000)) {
        break;
      }
    }
    
    return slots.slice(0, count);
  }

  // Get posting slots for a specific day
  private getDailyPostingSlots(date: Date, rule: SchedulingRule): Date[] {
    const slots: Date[] = [];
    
    for (const timeStr of rule.preferredTimes) {
      const [hours, minutes] = timeStr.split(':').map(Number);
      const slot = new Date(date);
      slot.setHours(hours, minutes, 0, 0);
      slots.push(slot);
    }
    
    return slots;
  }

  // Check if a time slot is already taken
  private isSlotTaken(slot: Date): boolean {
    const slotTime = slot.getTime();
    const tolerance = 30 * 60 * 1000; // 30 minutes tolerance
    
    for (const scheduledPost of this.scheduledPosts.values()) {
      if (scheduledPost.status === 'scheduled') {
        const scheduledTime = scheduledPost.scheduledFor.getTime();
        if (Math.abs(scheduledTime - slotTime) < tolerance) {
          return true;
        }
      }
    }
    
    return false;
  }

  // Start the scheduler that checks for posts to publish
  private startScheduler(): void {
    // Check every minute for posts to publish
    this.schedulingInterval = setInterval(async () => {
      await this.checkAndPublishPosts();
    }, 60 * 1000);
    
    console.log('📊 Content scheduler started');
  }

  // Stop the scheduler
  stopScheduler(): void {
    if (this.schedulingInterval) {
      clearInterval(this.schedulingInterval);
      this.schedulingInterval = undefined;
    }
    console.log('🛑 Content scheduler stopped');
  }

  // Check for posts that need to be published
  private async checkAndPublishPosts(): Promise<void> {
    const now = new Date();
    const postsToPublish = Array.from(this.scheduledPosts.values())
      .filter(scheduledPost => 
        scheduledPost.status === 'scheduled' && 
        scheduledPost.scheduledFor <= now
      );

    for (const scheduledPost of postsToPublish) {
      await this.attemptToPublishPost(scheduledPost);
    }
  }

  // Attempt to publish a scheduled post
  private async attemptToPublishPost(scheduledPost: ScheduledPost): Promise<void> {
    try {
      scheduledPost.attempts++;
      scheduledPost.lastAttempt = new Date();
      
      // Get the post content (you'd fetch this from your storage)
      const post = await this.getPostById(scheduledPost.postId);
      if (!post) {
        throw new Error('Post not found');
      }

      // Publish to LinkedIn
      const result = await this.linkedInService.publishPost({
        text: post.content,
        hashtags: post.hashtags
      });

      if (result.success) {
        scheduledPost.status = 'posted';
        scheduledPost.postedAt = new Date();
        
        // Update post status
        post.status = 'published';
        post.publishedAt = new Date();
        
        console.log(`✅ Successfully published post ${scheduledPost.postId}`);
      } else {
        throw new Error(result.error || 'Failed to publish');
      }
      
    } catch (error) {
      console.error(`❌ Failed to publish post ${scheduledPost.postId}:`, error);
      
      scheduledPost.error = error instanceof Error ? error.message : 'Unknown error';
      
      // Retry logic
      if (scheduledPost.attempts < 3) {
        // Reschedule for 15 minutes later
        scheduledPost.scheduledFor = new Date(Date.now() + 15 * 60 * 1000);
        console.log(`🔄 Retrying post ${scheduledPost.postId} in 15 minutes (attempt ${scheduledPost.attempts + 1}/3)`);
      } else {
        scheduledPost.status = 'failed';
        console.log(`💥 Post ${scheduledPost.postId} failed after 3 attempts`);
      }
    }
    
    // Update in storage
    await this.updateScheduledPost(scheduledPost);
  }

  // Get upcoming scheduled posts
  getUpcomingPosts(limit: number = 10): ScheduledPost[] {
    return Array.from(this.scheduledPosts.values())
      .filter(post => post.status === 'scheduled')
      .sort((a, b) => a.scheduledFor.getTime() - b.scheduledFor.getTime())
      .slice(0, limit);
  }

  // Cancel a scheduled post
  async cancelScheduledPost(scheduledPostId: string): Promise<boolean> {
    const scheduledPost = this.scheduledPosts.get(scheduledPostId);
    if (!scheduledPost) {
      return false;
    }

    if (scheduledPost.status === 'scheduled') {
      scheduledPost.status = 'cancelled';
      await this.updateScheduledPost(scheduledPost);
      console.log(`🚫 Cancelled scheduled post ${scheduledPostId}`);
      return true;
    }

    return false;
  }

  // Reschedule a post
  async reschedulePost(scheduledPostId: string, newTime: Date): Promise<boolean> {
    const scheduledPost = this.scheduledPosts.get(scheduledPostId);
    if (!scheduledPost || scheduledPost.status !== 'scheduled') {
      return false;
    }

    scheduledPost.scheduledFor = newTime;
    await this.updateScheduledPost(scheduledPost);
    
    console.log(`📅 Rescheduled post ${scheduledPostId} to ${newTime.toISOString()}`);
    return true;
  }

  // Publish a post immediately (for immediate posting feature)
  async publishPost(scheduledPost: ScheduledPost): Promise<{ success: boolean; error?: string; linkedinPostId?: string }> {
    try {
      console.log(`🚀 Publishing post immediately: ${scheduledPost.postId}`);
      
      // Get the post content
      const post = await this.getPostById(scheduledPost.postId);
      if (!post) {
        return { success: false, error: 'Post not found' };
      }

      // Publish to LinkedIn
      const result = await this.linkedInService.publishPost({
        text: post.content,
        hashtags: post.hashtags
      });

      if (result.success) {
        console.log(`✅ Successfully published post ${scheduledPost.postId} immediately`);
        return { 
          success: true, 
          linkedinPostId: result.postId 
        };
      } else {
        console.error(`❌ Failed to publish post ${scheduledPost.postId}:`, result.error);
        return { 
          success: false, 
          error: result.error || 'Failed to publish to LinkedIn' 
        };
      }
      
    } catch (error) {
      console.error(`💥 Error publishing post ${scheduledPost.postId}:`, error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      };
    }
  }

  // Add or update scheduling rule
  async updateSchedulingRule(rule: SchedulingRule): Promise<void> {
    rule.updatedAt = new Date();
    this.schedulingRules.set(rule.id, rule);
    await this.saveSchedulingRule(rule);
  }

  // Get all scheduling rules
  getSchedulingRules(): SchedulingRule[] {
    return Array.from(this.schedulingRules.values());
  }

  // Get posting statistics
  async getPostingStatistics(days: number = 30): Promise<{
    totalScheduled: number;
    totalPosted: number;
    totalFailed: number;
    successRate: number;
    averagePostsPerDay: number;
    peakPostingHours: string[];
  }> {
    const cutoffDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
    const recentPosts = Array.from(this.scheduledPosts.values())
      .filter(post => post.createdAt >= cutoffDate);

    const totalScheduled = recentPosts.length;
    const totalPosted = recentPosts.filter(post => post.status === 'posted').length;
    const totalFailed = recentPosts.filter(post => post.status === 'failed').length;
    const successRate = totalScheduled > 0 ? (totalPosted / totalScheduled) * 100 : 0;
    const averagePostsPerDay = totalScheduled / days;

    // Calculate peak posting hours
    const hourCounts: { [hour: number]: number } = {};
    recentPosts.forEach(post => {
      if (post.postedAt) {
        const hour = post.postedAt.getHours();
        hourCounts[hour] = (hourCounts[hour] || 0) + 1;
      }
    });

    const peakPostingHours = Object.entries(hourCounts)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 3)
      .map(([hour]) => `${hour.padStart(2, '0')}:00`);

    return {
      totalScheduled,
      totalPosted,
      totalFailed,
      successRate: Math.round(successRate * 100) / 100,
      averagePostsPerDay: Math.round(averagePostsPerDay * 100) / 100,
      peakPostingHours
    };
  }

  // Placeholder methods for data persistence (implement based on your storage solution)
  private async saveScheduledPost(scheduledPost: ScheduledPost): Promise<void> {
    // Implement database save logic
    console.log(`💾 Saving scheduled post ${scheduledPost.id}`);
  }

  private async updateScheduledPost(scheduledPost: ScheduledPost): Promise<void> {
    // Implement database update logic
    console.log(`🔄 Updating scheduled post ${scheduledPost.id}`);
  }

  private async getPostById(postId: string): Promise<GeneratedPost | null> {
    // Implement database fetch logic
    // For now, return a mock post
    return null;
  }

  private async saveSchedulingRule(rule: SchedulingRule): Promise<void> {
    // Implement database save logic
    console.log(`💾 Saving scheduling rule ${rule.id}`);
  }

  // Optimal time analysis
  async analyzeOptimalPostingTimes(historicalData?: ScheduledPost[]): Promise<{
    recommendedTimes: string[];
    dayOfWeekPerformance: { [day: number]: number };
    hourlyPerformance: { [hour: number]: number };
  }> {
    const data = historicalData || Array.from(this.scheduledPosts.values());
    const postedPosts = data.filter(post => post.status === 'posted' && post.postedAt);
    
    if (postedPosts.length < 10) {
      return {
        recommendedTimes: ['09:00', '13:00', '17:00'],
        dayOfWeekPerformance: {},
        hourlyPerformance: {}
      };
    }

    const dayOfWeekCounts: { [day: number]: number } = {};
    const hourlyCounts: { [hour: number]: number } = {};
    
    postedPosts.forEach(post => {
      if (post.postedAt) {
        const day = post.postedAt.getDay();
        const hour = post.postedAt.getHours();
        
        dayOfWeekCounts[day] = (dayOfWeekCounts[day] || 0) + 1;
        hourlyCounts[hour] = (hourlyCounts[hour] || 0) + 1;
      }
    });

    // Find top 3 performing hours
    const recommendedTimes = Object.entries(hourlyCounts)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 3)
      .map(([hour]) => `${hour.padStart(2, '0')}:00`);

    return {
      recommendedTimes,
      dayOfWeekPerformance: dayOfWeekCounts,
      hourlyPerformance: hourlyCounts
    };
  }
}

export default ContentSchedulingSystem;