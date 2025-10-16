#!/bin/bash

echo "🔍 Checking Infrastructure Services Health"
echo "========================================="

# Check Docker
if docker info > /dev/null 2>&1; then
    echo "✅ Docker is running"
else
    echo "❌ Docker is not running"
    exit 1
fi

# Check Redis
echo ""
echo "🔍 Checking Redis..."
if docker ps | grep -q redis; then
    if docker exec redis redis-cli ping > /dev/null 2>&1; then
        echo "✅ Redis is running and responding"
        docker exec redis redis-cli info server | grep redis_version
    else
        echo "⚠️  Redis container is running but not responding"
    fi
else
    echo "❌ Redis container is not running"
fi

# Check Kafka
echo ""
echo "🔍 Checking Kafka..."
if docker ps | grep -q kafka; then
    if docker exec kafka kafka-broker-api-versions --bootstrap-server localhost:9092 > /dev/null 2>&1; then
        echo "✅ Kafka is running and responding"
    else
        echo "⚠️  Kafka container is running but not responding"
    fi
else
    echo "❌ Kafka container is not running"
fi

# Check Zookeeper
echo ""
echo "🔍 Checking Zookeeper..."
if docker ps | grep -q zookeeper; then
    echo "✅ Zookeeper is running"
else
    echo "❌ Zookeeper container is not running"
fi

# Check ports
echo ""
echo "🔍 Checking ports..."
if netstat -tlnp 2>/dev/null | grep -q :6379; then
    echo "✅ Port 6379 (Redis) is open"
else
    echo "❌ Port 6379 (Redis) is not open"
fi

if netstat -tlnp 2>/dev/null | grep -q :9092; then
    echo "✅ Port 9092 (Kafka) is open"
else
    echo "❌ Port 9092 (Kafka) is not open"
fi

if netstat -tlnp 2>/dev/null | grep -q :2181; then
    echo "✅ Port 2181 (Zookeeper) is open"
else
    echo "❌ Port 2181 (Zookeeper) is not open"
fi

echo ""
echo "📊 Management UIs:"
echo "Kafka UI: http://localhost:8080"
echo "Redis Commander: http://localhost:8081"
