import Redis from 'ioredis';
import { promisify } from 'util';

interface CacheOptions {
  ttl?: number; // Time to live in seconds
  compress?: boolean;
  tags?: string[]; // For cache invalidation by tags
}

interface RedisClusterConfig {
  nodes: Array<{ host: string; port: number }>;
  options?: {
    redisOptions?: any;
    enableReadyCheck?: boolean;
    maxRedirections?: number;
    retryDelayOnFailover?: number;
    enableOfflineQueue?: boolean;
  };
}

export class RedisClusterService {
  private cluster: Redis.Cluster | null = null;
  private isConnected: boolean = false;
  private reconnectAttempts: number = 0;
  private maxReconnectAttempts: number = 5;

  constructor() {
    this.initializeCluster();
  }

  private initializeCluster(): void {
    try {
      const clusterConfig = this.getClusterConfig();
      
      if (clusterConfig.nodes.length === 1) {
        // Single node setup (fallback to regular Redis)
        this.cluster = new Redis(clusterConfig.nodes[0].port, clusterConfig.nodes[0].host, {
          password: process.env.REDIS_PASSWORD,
          db: parseInt(process.env.REDIS_DB || '0'),
          retryDelayOnFailover: 1000,
          maxRetriesPerRequest: 3,
          lazyConnect: true,
          enableOfflineQueue: false,
          connectTimeout: 10000,
          commandTimeout: 5000,
          keepAlive: 30000,
          ...clusterConfig.options?.redisOptions
        });
      } else {
        // Cluster setup
        this.cluster = new Redis.Cluster(clusterConfig.nodes, {
          redisOptions: {
            password: process.env.REDIS_PASSWORD,
            db: parseInt(process.env.REDIS_DB || '0'),
            retryDelayOnFailover: 1000,
            maxRetriesPerRequest: 3,
            lazyConnect: true,
            enableOfflineQueue: false,
            connectTimeout: 10000,
            commandTimeout: 5000,
            keepAlive: 30000,
            ...clusterConfig.options?.redisOptions
          },
          enableReadyCheck: clusterConfig.options?.enableReadyCheck ?? true,
          maxRedirections: clusterConfig.options?.maxRedirections ?? 16,
          retryDelayOnFailover: clusterConfig.options?.retryDelayOnFailover ?? 1000,
          enableOfflineQueue: clusterConfig.options?.enableOfflineQueue ?? false
        });
      }

      this.setupEventHandlers();
      console.log('🔧 Redis Cluster initialized with', clusterConfig.nodes.length, 'nodes');
    } catch (error) {
      console.error('❌ Failed to initialize Redis cluster:', error);
    }
  }

  private getClusterConfig(): RedisClusterConfig {
    const redisUrl = process.env.REDIS_URL;
    const redisHost = process.env.REDIS_HOST || 'localhost';
    const redisPort = parseInt(process.env.REDIS_PORT || '6379');
    
    // Check if cluster nodes are specified
    const clusterNodes = process.env.REDIS_CLUSTER_NODES;
    
    if (clusterNodes) {
      const nodes = clusterNodes.split(',').map(node => {
        const [host, port] = node.trim().split(':');
        return { host, port: parseInt(port) };
      });
      return { nodes };
    }

    // Check if REDIS_URL contains multiple nodes
    if (redisUrl && redisUrl.includes(',')) {
      const nodes = redisUrl.split(',').map(url => {
        const match = url.match(/redis:\/\/([^:]+):(\d+)/);
        if (match) {
          return { host: match[1], port: parseInt(match[2]) };
        }
        return { host: redisHost, port: redisPort };
      });
      return { nodes };
    }

    // Single node fallback
    return { nodes: [{ host: redisHost, port: redisPort }] };
  }

  private setupEventHandlers(): void {
    if (!this.cluster) return;

    this.cluster.on('connect', () => {
      console.log('✅ Redis cluster connected');
      this.isConnected = true;
      this.reconnectAttempts = 0;
    });

    this.cluster.on('ready', () => {
      console.log('🚀 Redis cluster ready');
      this.isConnected = true;
    });

    this.cluster.on('error', (error) => {
      console.error('❌ Redis cluster error:', error);
      this.isConnected = false;
    });

    this.cluster.on('close', () => {
      console.log('🔌 Redis cluster connection closed');
      this.isConnected = false;
    });

    this.cluster.on('reconnecting', () => {
      console.log('🔄 Redis cluster reconnecting...');
      this.reconnectAttempts++;
    });

    this.cluster.on('end', () => {
      console.log('🔚 Redis cluster connection ended');
      this.isConnected = false;
    });
  }

