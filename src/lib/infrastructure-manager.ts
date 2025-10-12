import { redisService } from './redis-service';
import { kafkaService, KafkaEvent, KAFKA_TOPICS, EVENT_TYPES } from './kafka-service';

export interface InfrastructureHealth {
  redis: {
    status: 'healthy' | 'unhealthy' | 'disabled';
    connected: boolean;
    latency?: number;
    error?: string;
  };
  kafka: {
    status: 'healthy' | 'unhealthy' | 'disabled';
    connected: boolean;
    error?: string;
  };
  overall: 'healthy' | 'degraded' | 'unhealthy';
}

export class InfrastructureManager {
  private static instance: InfrastructureManager;
  private initialized: boolean = false;
  private healthCheckInterval: NodeJS.Timeout | null = null;

  private constructor() {}

  static getInstance(): InfrastructureManager {
    if (!InfrastructureManager.instance) {
      InfrastructureManager.instance = new InfrastructureManager();
    }
    return InfrastructureManager.instance;
  }

  async initialize(): Promise<void> {
    if (this.initialized) return;

    console.log('🚀 Initializing infrastructure services...');

    // Initialize Redis
    if (process.env.ENABLE_REDIS !== 'false') {
      try {
        const redisConnected = await redisService.connect();
        if (redisConnected) {
          console.log('✅ Redis service initialized');
        } else {
          console.log('⚠️ Redis service failed to initialize - fallback mode enabled');
        }
      } catch (error) {
        console.error('❌ Redis initialization error:', error);
      }
    }

    // Initialize Kafka consumers
    if (process.env.ENABLE_KAFKA !== 'false') {
      try {
        await this.setupKafkaConsumers();
        console.log('✅ Kafka service initialized');
      } catch (error) {
        console.error('❌ Kafka initialization error:', error);
      }
    }

    // Start health monitoring
    this.startHealthMonitoring();

    this.initialized = true;
    console.log('🎉 Infrastructure services initialized successfully');
  }

  private async setupKafkaConsumers(): Promise<void> {
    // User Activity Consumer
    await kafkaService.createConsumer(
      'user-activity-consumer',
      [KAFKA_TOPICS.USER_ACTIVITY, KAFKA_TOPICS.USER_AUTHENTICATION],
      async (event: KafkaEvent) => {
        await this.handleUserEvent(event);
      }
    );

    // Content Processing Consumer
    await kafkaService.createConsumer(
      'content-processing-consumer',
      [KAFKA_TOPICS.CONTENT_GENERATED, KAFKA_TOPICS.CONTENT_ANALYTICS],
      async (event: KafkaEvent) => {
        await this.handleContentEvent(event);
      }
    );

    // News Processing Consumer
    await kafkaService.createConsumer(
      'news-processing-consumer',
      [KAFKA_TOPICS.NEWS_COLLECTED, KAFKA_TOPICS.NEWS_PROCESSED],
      async (event: KafkaEvent) => {
        await this.handleNewsEvent(event);
      }
    );

    // Error Tracking Consumer
    await kafkaService.createConsumer(
      'error-tracking-consumer',
      [KAFKA_TOPICS.ERROR_TRACKING],
      async (event: KafkaEvent) => {
        await this.handleErrorEvent(event);
      }
    );
  }

  // Event Handlers
  private async handleUserEvent(event: KafkaEvent): Promise<void> {
    try {
      switch (event.type) {
        case EVENT_TYPES.USER_LOGIN:
          await this.trackUserLogin(event);
          break;
        case EVENT_TYPES.DASHBOARD_LOADED:
          await this.trackDashboardView(event);
          break;
        default:
          console.log('📊 User event tracked:', event.type);
      }
    } catch (error) {
      console.error('Error handling user event:', error);
    }
  }

  private async handleContentEvent(event: KafkaEvent): Promise<void> {
    try {
      switch (event.type) {
        case EVENT_TYPES.LINKEDIN_POST_GENERATED:
        case EVENT_TYPES.TWITTER_POST_GENERATED:
          await this.trackContentGeneration(event);
          break;
        case EVENT_TYPES.CONTENT_SHARED:
          await this.trackContentSharing(event);
          break;
        default:
          console.log('📝 Content event tracked:', event.type);
      }
    } catch (error) {
      console.error('Error handling content event:', error);
    }
  }

  private async handleNewsEvent(event: KafkaEvent): Promise<void> {
    try {
      switch (event.type) {
        case EVENT_TYPES.NEWS_ARTICLES_FETCHED:
          await this.invalidateNewsCache();
          break;
        default:
          console.log('📰 News event tracked:', event.type);
      }
    } catch (error) {
      console.error('Error handling news event:', error);
    }
  }

