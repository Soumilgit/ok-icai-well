import Redis from 'ioredis';

export interface RateLimitConfig {
  windowMs: number; // Time window in milliseconds
  maxRequests: number; // Maximum requests per window
  skipSuccessfulRequests?: boolean; // Skip counting successful requests
  skipFailedRequests?: boolean; // Skip counting failed requests
  keyGenerator?: (req: any) => string; // Custom key generator
  onLimitReached?: (key: string, limit: number) => void; // Callback when limit reached
}

export interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  resetTime: number;
  totalHits: number;
  limit: number;
  windowMs: number;
}

export class RateLimiterService {
  private redis: Redis;
  private isConnected: boolean = false;
  private defaultConfig: RateLimitConfig;

  constructor() {
    this.defaultConfig = {
      windowMs: 60000, // 1 minute
      maxRequests: 100,
      skipSuccessfulRequests: false,
      skipFailedRequests: false
    };

    this.initializeRedis();
  }

  private initializeRedis(): void {
    try {
      const rateLimiterUrl = process.env.RATE_LIMITER_REDIS_URL;
      const rateLimiterHost = process.env.RATE_LIMITER_HOST || 'localhost';
      const rateLimiterPort = parseInt(process.env.RATE_LIMITER_PORT || '6380');
      const rateLimiterPassword = process.env.RATE_LIMITER_PASSWORD || 'RateLimiter_2025!';

      this.redis = new Redis({
        host: rateLimiterHost,
        port: rateLimiterPort,
        password: rateLimiterPassword,
        retryDelayOnFailover: 1000,
        maxRetriesPerRequest: 3,
        lazyConnect: true,
        enableOfflineQueue: false,
        connectTimeout: 5000,
        commandTimeout: 3000,
        keepAlive: 30000
      });

      this.setupEventHandlers();
    } catch (error) {
      console.error('❌ Failed to initialize rate limiter Redis:', error);
    }
  }

  private setupEventHandlers(): void {
    this.redis.on('connect', () => {
      console.log('✅ Rate limiter Redis connected');
      this.isConnected = true;
    });

    this.redis.on('ready', () => {
      console.log('🚀 Rate limiter Redis ready');
      this.isConnected = true;
    });

    this.redis.on('error', (error) => {
      console.error('❌ Rate limiter Redis error:', error);
      this.isConnected = false;
    });

    this.redis.on('close', () => {
      console.log('🔌 Rate limiter Redis connection closed');
      this.isConnected = false;
    });
  }

  async connect(): Promise<boolean> {
    try {
      if (!this.isConnected) {
        await this.redis.connect();
      }
      return this.isConnected;
    } catch (error) {
      console.error('❌ Failed to connect to rate limiter Redis:', error);
      return false;
    }
  }

  // Main rate limiting method
  async checkLimit(
    key: string, 
    config: Partial<RateLimitConfig> = {}
  ): Promise<RateLimitResult> {
    const finalConfig = { ...this.defaultConfig, ...config };
    
    try {
      if (!this.isConnected) {
        await this.connect();
      }

      if (!this.isConnected) {
        // Fallback: allow all requests if Redis is down
        return {
          allowed: true,
          remaining: finalConfig.maxRequests,
          resetTime: Date.now() + finalConfig.windowMs,
          totalHits: 0,
          limit: finalConfig.maxRequests,
          windowMs: finalConfig.windowMs
        };
      }

      const now = Date.now();
      const windowStart = Math.floor(now / finalConfig.windowMs);
      const redisKey = `rate_limit:${key}:${windowStart}`;

      // Use pipeline for atomic operations
      const pipeline = this.redis.pipeline();
      
      // Increment counter
      pipeline.incr(redisKey);
      
      // Set expiration (only if this is the first request in the window)
      pipeline.expire(redisKey, Math.ceil(finalConfig.windowMs / 1000));
      
      const results = await pipeline.exec();
      
      if (!results) {
        throw new Error('Pipeline execution failed');
      }

      const currentCount = results[0][1] as number;
      const allowed = currentCount <= finalConfig.maxRequests;
      
      // Calculate reset time (start of next window)
      const resetTime = (windowStart + 1) * finalConfig.windowMs;
      const remaining = Math.max(0, finalConfig.maxRequests - currentCount);

      // Call limit reached callback if needed
      if (!allowed && finalConfig.onLimitReached) {
        finalConfig.onLimitReached(key, finalConfig.maxRequests);
      }

      return {
        allowed,
        remaining,
        resetTime,
        totalHits: currentCount,
        limit: finalConfig.maxRequests,
        windowMs: finalConfig.windowMs
      };

    } catch (error) {
      console.error('❌ Rate limit check failed:', error);
      
      // Fallback: allow request if Redis fails
      return {
        allowed: true,
        remaining: finalConfig.maxRequests,
        resetTime: Date.now() + finalConfig.windowMs,
        totalHits: 0,
        limit: finalConfig.maxRequests,
        windowMs: finalConfig.windowMs
      };
    }
  }