  async connect(): Promise<boolean> {
    try {
      if (!this.cluster) {
        this.initializeCluster();
      }

      if (this.cluster && !this.isConnected) {
        await this.cluster.connect();
        return true;
      }
      return this.isConnected;
    } catch (error) {
      console.error('❌ Failed to connect to Redis cluster:', error);
      return false;
    }
  }

  async disconnect(): Promise<void> {
    if (this.cluster) {
      await this.cluster.disconnect();
      this.isConnected = false;
    }
  }

  // Advanced Caching Methods
  async set(key: string, value: any, options: CacheOptions = {}): Promise<boolean> {
    try {
      if (!this.cluster || !this.isConnected) {
        return false;
      }

      let serializedValue: string;
      if (typeof value === 'string') {
        serializedValue = value;
      } else {
        serializedValue = JSON.stringify(value);
      }

      const pipeline = this.cluster.pipeline();
      
      // Set the main value
      if (options.ttl) {
        pipeline.setex(key, options.ttl, serializedValue);
      } else {
        pipeline.set(key, serializedValue);
      }

      // Handle cache tags for invalidation
      if (options.tags && options.tags.length > 0) {
        const tagKey = `tag:${options.tags.join(':')}`;
        pipeline.sadd(tagKey, key);
        if (options.ttl) {
          pipeline.expire(tagKey, options.ttl);
        }
      }

      // Set metadata
      const metadata = {
        createdAt: Date.now(),
        ttl: options.ttl,
        tags: options.tags || [],
        compressed: options.compress || false
      };
      pipeline.hset(`meta:${key}`, metadata);

      await pipeline.exec();
      return true;
    } catch (error) {
      console.error('❌ Failed to set cache:', error);
      return false;
    }
  }

  async get(key: string): Promise<any> {
    try {
      if (!this.cluster || !this.isConnected) {
        return null;
      }

      const value = await this.cluster.get(key);
      if (!value) return null;

      try {
        return JSON.parse(value);
      } catch {
        return value;
      }
    } catch (error) {
      console.error('❌ Failed to get cache:', error);
      return null;
    }
  }

  async del(key: string): Promise<boolean> {
    try {
      if (!this.cluster || !this.isConnected) {
        return false;
      }

      await this.cluster.del(key);
      await this.cluster.del(`meta:${key}`);
      return true;
    } catch (error) {
      console.error('❌ Failed to delete cache:', error);
      return false;
    }
  }

  async exists(key: string): Promise<boolean> {
    try {
      if (!this.cluster || !this.isConnected) {
        return false;
      }

      const result = await this.cluster.exists(key);
      return result === 1;
    } catch (error) {
      console.error('❌ Failed to check cache existence:', error);
      return false;
    }
  }

  async expire(key: string, seconds: number): Promise<boolean> {
    try {
      if (!this.cluster || !this.isConnected) {
        return false;
      }

      const result = await this.cluster.expire(key, seconds);
      return result === 1;
    } catch (error) {
      console.error('❌ Failed to set expiration:', error);
      return false;
    }
  }

  // Batch Operations
  async mget(keys: string[]): Promise<(string | null)[]> {
    try {
      if (!this.cluster || !this.isConnected || keys.length === 0) {
        return [];
      }

      return await this.cluster.mget(...keys);
    } catch (error) {
      console.error('❌ Failed to batch get cache:', error);
      return [];
    }
  }

  async mset(keyValuePairs: Record<string, any>, options: CacheOptions = {}): Promise<boolean> {
    try {
      if (!this.cluster || !this.isConnected) {
        return false;
      }

      const pipeline = this.cluster.pipeline();
      
      for (const [key, value] of Object.entries(keyValuePairs)) {
        const serializedValue = typeof value === 'string' ? value : JSON.stringify(value);
        
        if (options.ttl) {
          pipeline.setex(key, options.ttl, serializedValue);
        } else {
          pipeline.set(key, serializedValue);
        }

        // Handle cache tags
        if (options.tags && options.tags.length > 0) {
          const tagKey = `tag:${options.tags.join(':')}`;
          pipeline.sadd(tagKey, key);
          if (options.ttl) {
            pipeline.expire(tagKey, options.ttl);
          }
        }
      }

      await pipeline.exec();
      return true;
    } catch (error) {
      console.error('❌ Failed to batch set cache:', error);
      return false;
    }
  }

