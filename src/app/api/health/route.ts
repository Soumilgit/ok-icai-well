import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest): Promise<NextResponse> {
  const startTime = Date.now();
  
  try {
    // Simple health check without external dependencies
    const response = {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      uptime: Date.now() - startTime,
      version: process.env.npm_package_version || '1.0.0',
      instanceId: process.env.INSTANCE_ID || 'unknown',
      environment: process.env.NODE_ENV || 'development',
      services: {
        redis: { status: 'unknown', message: 'Service not checked' },
        kafka: { status: 'unknown', message: 'Service not checked' },
        rateLimiter: { status: 'unknown', message: 'Service not checked' }
      },
      performance: {
        responseTime: Date.now() - startTime,
        memory: process.memoryUsage(),
        cpu: process.cpuUsage()
      }
    };

    return NextResponse.json(response, { 
      status: 200,
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
    // Simple lightweight check without external dependencies
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