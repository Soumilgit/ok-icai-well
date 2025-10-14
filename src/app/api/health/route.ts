import { NextRequest, NextResponse } from 'next/server';
import { monitoringService } from '../../lib/monitoring-service';
import { redisClusterService } from '../../lib/redis-cluster-service';
import { kafkaClusterService } from '../../lib/kafka-cluster-service';
import { rateLimiterService } from '../../lib/rate-limiter-service';

export async function GET(request: NextRequest): Promise<NextResponse> {
  const startTime = Date.now();
  
  try {
    // Get health status from monitoring service
    const healthStatus = await monitoringService.getHealthStatus();
    
    // Get individual service health checks
    const serviceChecks = await Promise.allSettled([
      redisClusterService.healthCheck(),
      kafkaClusterService.healthCheck(),
      rateLimiterService.healthCheck()
    ]);

    const services = {
      redis: serviceChecks[0].status === 'fulfilled' ? serviceChecks[0].value : { status: 'unhealthy', error: 'Check failed' },
      kafka: serviceChecks[1].status === 'fulfilled' ? serviceChecks[1].value : { status: 'unhealthy', error: 'Check failed' },
      rateLimiter: serviceChecks[2].status === 'fulfilled' ? serviceChecks[2].value : { status: 'unhealthy', error: 'Check failed' }
    };

    // Determine overall health status
    const allServicesHealthy = Object.values(services).every(service => service.status === 'healthy');
    const overallStatus = allServicesHealthy ? healthStatus.status : 'unhealthy';

    const response = {
      status: overallStatus,
      timestamp: new Date().toISOString(),
      uptime: Date.now() - startTime,
      version: process.env.npm_package_version || '1.0.0',
      instanceId: process.env.INSTANCE_ID || 'unknown',
      environment: process.env.NODE_ENV || 'development',
      services,
      metrics: healthStatus.metrics,
      alerts: healthStatus.alerts,
      performance: {
        responseTime: Date.now() - startTime,
        memory: process.memoryUsage(),
        cpu: process.cpuUsage()
      }
    };

    // Set appropriate HTTP status code
    const httpStatus = overallStatus === 'healthy' ? 200 : 
                      overallStatus === 'degraded' ? 200 : 503;

    return NextResponse.json(response, { 
      status: httpStatus,
      headers: {
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'X-Health-Check': 'true',
        'X-Instance-ID': process.env.INSTANCE_ID || 'unknown'
      }
    });

  } catch (error) {
    console.error('❌ Health check failed:', error);
    
    return NextResponse.json(
      {
        status: 'unhealthy',
        timestamp: new Date().toISOString(),
        error: 'Health check failed',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { 
        status: 503,
        headers: {
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          'X-Health-Check': 'failed'
        }
      }
    );
  }
}

// Lightweight health check for load balancer
export async function HEAD(request: NextRequest): Promise<NextResponse> {
  try {
    // Quick Redis ping
    await redisClusterService.connect();
    const redisHealth = await redisClusterService.healthCheck();
    
    if (redisHealth.status !== 'healthy') {
      return new NextResponse(null, { status: 503 });
    }

    return new NextResponse(null, { 
      status: 200,
      headers: {
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'X-Health-Check': 'lightweight'
      }
    });
  } catch (error) {
    return new NextResponse(null, { status: 503 });
  }
}