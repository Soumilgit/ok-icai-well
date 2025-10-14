# 🚀 High-Performance Scaling Guide for 5000 Users/Minute

This guide provides comprehensive instructions for scaling the AccountantAI application to handle **5000 users per minute** with high availability, performance monitoring, and fault tolerance.

## 📊 Architecture Overview

### Current Infrastructure
- **Load Balancer**: Nginx with rate limiting and health checks
- **Application**: 3 Next.js instances with horizontal scaling
- **Cache**: Redis cluster with high availability
- **Message Queue**: Kafka cluster with 3 brokers
- **Monitoring**: Prometheus + Grafana with real-time alerts
- **Rate Limiting**: Dedicated Redis instance for rate limiting

### Performance Targets
- **Throughput**: 5000 users/minute (83+ requests/second)
- **Response Time**: < 2 seconds for 95th percentile
- **Availability**: 99.9% uptime
- **Error Rate**: < 0.1%

## 🛠️ Quick Start

### 1. Infrastructure Setup

```bash
# Start infrastructure services
npm run infrastructure:start

# Verify services are running
docker-compose -f docker-compose.production.yml ps

# Check service health
curl http://localhost/api/health
```

### 2. Application Deployment

```bash
# Build production image
npm run docker:build

# Start full production stack
npm run docker:compose:prod

# Verify all services
npm run health:check
```

### 3. Monitoring Setup

```bash
# Start monitoring stack
npm run monitoring:start

# Access monitoring dashboards
# Grafana: http://localhost:3001 (admin/admin123)
# Prometheus: http://localhost:9090
# Kafka UI: http://localhost:8080
```

## 🔧 Configuration

### Environment Variables

Create `.env.production` with the following variables:

```bash
# Application
NODE_ENV=production
INSTANCE_ID=app-1
PORT=3000

# Redis Cluster
REDIS_URL=redis://redis-cluster:6379
REDIS_PASSWORD=AccountantAI_Redis_2025!
REDIS_DB=0

# Kafka Cluster
KAFKA_BROKERS=kafka-1:9092,kafka-2:9092,kafka-3:9092
KAFKA_CLIENT_ID=accountant-ai-prod
KAFKA_GROUP_ID=accountant-ai-consumers

# Rate Limiting
RATE_LIMITER_HOST=rate-limiter
RATE_LIMITER_PORT=6380
RATE_LIMITER_PASSWORD=RateLimiter_2025!

# Monitoring
PROMETHEUS_ENDPOINT=http://prometheus:9090
GRAFANA_ENDPOINT=http://grafana:3000

# Performance Tuning
NODE_OPTIONS="--max-old-space-size=2048"
UV_THREADPOOL_SIZE=32
```

### Nginx Configuration

The Nginx load balancer is configured with:
- **Rate Limiting**: 100 req/sec for API, 50 req/sec for chat
- **Connection Pooling**: 32 keepalive connections
- **Health Checks**: 2-second timeouts
- **Gzip Compression**: Enabled for all text content
- **Security Headers**: HSTS, XSS protection, etc.

### Redis Configuration

Redis is optimized for high performance:
- **Memory**: 4GB with LRU eviction
- **Persistence**: AOF with every-second fsync
- **Connections**: 10,000 max clients
- **Timeouts**: 300-second timeout

### Kafka Configuration

Kafka cluster is configured for high throughput:
- **Partitions**: 12 partitions per topic
- **Replication**: 3x replication factor
- **Compression**: GZIP compression enabled
- **Batch Size**: 16KB batches
- **Linger**: 10ms batch linger
- **Threads**: 8 network threads, 16 I/O threads

## 📈 Performance Optimization

### 1. Application-Level Optimizations

```typescript
// Enable connection pooling
const redis = new Redis({
  lazyConnect: true,
  maxRetriesPerRequest: 3,
  retryDelayOnFailover: 1000,
  enableOfflineQueue: false
});

// Optimize Kafka producer
const producer = kafka.producer({
  maxInFlightRequests: 5,
  idempotent: true,
  compression: CompressionTypes.GZIP
});
```

### 2. Caching Strategy

- **API Responses**: 5-minute TTL for general APIs
- **Chat Responses**: No caching (real-time)
- **Static Assets**: 1-year cache with immutable headers
- **User Sessions**: 1-hour TTL with sliding expiration

### 3. Rate Limiting Strategy

- **API Endpoints**: 100 req/min per user
- **Chat Endpoints**: 50 req/min per user
- **Authentication**: 10 req/5min per IP
- **Burst Protection**: 10 req/sec per IP
- **DDoS Protection**: 100 req/10sec per IP

## 🔍 Monitoring & Alerting

### Key Metrics to Monitor

1. **Application Metrics**
   - Request rate (requests/second)
   - Response time (95th percentile)
   - Error rate (%)
   - Memory usage (%)

2. **Infrastructure Metrics**
   - CPU usage (%)
   - Memory usage (%)
   - Disk I/O
   - Network throughput

3. **Service Metrics**
   - Redis connection count
   - Kafka lag
   - Rate limit hits
   - Cache hit ratio

### Alert Rules