  // Sliding window rate limiter (more accurate)
  async checkSlidingWindowLimit(
    key: string,
    config: Partial<RateLimitConfig> = {}
  ): Promise<RateLimitResult> {
    const finalConfig = { ...this.defaultConfig, ...config };
    
    try {
      if (!this.isConnected) {
        await this.connect();
      }

      if (!this.isConnected) {
        return {
          allowed: true,
          remaining: finalConfig.maxRequests,
          resetTime: Date.now() + finalConfig.windowMs,
          totalHits: 0,
          limit: finalConfig.maxRequests,
          windowMs: finalConfig.windowMs
        };
      }

      const now = Date.now();
      const windowStart = now - finalConfig.windowMs;
      const redisKey = `rate_limit_sliding:${key}`;

      // Use Lua script for atomic operations
      const luaScript = `
        local key = KEYS[1]
        local now = tonumber(ARGV[1])
        local window_ms = tonumber(ARGV[2])
        local max_requests = tonumber(ARGV[3])
        
        -- Remove old entries
        redis.call('ZREMRANGEBYSCORE', key, 0, now - window_ms)
        
        -- Count current requests
        local current_count = redis.call('ZCARD', key)
        
        if current_count < max_requests then
          -- Add new request
          redis.call('ZADD', key, now, now .. ':' .. math.random())
          redis.call('EXPIRE', key, math.ceil(window_ms / 1000))
          return {1, max_requests - current_count - 1}
        else
          -- Rate limit exceeded
          return {0, 0}
        end
      `;

      const result = await this.redis.eval(
        luaScript,
        1,
        redisKey,
        now.toString(),
        finalConfig.windowMs.toString(),
        finalConfig.maxRequests.toString()
      ) as [number, number];

      const allowed = result[0] === 1;
      const remaining = result[1];

      return {
        allowed: allowed,
        remaining: remaining,
        resetTime: now + finalConfig.windowMs,
        totalHits: finalConfig.maxRequests - remaining,
        limit: finalConfig.maxRequests,
        windowMs: finalConfig.windowMs
      };

    } catch (error) {
      console.error('❌ Sliding window rate limit check failed:', error);
      
      return {
        allowed: true,
        remaining: finalConfig.maxRequests,
        resetTime: Date.now() + finalConfig.windowMs,
        totalHits: 0,
        limit: finalConfig.maxRequests,
        windowMs: finalConfig.windowMs
      };
    }
  }

  // Token bucket rate limiter
  async checkTokenBucketLimit(
    key: string,
    config: Partial<RateLimitConfig & { bucketSize?: number; refillRate?: number }> = {}
  ): Promise<RateLimitResult> {
    const finalConfig = { 
      ...this.defaultConfig, 
      bucketSize: finalConfig.maxRequests * 2, // Allow burst
      refillRate: finalConfig.maxRequests / (finalConfig.windowMs / 1000), // Refill per second
      ...config 
    };
    
    try {
      if (!this.isConnected) {
        await this.connect();
      }

      if (!this.isConnected) {
        return {
          allowed: true,
          remaining: finalConfig.maxRequests,
          resetTime: Date.now() + finalConfig.windowMs,
          totalHits: 0,
          limit: finalConfig.maxRequests,
          windowMs: finalConfig.windowMs
        };
      }

      const now = Date.now();
      const redisKey = `rate_limit_bucket:${key}`;

      // Use Lua script for atomic token bucket operations
      const luaScript = `
        local key = KEYS[1]
        local now = tonumber(ARGV[1])
        local bucket_size = tonumber(ARGV[2])
        local refill_rate = tonumber(ARGV[3])
        local window_ms = tonumber(ARGV[4])
        
        local bucket_data = redis.call('HMGET', key, 'tokens', 'last_refill')
        local tokens = tonumber(bucket_data[1]) or bucket_size
        local last_refill = tonumber(bucket_data[2]) or now
        
        -- Calculate tokens to add based on time passed
        local time_passed = (now - last_refill) / 1000
        local tokens_to_add = math.floor(time_passed * refill_rate)
        tokens = math.min(bucket_size, tokens + tokens_to_add)
        
        if tokens >= 1 then
          -- Consume one token
          tokens = tokens - 1
          redis.call('HMSET', key, 'tokens', tokens, 'last_refill', now)
          redis.call('EXPIRE', key, math.ceil(window_ms / 1000))
          return {1, math.floor(tokens)}
        else
          -- No tokens available
          redis.call('HMSET', key, 'tokens', tokens, 'last_refill', now)
          redis.call('EXPIRE', key, math.ceil(window_ms / 1000))
          return {0, 0}
        end
      `;

      const result = await this.redis.eval(
        luaScript,
        1,
        redisKey,
        now.toString(),
        finalConfig.bucketSize!.toString(),
        finalConfig.refillRate!.toString(),
        finalConfig.windowMs.toString()
      ) as [number, number];

      const allowed = result[0] === 1;
      const remaining = result[1];

      return {
        allowed: allowed,
        remaining: remaining,
        resetTime: now + finalConfig.windowMs,
        totalHits: finalConfig.bucketSize! - remaining,
        limit: finalConfig.bucketSize!,
        windowMs: finalConfig.windowMs
      };

    } catch (error) {
      console.error('❌ Token bucket rate limit check failed:', error);
      
      return {
        allowed: true,
        remaining: finalConfig.maxRequests,
        resetTime: Date.now() + finalConfig.windowMs,
        totalHits: 0,
        limit: finalConfig.maxRequests,
        windowMs: finalConfig.windowMs
      };
    }
  }

