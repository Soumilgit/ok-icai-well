import { Kafka, Producer, Consumer, KafkaMessage, logLevel, CompressionTypes } from 'kafkajs';

export interface KafkaEvent {
  type: string;
  data: any;
  timestamp?: number;
  metadata?: Record<string, any>;
  userId?: string;
  sessionId?: string;
  requestId?: string;
}

export interface KafkaConfig {
  brokers: string[];
  clientId: string;
  groupId?: string;
  compression?: CompressionTypes;
  batchSize?: number;
  lingerMs?: number;
  maxInFlightRequests?: number;
  retries?: number;
  timeout?: number;
}

export class KafkaClusterService {
  private kafka: Kafka;
  private producer: Producer | null = null;
  private consumers: Map<string, Consumer> = new Map();
  private isConnected: boolean = false;
  private config: KafkaConfig;

  // Performance tracking
  private metrics = {
    messagesProduced: 0,
    messagesConsumed: 0,
    errors: 0,
    lastError: null as Error | null,
    avgProduceLatency: 0,
    avgConsumeLatency: 0
  };

  constructor() {
    this.config = this.getKafkaConfig();
    this.kafka = this.initializeKafka();
  }

  private getKafkaConfig(): KafkaConfig {
    const brokers = (process.env.KAFKA_BROKERS || 'localhost:9092').split(',');
    
    return {
      brokers,
      clientId: process.env.KAFKA_CLIENT_ID || 'accountant-ai-cluster',
      groupId: process.env.KAFKA_GROUP_ID || 'accountant-ai-consumers',
      compression: CompressionTypes.GZIP,
      batchSize: parseInt(process.env.KAFKA_BATCH_SIZE || '16384'),
      lingerMs: parseInt(process.env.KAFKA_LINGER_MS || '10'),
      maxInFlightRequests: parseInt(process.env.KAFKA_MAX_IN_FLIGHT_REQUESTS || '5'),
      retries: parseInt(process.env.KAFKA_RETRIES || '3'),
      timeout: parseInt(process.env.KAFKA_TIMEOUT || '30000')
    };
  }

  private initializeKafka(): Kafka {
    return new Kafka({
      clientId: this.config.clientId,
      brokers: this.config.brokers,
      logLevel: logLevel.ERROR, // Reduce logs in production
      retry: {
        initialRetryTime: 1000,
        retries: this.config.retries,
        maxRetryTime: 30000,
        restartOnFailure: async (e) => {
          console.error('Kafka restart on failure:', e);
          return true;
        }
      },
      connectionTimeout: 10000,
      requestTimeout: this.config.timeout,
      // SASL configuration for production
      ...(process.env.KAFKA_USERNAME && {
        sasl: {
          mechanism: (process.env.KAFKA_SASL_MECHANISM as any) || 'plain',
          username: process.env.KAFKA_USERNAME,
          password: process.env.KAFKA_PASSWORD || '',
        },
      }),
      // SSL configuration for production
      ...(process.env.KAFKA_SSL === 'true' && {
        ssl: {
          rejectUnauthorized: process.env.NODE_ENV === 'production',
          // Add SSL certificate paths if needed (only in server environment)
          ...(process.env.KAFKA_SSL_CA_PATH && typeof window === 'undefined' && {
            ca: require('fs').readFileSync(process.env.KAFKA_SSL_CA_PATH)
          }),
          ...(process.env.KAFKA_SSL_CERT_PATH && typeof window === 'undefined' && {
            cert: require('fs').readFileSync(process.env.KAFKA_SSL_CERT_PATH)
          }),
          ...(process.env.KAFKA_SSL_KEY_PATH && typeof window === 'undefined' && {
            key: require('fs').readFileSync(process.env.KAFKA_SSL_KEY_PATH)
          })
        }
      })
    });
  }

  async connect(): Promise<boolean> {
    try {
      await this.setupProducer();
      this.isConnected = true;
      console.log('✅ Kafka cluster connected successfully');
      return true;
    } catch (error) {
      console.error('❌ Failed to connect to Kafka cluster:', error);
      this.isConnected = false;
      this.metrics.errors++;
      this.metrics.lastError = error as Error;
      return false;
    }
  }

  private async setupProducer(): Promise<void> {
    try {
      this.producer = this.kafka.producer({
        maxInFlightRequests: this.config.maxInFlightRequests,
        idempotent: true,
        transactionTimeout: 30000,
        retry: {
          initialRetryTime: 100,
          retries: this.config.retries
        }
      });

      await this.producer.connect();
      console.log('✅ Kafka producer connected');
    } catch (error) {
      console.error('❌ Failed to setup Kafka producer:', error);
      throw error;
    }
  }

