import { NextRequest, NextResponse } from 'next/server';
import { rateLimiterService, RATE_LIMITS } from '../lib/rate-limiter-service';
import { monitoringService } from '../lib/monitoring-service';
import { kafkaClusterService } from '../lib/kafka-cluster-service';
import { redisClusterService } from '../lib/redis-cluster-service';

interface MiddlewareConfig {
  enableRateLimiting?: boolean;
  enableMonitoring?: boolean;
  enableCaching?: boolean;
  cacheTTL?: number;
  rateLimitConfig?: typeof RATE_LIMITS[keyof typeof RATE_LIMITS];
}

export class HighPerformanceMiddleware {
  private config: Required<MiddlewareConfig>;

  constructor(config: MiddlewareConfig = {}) {
    this.config = {
      enableRateLimiting: true,
      enableMonitoring: true,
      enableCaching: true,
      cacheTTL: 300, // 5 minutes
      rateLimitConfig: RATE_LIMITS.API_GENERAL,
      ...config
    };
  }

  async handleRequest(
    request: NextRequest,
    handler: (req: NextRequest) => Promise<NextResponse>,
    customConfig?: Partial<MiddlewareConfig>
  ): Promise<NextResponse> {
    const startTime = Date.now();
    const config = { ...this.config, ...customConfig };
    
    try {
      // Extract request information
      const requestInfo = this.extractRequestInfo(request);
      
      // Rate limiting
      if (config.enableRateLimiting) {
        const rateLimitResult = await this.checkRateLimit(request, requestInfo, config);
        if (!rateLimitResult.allowed) {
          return this.createRateLimitResponse(rateLimitResult);
        }
      }

      // Check cache
      let response: NextResponse;
      const cacheKey = config.enableCaching ? this.generateCacheKey(request, requestInfo) : null;
      
      if (cacheKey) {
        const cachedResponse = await this.getCachedResponse(cacheKey);
        if (cachedResponse) {
          return cachedResponse;
        }
      }

      // Execute the actual handler
      response = await handler(request);

      // Cache the response
      if (cacheKey && this.shouldCacheResponse(response)) {
        await this.cacheResponse(cacheKey, response, config.cacheTTL);
      }

      // Record metrics
      if (config.enableMonitoring) {
        const responseTime = Date.now() - startTime;
        const isError = response.status >= 400;
        monitoringService.recordRequest(responseTime, isError);

        // Publish request metrics to Kafka
        await this.publishRequestMetrics(requestInfo, response, responseTime, isError);
      }

      return response;

    } catch (error) {
      const responseTime = Date.now() - startTime;
      const isError = true;
      
      if (config.enableMonitoring) {
        monitoringService.recordRequest(responseTime, isError);
        await this.publishErrorMetrics(requestInfo, error, responseTime);
      }

      return NextResponse.json(
        { error: 'Internal server error' },
        { status: 500 }
      );
    }
  }

  private extractRequestInfo(request: NextRequest) {
    const url = new URL(request.url);
    const userAgent = request.headers.get('user-agent') || '';
    const xForwardedFor = request.headers.get('x-forwarded-for');
    const realIp = request.headers.get('x-real-ip');
    
    // Get client IP
    const clientIp = realIp || 
                    (xForwardedFor ? xForwardedFor.split(',')[0].trim() : '') ||
                    request.ip ||
                    'unknown';

    // Extract user ID from headers or JWT (if available)
    const userId = request.headers.get('x-user-id') || 'anonymous';
    
    // Extract session ID
    const sessionId = request.headers.get('x-session-id') || 'anonymous';

    return {
      method: request.method,
      path: url.pathname,
      query: Object.fromEntries(url.searchParams),
      clientIp,
      userId,
      sessionId,
      userAgent,
      timestamp: Date.now(),
      requestId: this.generateRequestId()
    };
  }