  // Cache Invalidation by Tags
  async invalidateByTags(tags: string[]): Promise<number> {
    try {
      if (!this.cluster || !this.isConnected || tags.length === 0) {
        return 0;
      }

      let invalidatedCount = 0;
      const pipeline = this.cluster.pipeline();

      for (const tag of tags) {
        const tagKey = `tag:${tag}`;
        const keys = await this.cluster.smembers(tagKey);
        
        if (keys.length > 0) {
          pipeline.del(...keys);
          pipeline.del(tagKey);
          invalidatedCount += keys.length;
        }
      }

      await pipeline.exec();
      return invalidatedCount;
    } catch (error) {
      console.error('❌ Failed to invalidate cache by tags:', error);
      return 0;
    }
  }

  // Pattern-based Operations
  async keys(pattern: string): Promise<string[]> {
    try {
      if (!this.cluster || !this.isConnected) {
        return [];
      }

      return await this.cluster.keys(pattern);
    } catch (error) {
      console.error('❌ Failed to get keys by pattern:', error);
      return [];
    }
  }

  // Cache Statistics
  async getStats(): Promise<{
    connected: boolean;
    memory: any;
    info: any;
    keyspace: any;
  }> {
    try {
      if (!this.cluster || !this.isConnected) {
        return { connected: false, memory: null, info: null, keyspace: null };
      }

      const info = await this.cluster.info();
      const memory = await this.cluster.info('memory');
      const keyspace = await this.cluster.info('keyspace');

      return {
        connected: this.isConnected,
        memory: this.parseInfoOutput(memory),
        info: this.parseInfoOutput(info),
        keyspace: this.parseInfoOutput(keyspace)
      };
    } catch (error) {
      console.error('❌ Failed to get cache stats:', error);
      return { connected: false, memory: null, info: null, keyspace: null };
    }
  }

  private parseInfoOutput(output: string): Record<string, any> {
    const result: Record<string, any> = {};
    const lines = output.split('\r\n');
    
    for (const line of lines) {
      if (line.includes(':')) {
        const [key, value] = line.split(':');
        result[key] = value;
      }
    }
    
    return result;
  }

  // Health Check
  async healthCheck(): Promise<{ status: 'healthy' | 'unhealthy'; error?: string }> {
    try {
      if (!this.cluster || !this.isConnected) {
        return { status: 'unhealthy', error: 'Not connected to Redis cluster' };
      }

      await this.cluster.ping();
      return { status: 'healthy' };
    } catch (error) {
      return { status: 'unhealthy', error: error instanceof Error ? error.message : 'Unknown error' };
    }
  }

  // Session Management
  async setSession(sessionId: string, data: any, ttl: number = 3600): Promise<boolean> {
    return this.set(`session:${sessionId}`, data, { ttl });
  }

  async getSession(sessionId: string): Promise<any> {
    return this.get(`session:${sessionId}`);
  }

  async deleteSession(sessionId: string): Promise<boolean> {
    return this.del(`session:${sessionId}`);
  }

  // Rate Limiting
  async checkRateLimit(key: string, limit: number, window: number): Promise<{
    allowed: boolean;
    remaining: number;
    resetTime: number;
  }> {
    try {
      if (!this.cluster || !this.isConnected) {
        return { allowed: false, remaining: 0, resetTime: Date.now() + window * 1000 };
      }

      const current = await this.cluster.incr(key);
      if (current === 1) {
        await this.cluster.expire(key, window);
      }

      const ttl = await this.cluster.ttl(key);
      const resetTime = Date.now() + (ttl > 0 ? ttl * 1000 : window * 1000);

      return {
        allowed: current <= limit,
        remaining: Math.max(0, limit - current),
        resetTime
      };
    } catch (error) {
      console.error('❌ Failed to check rate limit:', error);
      return { allowed: false, remaining: 0, resetTime: Date.now() + window * 1000 };
    }
  }

  // Message Queue Operations
  async pushToQueue(queueName: string, message: any): Promise<boolean> {
    try {
      if (!this.cluster || !this.isConnected) {
        return false;
      }

      const serializedMessage = JSON.stringify(message);
      await this.cluster.lpush(queueName, serializedMessage);
      return true;
    } catch (error) {
      console.error('❌ Failed to push to queue:', error);
      return false;
    }
  }

  async popFromQueue(queueName: string): Promise<any> {
    try {
      if (!this.cluster || !this.isConnected) {
        return null;
      }

      const message = await this.cluster.brpop(queueName, 5); // 5 second timeout
      if (!message) return null;

      return JSON.parse(message[1]);
    } catch (error) {
      console.error('❌ Failed to pop from queue:', error);
      return null;
    }
  }
}

// Singleton instance
export const redisClusterService = new RedisClusterService();
