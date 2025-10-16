import Redis from 'ioredis';

interface CacheOptions {
  ttl?: number; // Time to live in seconds
  compress?: boolean;
}

export class RedisService {
  private client: Redis;
  private isConnected: boolean = false;
  private reconnectAttempts: number = 0;
  private maxReconnectAttempts: number = 3;

  constructor() {
    const redisUrl = process.env.REDIS_URL;
    const redisHost = process.env.REDIS_HOST || 'localhost';
    const redisPort = parseInt(process.env.REDIS_PORT || '6379');
    const redisPassword = process.env.REDIS_PASSWORD;
    const redisUsername = process.env.REDIS_USERNAME || 'default';
    const redisDb = parseInt(process.env.REDIS_DB || '0');
    const redisTls = process.env.REDIS_TLS === 'true';
    
    const maxRetries = parseInt(process.env.REDIS_MAX_RETRIES || '3');
    const retryDelayOnFailover = parseInt(process.env.REDIS_RETRY_DELAY || '1000');
    const connectTimeout = parseInt(process.env.REDIS_CONNECT_TIMEOUT || '10000');
    const commandTimeout = parseInt(process.env.REDIS_COMMAND_TIMEOUT || '5000');
    const keepAlive = parseInt(process.env.REDIS_KEEP_ALIVE || '30000');

    // Configure Redis connection options
    const redisOptions: any = {
      retryDelayOnFailover,
      maxRetriesPerRequest: maxRetries,
      lazyConnect: true,
      enableOfflineQueue: false,
      connectTimeout,
      commandTimeout,
      keepAlive,
      db: redisDb,
    };

    // Add authentication if provided
    if (redisPassword) {
      redisOptions.password = redisPassword;
      if (redisUsername && redisUsername !== 'default') {
        redisOptions.username = redisUsername;
      }
    }

    // Add TLS configuration if enabled
    if (redisTls) {
      redisOptions.tls = {
        // TLS options - customize based on your certificate setup
        rejectUnauthorized: process.env.NODE_ENV === 'production',
      };
      
      // Add certificate paths if provided (only in server environment)
      if (process.env.REDIS_TLS_CERT_PATH && typeof window === 'undefined') {
        redisOptions.tls.cert = require('fs').readFileSync(process.env.REDIS_TLS_CERT_PATH);
      }
      if (process.env.REDIS_TLS_KEY_PATH && typeof window === 'undefined') {
        redisOptions.tls.key = require('fs').readFileSync(process.env.REDIS_TLS_KEY_PATH);
      }
      if (process.env.REDIS_TLS_CA_PATH && typeof window === 'undefined') {
        redisOptions.tls.ca = require('fs').readFileSync(process.env.REDIS_TLS_CA_PATH);
      }
    }

    // Initialize Redis client
    if (redisUrl) {
      // Use URL if provided (takes precedence)
      this.client = new Redis(redisUrl, redisOptions);
      console.log('🔧 Redis initialized with URL:', redisUrl.replace(/:\/\/.*@/, '://***:***@'));
    } else {
      // Use individual connection parameters
      this.client = new Redis({
        host: redisHost,
        port: redisPort,
        ...redisOptions
      });
      console.log(`🔧 Redis initialized with host: ${redisHost}:${redisPort}, DB: ${redisDb}`);
    }

    this.setupEventHandlers();
  }

  private setupEventHandlers() {
    this.client.on('connect', () => {
      console.log('✅ Redis connected successfully');
      this.isConnected = true;
      this.reconnectAttempts = 0;
    });

    this.client.on('error', (error) => {
      console.error('❌ Redis connection error:', error.message);
      this.isConnected = false;
    });

    this.client.on('close', () => {
      console.log('⚠️ Redis connection closed');
      this.isConnected = false;
    });

    this.client.on('reconnecting', () => {
      this.reconnectAttempts++;
      console.log(`🔄 Redis reconnecting... Attempt ${this.reconnectAttempts}`);
    });
  }

  async connect(): Promise<boolean> {
    try {
      if (!process.env.ENABLE_REDIS || process.env.ENABLE_REDIS === 'false') {
        console.log('ℹ️ Redis disabled via environment variable');
        return false;
      }

      await this.client.connect();
      return this.isConnected;
    } catch (error) {
      console.error('❌ Failed to connect to Redis:', error);
      return false;
    }
  }

  async disconnect(): Promise<void> {
    try {
      await this.client.quit();
    } catch (error) {
      console.error('Error disconnecting from Redis:', error);
    }
  }