  // High-performance event publishing
  async publishEvent(topic: string, event: KafkaEvent): Promise<boolean> {
    const startTime = Date.now();
    
    try {
      if (!this.producer || !this.isConnected) {
        console.log('⚠️ Kafka producer not connected');
        return false;
      }

      const message = {
        key: event.userId || event.sessionId || event.requestId || 'default',
        value: JSON.stringify({
          ...event,
          timestamp: event.timestamp || Date.now(),
          metadata: {
            ...event.metadata,
            publishedAt: Date.now(),
            instanceId: process.env.INSTANCE_ID || 'unknown'
          }
        }),
        headers: {
          'content-type': 'application/json',
          'event-type': event.type,
          'user-id': event.userId || '',
          'session-id': event.sessionId || ''
        }
      };

      await this.producer.send({
        topic,
        messages: [message],
        compression: this.config.compression,
        acks: 1, // Balance between performance and durability
        timeout: this.config.timeout
      });

      // Update metrics
      this.metrics.messagesProduced++;
      const latency = Date.now() - startTime;
      this.metrics.avgProduceLatency = (this.metrics.avgProduceLatency + latency) / 2;

      return true;
    } catch (error) {
      console.error(`❌ Failed to publish event to ${topic}:`, error);
      this.metrics.errors++;
      this.metrics.lastError = error as Error;
      return false;
    }
  }

  // Batch event publishing for high throughput
  async publishEvents(topic: string, events: KafkaEvent[]): Promise<{
    successful: number;
    failed: number;
    errors: Error[];
  }> {
    const startTime = Date.now();
    const results = { successful: 0, failed: 0, errors: [] as Error[] };

    try {
      if (!this.producer || !this.isConnected) {
        console.log('⚠️ Kafka producer not connected');
        return { successful: 0, failed: events.length, errors: [new Error('Producer not connected')] };
      }

      // Group events by key for better partitioning
      const eventsByKey = new Map<string, KafkaEvent[]>();
      
      for (const event of events) {
        const key = event.userId || event.sessionId || event.requestId || 'default';
        if (!eventsByKey.has(key)) {
          eventsByKey.set(key, []);
        }
        eventsByKey.get(key)!.push(event);
      }

      // Process in batches
      const batchSize = Math.min(this.config.batchSize || 100, events.length);
      const batches: KafkaEvent[][] = [];
      
      for (let i = 0; i < events.length; i += batchSize) {
        batches.push(events.slice(i, i + batchSize));
      }

      // Send batches
      for (const batch of batches) {
        try {
          const messages = batch.map(event => ({
            key: event.userId || event.sessionId || event.requestId || 'default',
            value: JSON.stringify({
              ...event,
              timestamp: event.timestamp || Date.now(),
              metadata: {
                ...event.metadata,
                publishedAt: Date.now(),
                instanceId: process.env.INSTANCE_ID || 'unknown'
              }
            }),
            headers: {
              'content-type': 'application/json',
              'event-type': event.type,
              'user-id': event.userId || '',
              'session-id': event.sessionId || ''
            }
          }));

          await this.producer.send({
            topic,
            messages,
            compression: this.config.compression,
            acks: 1,
            timeout: this.config.timeout
          });

          results.successful += batch.length;
        } catch (error) {
          console.error(`❌ Failed to publish batch to ${topic}:`, error);
          results.failed += batch.length;
          results.errors.push(error as Error);
        }
      }

      // Update metrics
      this.metrics.messagesProduced += results.successful;
      const latency = Date.now() - startTime;
      this.metrics.avgProduceLatency = (this.metrics.avgProduceLatency + latency) / 2;

      return results;
    } catch (error) {
      console.error(`❌ Failed to publish events to ${topic}:`, error);
      results.failed = events.length;
      results.errors.push(error as Error);
      this.metrics.errors++;
      this.metrics.lastError = error as Error;
      return results;
    }
  }

  // High-performance consumer with optimized settings
  async createConsumer(
    groupId: string,
    topics: string[],
    handler: (event: KafkaEvent, message: KafkaMessage) => Promise<void>,
    options: {
      maxBytes?: number;
      minBytes?: number;
      maxWaitTimeInMs?: number;
      sessionTimeout?: number;
      heartbeatInterval?: number;
      allowAutoTopicCreation?: boolean;
    } = {}
  ): Promise<boolean> {
    try {
      if (!this.isConnected) {
        console.log('⚠️ Kafka not connected, consumer not created');
        return false;
      }

      const consumer = this.kafka.consumer({
        groupId: groupId || this.config.groupId,
        sessionTimeout: options.sessionTimeout || 30000,
        heartbeatInterval: options.heartbeatInterval || 3000,
        maxBytesPerPartition: options.maxBytes || 1048576, // 1MB
        minBytes: options.minBytes || 1,
        maxWaitTimeInMs: options.maxWaitTimeInMs || 5000,
        allowAutoTopicCreation: options.allowAutoTopicCreation || false,
        retry: {
          initialRetryTime: 100,
          retries: this.config.retries
        }
      });

      await consumer.connect();
      await consumer.subscribe({ 
        topics, 
        fromBeginning: false 
      });

      await consumer.run({
        eachBatch: async ({ batch, resolveOffset, heartbeat }) => {
          const startTime = Date.now();
          
          try {
            // Process batch in parallel for better performance
            const promises = batch.messages.map(async (message) => {
              try {
                if (!message.value) return;

                const event: KafkaEvent = JSON.parse(message.value.toString());
                await handler(event, message);
                
                resolveOffset(message.offset);
                this.metrics.messagesConsumed++;
              } catch (error) {
                console.error(`❌ Error processing message from ${batch.topic}:`, error);
                this.metrics.errors++;
                this.metrics.lastError = error as Error;
              }
            });

            await Promise.allSettled(promises);
            
            // Update metrics
            const latency = Date.now() - startTime;
            this.metrics.avgConsumeLatency = (this.metrics.avgConsumeLatency + latency) / 2;
            
            // Send heartbeat to keep consumer alive
            await heartbeat();
          } catch (error) {
            console.error(`❌ Error processing batch from ${batch.topic}:`, error);
            this.metrics.errors++;
            this.metrics.lastError = error as Error;
          }
        },
        eachBatchAutoResolve: false
      });

      this.consumers.set(groupId, consumer);
      console.log(`✅ High-performance consumer created for topics: ${topics.join(', ')}`);
      return true;
    } catch (error) {
      console.error('❌ Failed to create consumer:', error);
      this.metrics.errors++;
      this.metrics.lastError = error as Error;
      return false;
    }
  }

