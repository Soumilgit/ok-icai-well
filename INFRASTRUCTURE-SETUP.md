# Infrastructure Setup Guide for Redis & Kafka

This guide will help you set up Redis and Apache Kafka for your AccountantAI application to support 600-800 concurrent users.

## Quick Start (Development)

For development, you can use Docker to quickly spin up Redis and Kafka:

### Prerequisites
- Docker Desktop installed
- Node.js 18+ installed
- Your existing AccountantAI application running

### 1. Create Docker Compose File

Create `docker-compose.yml` in your project root:

```yaml
version: '3.8'

services:
  # Redis for caching and session management
  redis:
    image: redis:7-alpine
    container_name: accountant-redis
    ports:
      - "6379:6379"
    command: redis-server --appendonly yes --requirepass your_redis_password
    volumes:
      - redis_data:/data
    environment:
      - REDIS_PASSWORD=your_redis_password
    restart: unless-stopped

  # Zookeeper (required for Kafka)
  zookeeper:
    image: confluentinc/cp-zookeeper:7.4.0
    container_name: accountant-zookeeper
    environment:
      ZOOKEEPER_CLIENT_PORT: 2181
      ZOOKEEPER_TICK_TIME: 2000
    volumes:
      - zookeeper_data:/var/lib/zookeeper/data
      - zookeeper_logs:/var/lib/zookeeper/log
    restart: unless-stopped

  # Kafka for event streaming
  kafka:
    image: confluentinc/cp-kafka:7.4.0
    container_name: accountant-kafka
    depends_on:
      - zookeeper
    ports:
      - "9092:9092"
      - "9094:9094"
    environment:
      KAFKA_BROKER_ID: 1
      KAFKA_ZOOKEEPER_CONNECT: zookeeper:2181
      KAFKA_LISTENER_SECURITY_PROTOCOL_MAP: PLAINTEXT:PLAINTEXT,PLAINTEXT_HOST:PLAINTEXT
      KAFKA_ADVERTISED_LISTENERS: PLAINTEXT://kafka:9093,PLAINTEXT_HOST://localhost:9092
      KAFKA_LISTENERS: PLAINTEXT://0.0.0.0:9093,PLAINTEXT_HOST://0.0.0.0:9092
      KAFKA_INTER_BROKER_LISTENER_NAME: PLAINTEXT
      KAFKA_OFFSETS_TOPIC_REPLICATION_FACTOR: 1
      KAFKA_TRANSACTION_STATE_LOG_MIN_ISR: 1
      KAFKA_TRANSACTION_STATE_LOG_REPLICATION_FACTOR: 1
      KAFKA_AUTO_CREATE_TOPICS_ENABLE: 'true'
    volumes:
      - kafka_data:/var/lib/kafka/data
    restart: unless-stopped

  # Kafka UI for monitoring (optional)
  kafka-ui:
    image: provectuslabs/kafka-ui:latest
    container_name: accountant-kafka-ui
    depends_on:
      - kafka
    ports:
      - "8080:8080"
    environment:
      KAFKA_CLUSTERS_0_NAME: local
      KAFKA_CLUSTERS_0_BOOTSTRAPSERVERS: kafka:9093
    restart: unless-stopped

  # Redis Commander for Redis management (optional)
  redis-commander:
    image: rediscommander/redis-commander:latest
    container_name: accountant-redis-ui
    depends_on:
      - redis
    ports:
      - "8081:8081"
    environment:
      - REDIS_HOSTS=local:redis:6379:0:your_redis_password
    restart: unless-stopped

volumes:
  redis_data:
  kafka_data:
  zookeeper_data:
  zookeeper_logs:
```

### 2. Start Infrastructure Services

```bash
# Start all services
docker-compose up -d

# Check if services are running
docker-compose ps

# View logs
docker-compose logs -f
```

### 3. Install New Dependencies

```bash
npm install ioredis kafkajs
```

### 4. Environment Configuration

Your `.env.local` file has been updated with the following variables. Verify these settings:

```env
# Redis Configuration
REDIS_URL=redis://localhost:6379
REDIS_PASSWORD=your_redis_password
REDIS_DB=0
REDIS_ENABLED=true

# Kafka Configuration
KAFKA_BROKERS=localhost:9092
KAFKA_CLIENT_ID=accountant-ai
KAFKA_USERNAME=
KAFKA_PASSWORD=
KAFKA_ENABLED=true

# Feature Flags
ENABLE_CACHING=true
ENABLE_EVENT_STREAMING=true
```