  private generateRequestId(): string {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  private async checkRateLimit(
    request: NextRequest, 
    requestInfo: any, 
    config: Required<MiddlewareConfig>
  ): Promise<{ allowed: boolean; remaining: number; resetTime: number }> {
    try {
      // Determine rate limit key based on endpoint
      let rateLimitKey: string;
      let rateLimitConfig = config.rateLimitConfig;

      if (requestInfo.path.startsWith('/api/chat/')) {
        rateLimitKey = `chat:${requestInfo.userId}:${requestInfo.clientIp}`;
        rateLimitConfig = RATE_LIMITS.API_CHAT;
      } else if (requestInfo.path.startsWith('/api/auth/')) {
        rateLimitKey = `auth:${requestInfo.clientIp}`;
        rateLimitConfig = RATE_LIMITS.API_AUTH;
      } else if (requestInfo.userId !== 'anonymous') {
        rateLimitKey = `user:${requestInfo.userId}`;
        rateLimitConfig = RATE_LIMITS.USER_GENERAL;
      } else {
        rateLimitKey = `ip:${requestInfo.clientIp}`;
        rateLimitConfig = RATE_LIMITS.IP_GENERAL;
      }

      // Apply burst protection for high-load scenarios
      const burstResult = await rateLimiterService.checkSlidingWindowLimit(
        `burst:${requestInfo.clientIp}`,
        RATE_LIMITS.BURST_PROTECTION
      );

      if (!burstResult.allowed) {
        return burstResult;
      }

      // Apply main rate limit
      const result = await rateLimiterService.checkSlidingWindowLimit(
        rateLimitKey,
        rateLimitConfig
      );

      return result;
    } catch (error) {
      console.error('❌ Rate limit check failed:', error);
      // Allow request if rate limiting fails
      return { allowed: true, remaining: 100, resetTime: Date.now() + 60000 };
    }
  }

  private createRateLimitResponse(rateLimitResult: any): NextResponse {
    return NextResponse.json(
      {
        error: 'Rate limit exceeded',
        message: 'Too many requests. Please try again later.',
        retryAfter: Math.ceil((rateLimitResult.resetTime - Date.now()) / 1000)
      },
      {
        status: 429,
        headers: {
          'Retry-After': Math.ceil((rateLimitResult.resetTime - Date.now()) / 1000).toString(),
          'X-RateLimit-Limit': rateLimitResult.limit.toString(),
          'X-RateLimit-Remaining': rateLimitResult.remaining.toString(),
          'X-RateLimit-Reset': rateLimitResult.resetTime.toString()
        }
      }
    );
  }

  private generateCacheKey(request: NextRequest, requestInfo: any): string {
    const url = new URL(request.url);
    const queryString = url.searchParams.toString();
    const userId = requestInfo.userId;
    
    // Create cache key based on method, path, query, and user
    return `cache:${requestInfo.method}:${requestInfo.path}:${queryString}:${userId}`;
  }

  private async getCachedResponse(cacheKey: string): Promise<NextResponse | null> {
    try {
      const cached = await redisClusterService.get(cacheKey);
      if (!cached) return null;

      const { status, headers, body } = cached;
      
      return new NextResponse(body, {
        status,
        headers: new Headers(headers)
      });
    } catch (error) {
      console.error('❌ Cache retrieval failed:', error);
      return null;
    }
  }

  private shouldCacheResponse(response: NextResponse): boolean {
    // Only cache successful GET requests
    return response.status === 200 && 
           response.headers.get('content-type')?.includes('application/json');
  }

  private async cacheResponse(
    cacheKey: string, 
    response: NextResponse, 
    ttl: number
  ): Promise<void> {
    try {
      const responseClone = response.clone();
      const body = await responseClone.text();
      
      const cacheData = {
        status: response.status,
        headers: Object.fromEntries(response.headers.entries()),
        body
      };

      await redisClusterService.set(cacheKey, cacheData, { ttl });
    } catch (error) {
      console.error('❌ Cache storage failed:', error);
    }
  }

  private async publishRequestMetrics(
    requestInfo: any,
    response: NextResponse,
    responseTime: number,
    isError: boolean
  ): Promise<void> {
    try {
      await kafkaClusterService.publishEvent('request-metrics', {
        type: 'request_completed',
        data: {
          ...requestInfo,
          responseTime,
          statusCode: response.status,
          isError,
          contentLength: response.headers.get('content-length') || 0
        },
        userId: requestInfo.userId,
        sessionId: requestInfo.sessionId,
        requestId: requestInfo.requestId,
        timestamp: Date.now(),
        metadata: {
          instanceId: process.env.INSTANCE_ID || 'unknown',
          version: process.env.npm_package_version || '1.0.0'
        }
      });
    } catch (error) {
      console.error('❌ Failed to publish request metrics:', error);
    }
  }

  private async publishErrorMetrics(
    requestInfo: any,
    error: any,
    responseTime: number
  ): Promise<void> {
    try {
      await kafkaClusterService.publishEvent('error-metrics', {
        type: 'request_error',
        data: {
          ...requestInfo,
          responseTime,
          error: {
            message: error.message,
            stack: error.stack,
            name: error.name
          }
        },
        userId: requestInfo.userId,
        sessionId: requestInfo.sessionId,
        requestId: requestInfo.requestId,
        timestamp: Date.now(),
        metadata: {
          instanceId: process.env.INSTANCE_ID || 'unknown',
          severity: 'high'
        }
      });
    } catch (error) {
      console.error('❌ Failed to publish error metrics:', error);
    }
  }
}

// Pre-configured middleware instances for different use cases
export const apiMiddleware = new HighPerformanceMiddleware({
  enableRateLimiting: true,
  enableMonitoring: true,
  enableCaching: true,
  cacheTTL: 300,
  rateLimitConfig: RATE_LIMITS.API_GENERAL
});

export const chatMiddleware = new HighPerformanceMiddleware({
  enableRateLimiting: true,
  enableMonitoring: true,
  enableCaching: false, // Chat responses shouldn't be cached
  rateLimitConfig: RATE_LIMITS.API_CHAT
});

export const authMiddleware = new HighPerformanceMiddleware({
  enableRateLimiting: true,
  enableMonitoring: true,
  enableCaching: false, // Auth responses shouldn't be cached
  rateLimitConfig: RATE_LIMITS.API_AUTH
});

export const staticMiddleware = new HighPerformanceMiddleware({
  enableRateLimiting: true,
  enableMonitoring: true,
  enableCaching: true,
  cacheTTL: 3600, // 1 hour for static content
  rateLimitConfig: RATE_LIMITS.IP_GENERAL
});