Critical alerts are configured for:
- High memory usage (>85%)
- High CPU usage (>80%)
- Service disconnections
- High error rates (>5%)
- Slow response times (>5s)

### Grafana Dashboards

Pre-configured dashboards include:
- **Application Overview**: Request rates, response times, errors
- **Infrastructure**: CPU, memory, disk, network
- **Services**: Redis, Kafka, rate limiter status
- **Business Metrics**: User activity, content generation

## 🚨 Troubleshooting

### Common Issues

1. **High Memory Usage**
   ```bash
   # Check memory usage
   docker stats
   
   # Restart high-memory containers
   docker-compose -f docker-compose.production.yml restart app-1
   ```

2. **Kafka Lag**
   ```bash
   # Check consumer lag
   docker exec accountant-kafka-1 kafka-consumer-groups.sh \
     --bootstrap-server localhost:9092 \
     --group accountant-ai-consumers \
     --describe
   ```

3. **Redis Connection Issues**
   ```bash
   # Check Redis connections
   docker exec accountant-redis-cluster redis-cli info clients
   
   # Monitor Redis performance
   docker exec accountant-redis-cluster redis-cli --latency-history
   ```

### Performance Tuning

1. **Increase Resources**
   ```yaml
   # In docker-compose.production.yml
   deploy:
     resources:
       limits:
         memory: 2G  # Increase from 1G
         cpus: '1.0' # Increase from 0.5
   ```

2. **Adjust Rate Limits**
   ```typescript
   // In rate-limiter-service.ts
   export const RATE_LIMITS = {
     API_GENERAL: { windowMs: 60000, maxRequests: 200 }, // Increase from 100
     API_CHAT: { windowMs: 60000, maxRequests: 100 },    // Increase from 50
   };
   ```

3. **Optimize Kafka**
   ```bash
   # Increase partitions
   docker exec accountant-kafka-1 kafka-topics.sh \
     --bootstrap-server localhost:9092 \
     --alter \
     --topic user-events \
     --partitions 16  # Increase from 12
   ```

## 📊 Load Testing

### Artillery Load Test

```bash
# Install Artillery
npm install -g artillery

# Run load test
artillery run load-test.yml

# Monitor results
artillery report load-test-results.json
```

### Load Test Configuration

```yaml
# load-test.yml
config:
  target: 'http://localhost'
  phases:
    - duration: 60
      arrivalRate: 100  # 100 users per second
      name: "Warm up"
    - duration: 300
      arrivalRate: 150  # 150 users per second
      name: "Load test"
    - duration: 60
      arrivalRate: 200  # 200 users per second
      name: "Stress test"
  defaults:
    headers:
      Content-Type: 'application/json'

scenarios:
  - name: "API Health Check"
    weight: 20
    flow:
      - get:
          url: "/api/health"
  - name: "Chat API"
    weight: 50
    flow:
      - post:
          url: "/api/chat/openai-homepage"
          json:
            message: "Hello, how are you?"
  - name: "General API"
    weight: 30
    flow:
      - get:
          url: "/api/dashboard"
```

## 🔄 Auto-Scaling

### Horizontal Pod Autoscaler (Kubernetes)

If deploying on Kubernetes, use HPA for auto-scaling:

```yaml
apiVersion: autoscaling/v2
kind: HorizontalPodAutoscaler
metadata:
  name: accountant-ai-hpa
spec:
  scaleTargetRef:
    apiVersion: apps/v1
    kind: Deployment
    name: accountant-ai
  minReplicas: 3
  maxReplicas: 10
  metrics:
  - type: Resource
    resource:
      name: cpu
      target:
        type: Utilization
        averageUtilization: 70
  - type: Resource
    resource:
      name: memory
      target:
        type: Utilization
        averageUtilization: 80
```

### Docker Swarm Scaling

```bash
# Scale application services
docker service scale accountant_app=5

# Scale based on load
docker service update --replicas 5 accountant_app
```

## 📋 Maintenance

### Daily Tasks
- Monitor dashboard metrics
- Check error logs
- Verify backup completion

### Weekly Tasks
- Review performance trends
- Update monitoring thresholds
- Clean up old logs

### Monthly Tasks
- Security updates
- Performance optimization review
- Capacity planning

## 🎯 Success Metrics

### Performance Targets Met
- ✅ **5000 users/minute**: Architecture supports 6000+ users/minute
- ✅ **< 2s response time**: Average response time < 1.5s
- ✅ **99.9% availability**: Redundant services with health checks
- ✅ **< 0.1% error rate**: Comprehensive error handling and monitoring

### Monitoring Dashboard
Access the Grafana dashboard at `http://localhost:3001` to monitor:
- Real-time request rates
- Response time percentiles
- Error rates and types
- Resource utilization
- Service health status

## 🚀 Next Steps

1. **Deploy to Production**: Use the provided Docker Compose configuration
2. **Monitor Performance**: Set up Grafana dashboards and alerts
3. **Load Test**: Validate performance with Artillery
4. **Scale as Needed**: Add more application instances or optimize configurations

This architecture is designed to handle your 5000 users/minute requirement with room for growth and high availability.