  // Create multiple consumers for parallel processing
  async createConsumerPool(
    groupId: string,
    topics: string[],
    handler: (event: KafkaEvent, message: KafkaMessage) => Promise<void>,
    poolSize: number = 3
  ): Promise<boolean[]> {
    const promises: Promise<boolean>[] = [];
    
    for (let i = 0; i < poolSize; i++) {
      const consumerGroupId = `${groupId}-${i}`;
      promises.push(this.createConsumer(consumerGroupId, topics, handler));
    }

    return Promise.all(promises);
  }

  // Health check with detailed metrics
  async healthCheck(): Promise<{
    status: 'healthy' | 'unhealthy';
    metrics: typeof this.metrics;
    error?: string;
  }> {
    try {
      if (!this.isConnected) {
        return {
          status: 'unhealthy',
          metrics: this.metrics,
          error: 'Not connected to Kafka cluster'
        };
      }

      // Test producer
      if (this.producer) {
        await this.producer.send({
          topic: '__health_check__',
          messages: [{ key: 'health', value: JSON.stringify({ timestamp: Date.now() }) }]
        });
      }

      return {
        status: 'healthy',
        metrics: this.metrics
      };
    } catch (error) {
      return {
        status: 'unhealthy',
        metrics: this.metrics,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  // Get performance metrics
  getMetrics() {
    return {
      ...this.metrics,
      connected: this.isConnected,
      activeConsumers: this.consumers.size,
      config: this.config
    };
  }

  // Reset metrics
  resetMetrics() {
    this.metrics = {
      messagesProduced: 0,
      messagesConsumed: 0,
      errors: 0,
      lastError: null,
      avgProduceLatency: 0,
      avgConsumeLatency: 0
    };
  }

  // Graceful shutdown
  async disconnect(): Promise<void> {
    try {
      // Disconnect all consumers
      for (const [groupId, consumer] of this.consumers) {
        try {
          await consumer.disconnect();
          console.log(`✅ Consumer ${groupId} disconnected`);
        } catch (error) {
          console.error(`❌ Error disconnecting consumer ${groupId}:`, error);
        }
      }
      this.consumers.clear();

      // Disconnect producer
      if (this.producer) {
        await this.producer.disconnect();
        this.producer = null;
        console.log('✅ Producer disconnected');
      }

      this.isConnected = false;
      console.log('✅ Kafka cluster disconnected');
    } catch (error) {
      console.error('❌ Error during Kafka disconnection:', error);
    }
  }

  // Topic management
  async createTopics(topics: Array<{ topic: string; partitions: number; replicationFactor: number }>): Promise<boolean> {
    try {
      const admin = this.kafka.admin();
      await admin.connect();

      await admin.createTopics({
        topics: topics.map(t => ({
          topic: t.topic,
          numPartitions: t.partitions,
          replicationFactor: t.replicationFactor
        })),
        waitForLeaders: true,
        timeout: 30000
      });

      await admin.disconnect();
      console.log(`✅ Topics created: ${topics.map(t => t.topic).join(', ')}`);
      return true;
    } catch (error) {
      console.error('❌ Failed to create topics:', error);
      return false;
    }
  }

  // Get topic information
  async getTopicInfo(topic: string): Promise<any> {
    try {
      const admin = this.kafka.admin();
      await admin.connect();

      const metadata = await admin.fetchTopicMetadata({ topics: [topic] });
      await admin.disconnect();

      return metadata.topics.find(t => t.name === topic);
    } catch (error) {
      console.error(`❌ Failed to get topic info for ${topic}:`, error);
      return null;
    }
  }
}

// Singleton instance
export const kafkaClusterService = new KafkaClusterService();