  // Cache Management
  async set(key: string, value: any, options: CacheOptions = {}): Promise<boolean> {
    try {
      if (!this.isConnected) return false;

      const serializedValue = JSON.stringify(value);
      const { ttl = 3600 } = options; // Default 1 hour TTL

      if (ttl > 0) {
        await this.client.setex(key, ttl, serializedValue);
      } else {
        await this.client.set(key, serializedValue);
      }

      return true;
    } catch (error) {
      console.error(`Redis SET error for key ${key}:`, error);
      return false;
    }
  }

  async get<T>(key: string): Promise<T | null> {
    try {
      if (!this.isConnected) return null;

      const value = await this.client.get(key);
      if (!value) return null;

      return JSON.parse(value) as T;
    } catch (error) {
      console.error(`Redis GET error for key ${key}:`, error);
      return null;
    }
  }

  async del(key: string): Promise<boolean> {
    try {
      if (!this.isConnected) return false;

      const result = await this.client.del(key);
      return result > 0;
    } catch (error) {
      console.error(`Redis DEL error for key ${key}:`, error);
      return false;
    }
  }

  async exists(key: string): Promise<boolean> {
    try {
      if (!this.isConnected) return false;

      const result = await this.client.exists(key);
      return result === 1;
    } catch (error) {
      console.error(`Redis EXISTS error for key ${key}:`, error);
      return false;
    }
  }

  // Advanced Operations
  async mget<T>(keys: string[]): Promise<(T | null)[]> {
    try {
      if (!this.isConnected || keys.length === 0) return [];

      const values = await this.client.mget(...keys);
      return values.map(value => value ? JSON.parse(value) as T : null);
    } catch (error) {
      console.error('Redis MGET error:', error);
      return keys.map(() => null);
    }
  }

  async increment(key: string, by: number = 1): Promise<number | null> {
    try {
      if (!this.isConnected) return null;

      const result = await this.client.incrby(key, by);
      return result;
    } catch (error) {
      console.error(`Redis INCREMENT error for key ${key}:`, error);
      return null;
    }
  }

  // Rate Limiting
  async rateLimit(key: string, limit: number, windowSeconds: number): Promise<{ allowed: boolean; remaining: number; resetTime: number }> {
    try {
      if (!this.isConnected) {
        return { allowed: true, remaining: limit - 1, resetTime: Date.now() + windowSeconds * 1000 };
      }

      const multi = this.client.multi();
      const now = Date.now();
      const window = Math.floor(now / (windowSeconds * 1000));
      const rateLimitKey = `${key}:${window}`;

      multi.incr(rateLimitKey);
      multi.expire(rateLimitKey, windowSeconds);
      
      const results = await multi.exec();
      const count = results?.[0]?.[1] as number || 0;

      const allowed = count <= limit;
      const remaining = Math.max(0, limit - count);
      const resetTime = (window + 1) * windowSeconds * 1000;

      return { allowed, remaining, resetTime };
    } catch (error) {
      console.error(`Redis rate limit error for key ${key}:`, error);
      return { allowed: true, remaining: limit - 1, resetTime: Date.now() + windowSeconds * 1000 };
    }
  }

  // Session Management
  async setSession(sessionId: string, data: any, ttl: number = 86400): Promise<boolean> {
    return this.set(`session:${sessionId}`, data, { ttl });
  }

  async getSession<T>(sessionId: string): Promise<T | null> {
    return this.get<T>(`session:${sessionId}`);
  }

  async deleteSession(sessionId: string): Promise<boolean> {
    return this.del(`session:${sessionId}`);
  }

  // Cache Patterns for Dashboard
  async cacheUserDashboard(userId: string, data: any, ttl: number = 300): Promise<boolean> {
    return this.set(`dashboard:${userId}`, data, { ttl });
  }

  async getUserDashboard<T>(userId: string): Promise<T | null> {
    return this.get<T>(`dashboard:${userId}`);
  }

  async invalidateUserDashboard(userId: string): Promise<boolean> {
    return this.del(`dashboard:${userId}`);
  }

  // News caching
  async cacheNews(data: any, ttl: number = 1800): Promise<boolean> {
    return this.set('news:latest', data, { ttl });
  }

  async getLatestNews<T>(): Promise<T | null> {
    return this.get<T>('news:latest');
  }

  // Health check
  async healthCheck(): Promise<{ status: 'healthy' | 'unhealthy'; latency?: number; error?: string }> {
    try {
      if (!this.isConnected) {
        return { status: 'unhealthy', error: 'Not connected' };
      }

      const start = Date.now();
      await this.client.ping();
      const latency = Date.now() - start;

      return { status: 'healthy', latency };
    } catch (error) {
      return { status: 'unhealthy', error: error instanceof Error ? error.message : 'Unknown error' };
    }
  }

  // Getters
  get connected(): boolean {
    return this.isConnected;
  }

  get redis(): Redis {
    return this.client;
  }
}

// Singleton instance
export const redisService = new RedisService();