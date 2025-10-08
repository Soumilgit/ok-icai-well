import { Kafka, Producer, Consumer, KafkaMessage, logLevel } from 'kafkajs';

export interface KafkaEvent {
  type: string;
  data: any;
  userId?: string;
  timestamp?: number;
  metadata?: Record<string, any>;
}

export class KafkaService {
  private kafka: Kafka;
  private producer: Producer | null = null;
  private consumers: Map<string, Consumer> = new Map();
  private isConnected: boolean = false;

  constructor() {
    const brokers = (process.env.KAFKA_BROKERS || 'localhost:9092').split(',');
    const clientId = process.env.KAFKA_CLIENT_ID || 'accountant-ai';

    this.kafka = new Kafka({
      clientId,
      brokers,
      logLevel: logLevel.WARN, // Reduce kafka logs
      retry: {
        initialRetryTime: 1000,
        retries: 3,
      },
      connectionTimeout: 10000,
      requestTimeout: 30000,
      // SASL configuration if needed
      ...(process.env.KAFKA_USERNAME && {
        sasl: {
          mechanism: (process.env.KAFKA_SASL_MECHANISM as any) || 'plain',
          username: process.env.KAFKA_USERNAME,
          password: process.env.KAFKA_PASSWORD || '',
        },
      }),
    });

    this.setupProducer();
  }

  private async setupProducer(): Promise<void> {
    try {
      if (!process.env.ENABLE_KAFKA || process.env.ENABLE_KAFKA === 'false') {
        console.log('ℹ️ Kafka disabled via environment variable');
        return;
      }

      this.producer = this.kafka.producer({
        maxInFlightRequests: 1,
        idempotent: true,
        transactionTimeout: 30000,
      });

      await this.producer.connect();
      this.isConnected = true;
      console.log('✅ Kafka producer connected successfully');
    } catch (error) {
      console.error('❌ Failed to connect Kafka producer:', error);
      this.isConnected = false;
    }
  }

  async disconnect(): Promise<void> {
    try {
      if (this.producer) {
        await this.producer.disconnect();
      }

      for (const [groupId, consumer] of this.consumers) {
        await consumer.disconnect();
      }

      this.consumers.clear();
      this.isConnected = false;
      console.log('✅ Kafka disconnected successfully');
    } catch (error) {
      console.error('❌ Error disconnecting from Kafka:', error);
    }
  }

  // Event Publishing
  async publishEvent(topic: string, event: KafkaEvent): Promise<boolean> {
    try {
      if (!this.isConnected || !this.producer) {
        console.log('⚠️ Kafka not connected, event not published:', event.type);
        return false;
      }

      const message = {
        key: event.userId || event.type,
        value: JSON.stringify({
          ...event,
          timestamp: event.timestamp || Date.now(),
        }),
        headers: {
          eventType: event.type,
          source: 'accountant-ai',
        },
      };

      await this.producer.send({
        topic,
        messages: [message],
      });

      console.log(`📤 Event published to ${topic}:`, event.type);
      return true;
    } catch (error) {
      console.error(`❌ Failed to publish event to ${topic}:`, error);
      return false;
    }
  }

  // Batch publishing for better performance
  async publishEvents(topic: string, events: KafkaEvent[]): Promise<boolean> {
    try {
      if (!this.isConnected || !this.producer || events.length === 0) {
        return false;
      }

      const messages = events.map(event => ({
        key: event.userId || event.type,
        value: JSON.stringify({
          ...event,
          timestamp: event.timestamp || Date.now(),
        }),
        headers: {
          eventType: event.type,
          source: 'accountant-ai',
        },
      }));

      await this.producer.send({
        topic,
        messages,
      });

      console.log(`📤 Batch published ${events.length} events to ${topic}`);
      return true;
    } catch (error) {
      console.error(`❌ Failed to batch publish events to ${topic}:`, error);
      return false;
    }
  }

