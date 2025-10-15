import { kafkaClusterService } from './kafka-cluster-service';
import { redisClusterService } from './redis-cluster-service';
import { rateLimiterService } from './rate-limiter-service';

export interface SystemMetrics {
  timestamp: number;
  instanceId: string;
  uptime: number;
  memory: {
    used: number;
    free: number;
    total: number;
    percentage: number;
  };
  cpu: {
    usage: number;
    loadAverage: number[];
  };
  network: {
    bytesIn: number;
    bytesOut: number;
  };
  services: {
    redis: {
      connected: boolean;
      latency: number;
      memory?: any;
    };
    kafka: {
      connected: boolean;
      metrics: any;
    };
    rateLimiter: {
      connected: boolean;
    };
  };
  performance: {
    requestCount: number;
    averageResponseTime: number;
    errorRate: number;
    throughput: number;
  };
}

export interface AlertConfig {
  name: string;
  condition: (metrics: SystemMetrics) => boolean;
  severity: 'low' | 'medium' | 'high' | 'critical';
  message: string;
  cooldown: number; // milliseconds
}

export class MonitoringService {
  private metrics: SystemMetrics[] = [];
  private alerts: Map<string, { lastTriggered: number; config: AlertConfig }> = new Map();
  private isRunning: boolean = false;
  private intervalId: NodeJS.Timeout | null = null;
  private startTime: number = Date.now();
  private requestCount: number = 0;
  private responseTimes: number[] = [];
  private errorCount: number = 0;

  constructor() {
    this.initializeAlerts();
  }

  private initializeAlerts(): void {
    const alerts: AlertConfig[] = [
      {
        name: 'high_memory_usage',
        condition: (metrics) => metrics.memory.percentage > 85,
        severity: 'high',
        message: 'High memory usage detected',
        cooldown: 300000 // 5 minutes
      },
      {
        name: 'high_cpu_usage',
        condition: (metrics) => metrics.cpu.usage > 80,
        severity: 'high',
        message: 'High CPU usage detected',
        cooldown: 300000
      },
      {
        name: 'redis_disconnected',
        condition: (metrics) => !metrics.services.redis.connected,
        severity: 'critical',
        message: 'Redis service disconnected',
        cooldown: 60000 // 1 minute
      },
      {
        name: 'kafka_disconnected',
        condition: (metrics) => !metrics.services.kafka.connected,
        severity: 'critical',
        message: 'Kafka service disconnected',
        cooldown: 60000
      },
      {
        name: 'high_error_rate',
        condition: (metrics) => metrics.performance.errorRate > 5,
        severity: 'medium',
        message: 'High error rate detected',
        cooldown: 300000
      },
      {
        name: 'slow_response_time',
        condition: (metrics) => metrics.performance.averageResponseTime > 5000,
        severity: 'medium',
        message: 'Slow response times detected',
        cooldown: 300000
      },
      {
        name: 'low_throughput',
        condition: (metrics) => metrics.performance.throughput < 10,
        severity: 'low',
        message: 'Low throughput detected',
        cooldown: 600000 // 10 minutes
      }
    ];

    alerts.forEach(alert => {
      this.alerts.set(alert.name, {
        lastTriggered: 0,
        config: alert
      });
    });
  }

  async start(intervalMs: number = 30000): Promise<void> {
    if (this.isRunning) {
      console.log('⚠️ Monitoring service is already running');
      return;
    }

    this.isRunning = true;
    console.log('🚀 Starting monitoring service...');

    // Initial metrics collection
    await this.collectMetrics();

    // Set up periodic collection
    this.intervalId = setInterval(async () => {
      try {
        await this.collectMetrics();
        await this.checkAlerts();
      } catch (error) {
        console.error('❌ Error in monitoring collection:', error);
      }
    }, intervalMs);

    console.log(`✅ Monitoring service started (interval: ${intervalMs}ms)`);
  }

  async stop(): Promise<void> {
    if (!this.isRunning) {
      return;
    }

    this.isRunning = false;
    
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }

    console.log('✅ Monitoring service stopped');
  }

  private async collectMetrics(): Promise<void> {
    try {
      const timestamp = Date.now();
      const uptime = timestamp - this.startTime;

      // Collect system metrics
      const memoryUsage = process.memoryUsage();
      const cpuUsage = await this.getCpuUsage();
      const loadAverage = this.getLoadAverage();

      // Collect service metrics
      const redisHealth = await redisClusterService.healthCheck();
      const kafkaHealth = await kafkaClusterService.healthCheck();
      const rateLimiterHealth = await rateLimiterService.healthCheck();

      // Calculate performance metrics
      const averageResponseTime = this.responseTimes.length > 0 
        ? this.responseTimes.reduce((a, b) => a + b, 0) / this.responseTimes.length 
        : 0;
      
      const errorRate = this.requestCount > 0 ? (this.errorCount / this.requestCount) * 100 : 0;
      const throughput = this.requestCount / (uptime / 1000); // requests per second

      const metrics: SystemMetrics = {
        timestamp,
        instanceId: process.env.INSTANCE_ID || 'unknown',
        uptime,
        memory: {
          used: memoryUsage.heapUsed,
          free: memoryUsage.heapTotal - memoryUsage.heapUsed,
          total: memoryUsage.heapTotal,
          percentage: (memoryUsage.heapUsed / memoryUsage.heapTotal) * 100
        },
        cpu: {
          usage: cpuUsage,
          loadAverage
        },
        network: {
          bytesIn: 0, // Would need additional monitoring
          bytesOut: 0
        },
        services: {
          redis: {
            connected: redisHealth.status === 'healthy',
            latency: 0, // Would need to measure
            memory: redisHealth.status === 'healthy' ? await this.getRedisMemory() : undefined
          },
          kafka: {
            connected: kafkaHealth.status === 'healthy',
            metrics: kafkaHealth.metrics
          },
          rateLimiter: {
            connected: rateLimiterHealth.status === 'healthy'
          }
        },
        performance: {
          requestCount: this.requestCount,
          averageResponseTime,
          errorRate,
          throughput
        }
      };

      // Store metrics (keep only last 100 entries)
      this.metrics.push(metrics);
      if (this.metrics.length > 100) {
        this.metrics = this.metrics.slice(-100);
      }

      // Publish metrics to Kafka
      await this.publishMetrics(metrics);

    } catch (error) {
      console.error('❌ Error collecting metrics:', error);
    }
  }

  private async getCpuUsage(): Promise<number> {
    return new Promise((resolve) => {
      const startUsage = process.cpuUsage();
      const startTime = Date.now();

      setTimeout(() => {
        const endUsage = process.cpuUsage(startUsage);
        const endTime = Date.now();
        
        const userTime = endUsage.user / 1000000; // Convert to seconds
        const systemTime = endUsage.system / 1000000;
        const totalTime = userTime + systemTime;
        const elapsedTime = (endTime - startTime) / 1000;
        
        const cpuUsage = (totalTime / elapsedTime) * 100;
        resolve(Math.min(100, Math.max(0, cpuUsage)));
      }, 100);
    });
  }

  private getLoadAverage(): number[] {
    try {
      const os = require('os');
      return os.loadavg();
    } catch {
      return [0, 0, 0];
    }
  }

  private async getRedisMemory(): Promise<any> {
    try {
      const stats = await redisClusterService.getStats();
      return stats.memory;
    } catch {
      return null;
    }
  }

  private async publishMetrics(metrics: SystemMetrics): Promise<void> {
    try {
      await kafkaClusterService.publishEvent('system-metrics', {
        type: 'system_metrics',
        data: metrics,
        timestamp: metrics.timestamp,
        metadata: {
          instanceId: metrics.instanceId,
          version: process.env.npm_package_version || '1.0.0'
        }
      });
    } catch (error) {
      console.error('❌ Failed to publish metrics:', error);
    }
  }

  private async checkAlerts(): Promise<void> {
    if (this.metrics.length === 0) return;

    const latestMetrics = this.metrics[this.metrics.length - 1];
    const now = Date.now();

    for (const [alertName, alertData] of this.alerts) {
      const { config, lastTriggered } = alertData;

      // Check cooldown
      if (now - lastTriggered < config.cooldown) {
        continue;
      }

      // Check condition
      if (config.condition(latestMetrics)) {
        await this.triggerAlert(alertName, config, latestMetrics);
        alertData.lastTriggered = now;
      }
    }
  }

  private async triggerAlert(alertName: string, config: AlertConfig, metrics: SystemMetrics): Promise<void> {
    try {
      const alert = {
        name: alertName,
        severity: config.severity,
        message: config.message,
        timestamp: Date.now(),
        metrics: {
          memory: metrics.memory.percentage,
          cpu: metrics.cpu.usage,
          errorRate: metrics.performance.errorRate,
          throughput: metrics.performance.throughput
        },
        instanceId: metrics.instanceId
      };

      // Publish alert to Kafka
      await kafkaClusterService.publishEvent('system-alerts', {
        type: 'alert',
        data: alert,
        timestamp: alert.timestamp,
        metadata: {
          alertName,
          severity: config.severity,
          instanceId: metrics.instanceId
        }
      });

      console.log(`🚨 Alert triggered: ${alertName} - ${config.message}`);
    } catch (error) {
      console.error('❌ Failed to trigger alert:', error);
    }
  }

  // Public methods for tracking requests
  recordRequest(responseTime: number, isError: boolean = false): void {
    this.requestCount++;
    this.responseTimes.push(responseTime);
    
    // Keep only last 1000 response times
    if (this.responseTimes.length > 1000) {
      this.responseTimes = this.responseTimes.slice(-1000);
    }

    if (isError) {
      this.errorCount++;
    }
  }

  // Get current metrics
  getCurrentMetrics(): SystemMetrics | null {
    return this.metrics.length > 0 ? this.metrics[this.metrics.length - 1] : null;
  }

  // Get metrics history
  getMetricsHistory(limit: number = 50): SystemMetrics[] {
    return this.metrics.slice(-limit);
  }

  // Get alerts status
  getAlertsStatus(): Record<string, { config: AlertConfig; lastTriggered: number }> {
    const status: Record<string, { config: AlertConfig; lastTriggered: number }> = {};
    
    for (const [name, data] of this.alerts) {
      status[name] = {
        config: data.config,
        lastTriggered: data.lastTriggered
      };
    }

    return status;
  }

  // Health check endpoint
  async getHealthStatus(): Promise<{
    status: 'healthy' | 'degraded' | 'unhealthy';
    services: Record<string, any>;
    metrics: SystemMetrics | null;
    alerts: number;
  }> {
    const currentMetrics = this.getCurrentMetrics();
    const alertsStatus = this.getAlertsStatus();
    
    // Count active alerts
    const activeAlerts = Object.values(alertsStatus).filter(
      alert => Date.now() - alert.lastTriggered < alert.config.cooldown
    ).length;

    // Determine overall status
    let status: 'healthy' | 'degraded' | 'unhealthy' = 'healthy';
    
    if (currentMetrics) {
      const criticalIssues = [
        !currentMetrics.services.redis.connected,
        !currentMetrics.services.kafka.connected,
        currentMetrics.memory.percentage > 95,
        currentMetrics.cpu.usage > 95
      ].filter(Boolean).length;

      if (criticalIssues > 0) {
        status = 'unhealthy';
      } else if (activeAlerts > 0 || currentMetrics.memory.percentage > 80 || currentMetrics.cpu.usage > 80) {
        status = 'degraded';
      }
    }

    return {
      status,
      services: {
        redis: currentMetrics?.services.redis || { connected: false },
        kafka: currentMetrics?.services.kafka || { connected: false },
        rateLimiter: currentMetrics?.services.rateLimiter || { connected: false }
      },
      metrics: currentMetrics,
      alerts: activeAlerts
    };
  }
}

// Singleton instance
export const monitoringService = new MonitoringService();
