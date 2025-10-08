import { NextRequest, NextResponse } from 'next/server';
import { infrastructureManager } from '@/lib/infrastructure-manager';

export async function GET(request: NextRequest) {
  try {
    // Initialize infrastructure if not already done
    if (!infrastructureManager.isInitialized) {
      await infrastructureManager.initialize();
    }

    const health = await infrastructureManager.getHealth();
    
    const statusCode = health.overall === 'healthy' ? 200 : 
                      health.overall === 'degraded' ? 207 : 503;

    return NextResponse.json({
      status: health.overall,
      timestamp: new Date().toISOString(),
      services: {
        redis: {
          status: health.redis.status,
          connected: health.redis.connected,
          latency: health.redis.latency,
          error: health.redis.error,
        },
        kafka: {
          status: health.kafka.status,
          connected: health.kafka.connected,
          error: health.kafka.error,
        },
      },
      uptime: process.uptime(),
      memory: {
        used: Math.round(process.memoryUsage().heapUsed / 1024 / 1024),
        total: Math.round(process.memoryUsage().heapTotal / 1024 / 1024),
        external: Math.round(process.memoryUsage().external / 1024 / 1024),
      },
    }, { status: statusCode });
  } catch (error) {
    return NextResponse.json({
      status: 'unhealthy',
      timestamp: new Date().toISOString(),
      error: error instanceof Error ? error.message : 'Unknown error',
    }, { status: 503 });
  }
}