### 5. Test the Setup

1. **Start your Next.js application:**
   ```bash
   npm run dev
   ```

2. **Check health endpoint:**
   ```bash
   curl http://localhost:3000/api/health
   ```

3. **Access monitoring UIs:**
   - Kafka UI: http://localhost:8080
   - Redis Commander: http://localhost:8081

## Production Setup

### Cloud Providers

#### AWS
- **Redis**: Use Amazon ElastiCache for Redis
- **Kafka**: Use Amazon MSK (Managed Streaming for Apache Kafka)

#### Azure
- **Redis**: Use Azure Cache for Redis
- **Kafka**: Use Azure Event Hubs (Kafka-compatible)

#### Google Cloud
- **Redis**: Use Cloud Memorystore for Redis
- **Kafka**: Use Cloud Pub/Sub or Confluent Cloud

### Production Environment Variables

```env
# Redis (Production)
REDIS_URL=redis://your-redis-cluster:6379
REDIS_PASSWORD=your-secure-password
REDIS_DB=0
REDIS_ENABLED=true

# Kafka (Production)
KAFKA_BROKERS=your-kafka-broker1:9092,your-kafka-broker2:9092
KAFKA_CLIENT_ID=accountant-ai-prod
KAFKA_USERNAME=your-kafka-user
KAFKA_PASSWORD=your-kafka-password
KAFKA_ENABLED=true

# Security
KAFKA_SSL=true
KAFKA_SASL_MECHANISM=PLAIN
```

## Scaling Configuration

### For 600-800 Users

#### Redis Configuration
```yaml
# Redis memory and connection settings
maxmemory: 2gb
maxmemory-policy: allkeys-lru
maxclients: 1000
timeout: 300
```

#### Kafka Configuration
```yaml
# Kafka topic configurations
user-events:
  partitions: 6
  replication-factor: 3
  cleanup.policy: delete
  retention.ms: 604800000  # 7 days

content-events:
  partitions: 4
  replication-factor: 3
  cleanup.policy: delete
  retention.ms: 2592000000  # 30 days

news-events:
  partitions: 2
  replication-factor: 3
  cleanup.policy: delete
  retention.ms: 1209600000  # 14 days
```

## Monitoring and Alerts

### Health Checks
The application includes built-in health checks at `/api/health`:

```json
{
  "status": "healthy",
  "services": {
    "redis": { "status": "healthy", "connected": true, "latency": 2 },
    "kafka": { "status": "healthy", "connected": true }
  },
  "uptime": 3600,
  "memory": { "used": 45, "total": 128 }
}
```

### Recommended Monitoring
1. **Application Performance Monitoring (APM)**
   - Set up alerts for Redis/Kafka connection failures
   - Monitor API response times
   - Track cache hit rates

2. **Infrastructure Monitoring**
   - Redis memory usage
   - Kafka consumer lag
   - Network connectivity

## Troubleshooting

### Common Issues

1. **Redis Connection Failed**
   ```bash
   # Test Redis connection
   docker exec -it accountant-redis redis-cli -a your_redis_password ping
   ```

2. **Kafka Connection Failed**
   ```bash
   # Check Kafka topics
   docker exec -it accountant-kafka kafka-topics --bootstrap-server localhost:9092 --list
   ```

3. **Memory Issues**
   - Monitor Redis memory usage
   - Adjust cache TTL values
   - Implement cache eviction policies

### Fallback Behavior

The application is designed with graceful degradation:
- If Redis is unavailable, it falls back to in-memory caching
- If Kafka is unavailable, events are logged but not queued
- All existing functionality continues to work without infrastructure dependencies

## Next Steps

1. **Deploy to Production**: Choose your cloud provider and set up managed services
2. **Configure Monitoring**: Set up alerts and dashboards
3. **Load Testing**: Test with simulated 600-800 concurrent users
4. **Optimize**: Tune cache TTL values and Kafka partition strategies based on usage patterns

## Support

For issues specific to this setup:
1. Check the health endpoint: `/api/health`
2. Review Docker logs: `docker-compose logs`
3. Monitor application logs for infrastructure warnings