  // Multiple rate limits (for different endpoints)
  async checkMultipleLimits(
    key: string,
    limits: Array<{ name: string; config: Partial<RateLimitConfig> }>
  ): Promise<Record<string, RateLimitResult>> {
    const results: Record<string, RateLimitResult> = {};
    
    // Check all limits in parallel
    const promises = limits.map(async (limit) => {
      const result = await this.checkLimit(`${key}:${limit.name}`, limit.config);
      results[limit.name] = result;
    });

    await Promise.all(promises);
    return results;
  }

  // Reset rate limit for a key
  async resetLimit(key: string): Promise<boolean> {
    try {
      if (!this.isConnected) {
        return false;
      }

      // Delete all rate limit keys for this key
      const pattern = `rate_limit*:${key}*`;
      const keys = await this.redis.keys(pattern);
      
      if (keys.length > 0) {
        await this.redis.del(...keys);
      }

      return true;
    } catch (error) {
      console.error('❌ Failed to reset rate limit:', error);
      return false;
    }
  }

  // Get current rate limit status
  async getLimitStatus(key: string): Promise<Record<string, any>> {
    try {
      if (!this.isConnected) {
        return {};
      }

      const pattern = `rate_limit*:${key}*`;
      const keys = await this.redis.keys(pattern);
      const status: Record<string, any> = {};

      for (const key of keys) {
        const value = await this.redis.get(key);
        const ttl = await this.redis.ttl(key);
        
        status[key] = {
          value: parseInt(value || '0'),
          ttl: ttl > 0 ? ttl * 1000 : 0,
          expiresAt: ttl > 0 ? Date.now() + (ttl * 1000) : null
        };
      }

      return status;
    } catch (error) {
      console.error('❌ Failed to get rate limit status:', error);
      return {};
    }
  }

  // Health check
  async healthCheck(): Promise<{ status: 'healthy' | 'unhealthy'; error?: string }> {
    try {
      if (!this.isConnected) {
        return { status: 'unhealthy', error: 'Not connected to Redis' };
      }

      await this.redis.ping();
      return { status: 'healthy' };
    } catch (error) {
      return { status: 'unhealthy', error: error instanceof Error ? error.message : 'Unknown error' };
    }
  }

  // Graceful shutdown
  async disconnect(): Promise<void> {
    try {
      if (this.redis) {
        await this.redis.disconnect();
        this.isConnected = false;
        console.log('✅ Rate limiter Redis disconnected');
      }
    } catch (error) {
      console.error('❌ Error disconnecting rate limiter Redis:', error);
    }
  }
}

// Singleton instance
export const rateLimiterService = new RateLimiterService();

// Predefined rate limit configurations for different endpoints
export const RATE_LIMITS = {
  // API endpoints
  API_GENERAL: { windowMs: 60000, maxRequests: 100 }, // 100 req/min
  API_CHAT: { windowMs: 60000, maxRequests: 50 }, // 50 req/min
  API_AUTH: { windowMs: 300000, maxRequests: 10 }, // 10 req/5min
  
  // User-based limits
  USER_GENERAL: { windowMs: 60000, maxRequests: 200 }, // 200 req/min per user
  USER_CHAT: { windowMs: 60000, maxRequests: 100 }, // 100 req/min per user
  USER_UPLOAD: { windowMs: 3600000, maxRequests: 10 }, // 10 uploads/hour per user
  
  // IP-based limits
  IP_GENERAL: { windowMs: 60000, maxRequests: 500 }, // 500 req/min per IP
  IP_AUTH: { windowMs: 300000, maxRequests: 20 }, // 20 auth attempts/5min per IP
  IP_LOGIN: { windowMs: 900000, maxRequests: 5 }, // 5 login attempts/15min per IP
  
  // Special limits for high-load scenarios
  BURST_PROTECTION: { windowMs: 1000, maxRequests: 10 }, // 10 req/sec burst protection
  DDoS_PROTECTION: { windowMs: 10000, maxRequests: 100 }, // 100 req/10sec DDoS protection
} as const;
