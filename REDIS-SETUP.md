# Redis Configuration Guide

This document explains how to configure Redis for the AccountantAI application in different environments.

## 🔧 Environment Variables

### Basic Configuration (Development)
```bash
# Local Redis instance
REDIS_URL=redis://localhost:6379
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=your_password_here
REDIS_DB=0
ENABLE_REDIS=true
```

### Production Configuration Options

#### 1. Redis Cloud (recommended for production)
```bash
# Redis Cloud connection
REDIS_URL=rediss://default:your_password@redis-12345.cloud.redislabs.com:12345
REDIS_TLS=true
REDIS_PASSWORD=your_redis_cloud_password
ENABLE_REDIS=true
```

#### 2. AWS ElastiCache
```bash
# AWS ElastiCache with TLS
REDIS_URL=rediss://username:password@your-cluster.cache.amazonaws.com:6380
REDIS_HOST=your-cluster.cache.amazonaws.com
REDIS_PORT=6380
REDIS_TLS=true
REDIS_PASSWORD=your_elasticache_auth_token
ENABLE_REDIS=true
```

#### 3. Azure Cache for Redis
```bash
# Azure Redis Cache
REDIS_URL=rediss://your-cache-name.redis.cache.windows.net:6380
REDIS_HOST=your-cache-name.redis.cache.windows.net
REDIS_PORT=6380
REDIS_PASSWORD=your_azure_redis_key
REDIS_TLS=true
ENABLE_REDIS=true
```

#### 4. Google Cloud Memorystore
```bash
# Google Cloud Memorystore
REDIS_HOST=your-memorystore-ip
REDIS_PORT=6379
REDIS_PASSWORD=your_memorystore_password
REDIS_TLS=false  # Usually no TLS for internal GCP networks
ENABLE_REDIS=true
```

## 🔒 Authentication Requirements

### Username & Password
- **Username**: Required for Redis 6.0+ with ACL (Access Control Lists)
  - Default username is usually `default`
  - Some providers use custom usernames
- **Password**: Required for most production Redis instances
  - Can be set via `REDIS_PASSWORD` or included in `REDIS_URL`

### Example Configurations

#### Redis Cloud
```bash
REDIS_USERNAME=default
REDIS_PASSWORD=your_very_secure_password_123
REDIS_URL=rediss://default:your_very_secure_password_123@redis-12345.cloud.redislabs.com:12345
```

#### AWS ElastiCache with Auth Token
```bash
REDIS_USERNAME=default
REDIS_PASSWORD=your_elasticache_auth_token
REDIS_TLS=true
```

## 🚀 Production Deployment Checklist

### Required for Production:
- ✅ **REDIS_PASSWORD**: Always set a strong password
- ✅ **REDIS_TLS=true**: Enable TLS encryption for data in transit
- ✅ **REDIS_URL**: Use the full connection string from your provider
- ✅ **ENABLE_REDIS=true**: Enable Redis caching features

### Optional but Recommended:
- ⚙️ **REDIS_MAX_RETRIES=5**: Increase for production reliability
- ⚙️ **REDIS_CONNECT_TIMEOUT=15000**: Higher timeout for production
- ⚙️ **REDIS_KEEP_ALIVE=60000**: Longer keep-alive for stable connections

## 🛠️ Provider-Specific Setup

### Redis Cloud Setup
1. Create account at https://redis.com/
2. Create a new database
3. Copy the connection details:
   ```bash
   REDIS_URL=rediss://default:password@endpoint:port
   REDIS_TLS=true
   ```

### AWS ElastiCache Setup
1. Create ElastiCache Redis cluster
2. Enable encryption in transit
3. Set up authentication token
4. Use cluster endpoint:
   ```bash
   REDIS_HOST=your-cluster.cache.amazonaws.com
   REDIS_PORT=6380
   REDIS_PASSWORD=your_auth_token
   REDIS_TLS=true
   ```

### Local Development with Docker
```bash
# Run Redis with password
docker run -d --name redis-dev -p 6379:6379 redis:7-alpine redis-server --requirepass "your_dev_password"

# Environment variables
REDIS_URL=redis://localhost:6379
REDIS_PASSWORD=your_dev_password
```

## 🔍 Connection Testing

The application will log Redis connection status:
- ✅ `Redis connected successfully` - Working correctly
- ❌ `Redis connection error` - Check credentials and network
- ⚠️ `Redis disabled via environment variable` - ENABLE_REDIS=false

## 🚨 Common Issues & Solutions

### Issue: "Connection refused"
**Solution**: Check if Redis server is running and accessible
```bash
# Test connection manually
redis-cli -h your_host -p your_port -a your_password ping
```

### Issue: "Authentication failed"
**Solution**: Verify username/password combination
```bash
REDIS_USERNAME=default
REDIS_PASSWORD=correct_password
```

### Issue: "TLS connection failed"
**Solution**: Ensure TLS is properly configured
```bash
REDIS_TLS=true
REDIS_URL=rediss://... # Note the 'rediss' (with double s) for TLS
```

## 📊 Performance Optimization

### High-Load Configuration (600-800 users)
```bash
REDIS_MAX_RETRIES=5
REDIS_RETRY_DELAY=2000
REDIS_CONNECT_TIMEOUT=15000
REDIS_COMMAND_TIMEOUT=10000
REDIS_KEEP_ALIVE=60000
```

### Memory Management
```bash
# Use appropriate Redis database numbers for different data types
REDIS_DB=0  # Session data
# You can use different DBs for different purposes in your application
```

---

**Need help?** Check the Redis service logs in your application console for detailed connection information.