  // Consumer Management
  async createConsumer(
    groupId: string,
    topics: string[],
    handler: (event: KafkaEvent, message: KafkaMessage) => Promise<void>
  ): Promise<boolean> {
    try {
      if (!this.isConnected) {
        console.log('⚠️ Kafka not connected, consumer not created');
        return false;
      }

      const consumer = this.kafka.consumer({
        groupId: groupId || process.env.KAFKA_GROUP_ID || 'accountant-ai-consumers',
        sessionTimeout: 30000,
        heartbeatInterval: 3000,
      });

      await consumer.connect();
      await consumer.subscribe({ topics, fromBeginning: false });

      await consumer.run({
        eachMessage: async ({ topic, partition, message }) => {
          try {
            if (!message.value) return;

            const event: KafkaEvent = JSON.parse(message.value.toString());
            await handler(event, message);

            console.log(`📥 Processed event from ${topic}:`, event.type);
          } catch (error) {
            console.error(`❌ Error processing message from ${topic}:`, error);
          }
        },
      });

      this.consumers.set(groupId, consumer);
      console.log(`✅ Consumer created for topics: ${topics.join(', ')}`);
      return true;
    } catch (error) {
      console.error('❌ Failed to create consumer:', error);
      return false;
    }
  }

  // Health Check
  async healthCheck(): Promise<{ status: 'healthy' | 'unhealthy'; error?: string }> {
    try {
      if (!this.isConnected || !this.producer) {
        return { status: 'unhealthy', error: 'Not connected' };
      }

      // Try to get metadata to test connection
      const admin = this.kafka.admin();
      await admin.connect();
      await admin.listTopics();
      await admin.disconnect();

      return { status: 'healthy' };
    } catch (error) {
      return { status: 'unhealthy', error: error instanceof Error ? error.message : 'Unknown error' };
    }
  }

  get connected(): boolean {
    return this.isConnected;
  }
}

// Event Topics (centralized configuration)
export const KAFKA_TOPICS = {
  // User Events
  USER_ACTIVITY: 'user.activity',
  USER_AUTHENTICATION: 'user.authentication',
  
  // Content Events
  CONTENT_GENERATED: 'content.generated',
  CONTENT_SHARED: 'content.shared',
  CONTENT_ANALYTICS: 'content.analytics',
  
  // News Events
  NEWS_COLLECTED: 'news.collected',
  NEWS_PROCESSED: 'news.processed',
  NEWS_ANALYZED: 'news.analyzed',
  
  // Dashboard Events
  DASHBOARD_VIEWED: 'dashboard.viewed',
  DASHBOARD_INTERACTION: 'dashboard.interaction',
  
  // System Events
  SYSTEM_HEALTH: 'system.health',
  ERROR_TRACKING: 'system.errors',
  
  // Automation Events
  AUTOMATION_TRIGGERED: 'automation.triggered',
  AUTOMATION_COMPLETED: 'automation.completed',
} as const;

// Pre-defined event types
export const EVENT_TYPES = {
  // User events
  USER_LOGIN: 'user.login',
  USER_LOGOUT: 'user.logout',
  USER_SIGNUP: 'user.signup',
  
  // Content events
  LINKEDIN_POST_GENERATED: 'content.linkedin.generated',
  TWITTER_POST_GENERATED: 'content.twitter.generated',
  CONTENT_SHARED: 'content.shared',
  
  // News events
  NEWS_ARTICLES_FETCHED: 'news.articles.fetched',
  NEWS_SUMMARY_GENERATED: 'news.summary.generated',
  
  // Dashboard events
  DASHBOARD_LOADED: 'dashboard.loaded',
  TAB_SWITCHED: 'dashboard.tab.switched',
  
  // Automation events
  SOCIAL_MEDIA_POST_SCHEDULED: 'automation.social.scheduled',
  EMAIL_NOTIFICATION_SENT: 'automation.email.sent',
  
  // Error events
  API_ERROR: 'system.api.error',
  DATABASE_ERROR: 'system.database.error',
} as const;

// Singleton instance
export const kafkaService = new KafkaService();