  private async handleErrorEvent(event: KafkaEvent): Promise<void> {
    try {
      console.error('🚨 System error tracked:', event);
      // Could integrate with error tracking service here
    } catch (error) {
      console.error('Error handling error event:', error);
    }
  }

  // Utility Methods
  private async trackUserLogin(event: KafkaEvent): Promise<void> {
    if (redisService.connected && event.userId) {
      await redisService.increment(`user:login:daily:${new Date().toISOString().split('T')[0]}`);
      await redisService.increment(`user:login:total`);
      await redisService.set(`user:last_login:${event.userId}`, Date.now(), { ttl: 86400 * 30 });
    }
  }

  private async trackDashboardView(event: KafkaEvent): Promise<void> {
    if (redisService.connected && event.userId) {
      await redisService.increment(`dashboard:views:daily:${new Date().toISOString().split('T')[0]}`);
      await redisService.set(`user:last_dashboard_view:${event.userId}`, Date.now(), { ttl: 86400 });
    }
  }

  private async trackContentGeneration(event: KafkaEvent): Promise<void> {
    if (redisService.connected) {
      const today = new Date().toISOString().split('T')[0];
      await redisService.increment(`content:generated:daily:${today}`);
      await redisService.increment(`content:generated:${event.data.platform}:daily:${today}`);
    }
  }

  private async trackContentSharing(event: KafkaEvent): Promise<void> {
    if (redisService.connected) {
      const today = new Date().toISOString().split('T')[0];
      await redisService.increment(`content:shared:daily:${today}`);
      await redisService.increment(`content:shared:${event.data.platform}:daily:${today}`);
    }
  }

  private async invalidateNewsCache(): Promise<void> {
    if (redisService.connected) {
      await redisService.del('news:latest');
      console.log('🗑️ News cache invalidated');
    }
  }

  // Health Monitoring
  private startHealthMonitoring(): void {
    // Check health every 30 seconds
    this.healthCheckInterval = setInterval(async () => {
      const health = await this.getHealth();
      if (health.overall !== 'healthy') {
        console.warn('⚠️ Infrastructure health degraded:', health);
      }
    }, 30000);
  }

  async getHealth(): Promise<InfrastructureHealth> {
    const redisHealth = await redisService.healthCheck();
    const kafkaHealth = await kafkaService.healthCheck();

    const redis = {
      status: !process.env.ENABLE_REDIS || process.env.ENABLE_REDIS === 'false' 
        ? 'disabled' as const
        : redisHealth.status,
      connected: redisService.connected,
      latency: redisHealth.latency,
      error: redisHealth.error,
    };

    const kafka = {
      status: !process.env.ENABLE_KAFKA || process.env.ENABLE_KAFKA === 'false' 
        ? 'disabled' as const
        : kafkaHealth.status,
      connected: kafkaService.connected,
      error: kafkaHealth.error,
    };

    // Determine overall health
    let overall: 'healthy' | 'degraded' | 'unhealthy';
    
    if (redis.status === 'healthy' && kafka.status === 'healthy') {
      overall = 'healthy';
    } else if (redis.status === 'disabled' && kafka.status === 'disabled') {
      overall = 'healthy'; // Both disabled is fine
    } else if (
      (redis.status === 'healthy' || redis.status === 'disabled') &&
      (kafka.status === 'healthy' || kafka.status === 'disabled')
    ) {
      overall = 'healthy';
    } else if (redis.status === 'unhealthy' && kafka.status === 'unhealthy') {
      overall = 'unhealthy';
    } else {
      overall = 'degraded';
    }

    return { redis, kafka, overall };
  }

  // Public API Methods
  async publishEvent(topic: string, event: KafkaEvent): Promise<boolean> {
    return await kafkaService.publishEvent(topic, event);
  }

  async cacheData(key: string, data: any, ttl?: number): Promise<boolean> {
    return await redisService.set(key, data, { ttl });
  }

  async getCachedData<T>(key: string): Promise<T | null> {
    return await redisService.get<T>(key);
  }

  async invalidateCache(key: string): Promise<boolean> {
    return await redisService.del(key);
  }

  async rateLimitCheck(key: string, limit: number, windowSeconds: number) {
    return await redisService.rateLimit(key, limit, windowSeconds);
  }

  async shutdown(): Promise<void> {
    console.log('🛑 Shutting down infrastructure services...');
    
    if (this.healthCheckInterval) {
      clearInterval(this.healthCheckInterval);
    }

    await Promise.all([
      redisService.disconnect(),
      kafkaService.disconnect(),
    ]);

    this.initialized = false;
    console.log('✅ Infrastructure services shut down successfully');
  }

  get isInitialized(): boolean {
    return this.initialized;
  }
}

// Singleton instance
export const infrastructureManager = InfrastructureManager.getInstance();