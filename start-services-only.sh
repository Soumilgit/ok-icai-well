#!/bin/bash

echo "🚀 Starting Only Infrastructure Services"
echo "======================================="

# Check if Docker is running
if ! docker info > /dev/null 2>&1; then
    echo "❌ Docker is not running. Please start Docker first."
    exit 1
fi

# Stop any existing containers
echo "🛑 Stopping existing containers..."
docker-compose -f docker-compose.infrastructure.yml down

# Start only infrastructure services
echo "🔧 Starting Zookeeper, Kafka, and Redis..."
docker-compose -f docker-compose.infrastructure.yml up -d

# Wait for services to be ready
echo "⏳ Waiting for services to be ready..."
sleep 10

# Check service health
echo "🔍 Checking service health..."

# Check Redis
if docker exec redis redis-cli ping > /dev/null 2>&1; then
    echo "✅ Redis is ready"
else
    echo "⚠️  Redis is starting up..."
fi

# Check Kafka
if docker exec kafka kafka-broker-api-versions --bootstrap-server localhost:9092 > /dev/null 2>&1; then
    echo "✅ Kafka is ready"
else
    echo "⚠️  Kafka is starting up..."
fi

# Show service URLs
echo ""
echo "🎉 Infrastructure Services Started!"
echo "=================================="
echo "📊 Kafka UI: http://localhost:8080"
echo "📊 Redis Commander: http://localhost:8081"
echo "🔌 Kafka Broker: localhost:9092"
echo "🔌 Redis: localhost:6379"
echo ""
echo "Now you can start your Next.js app with: npm run dev"
echo ""
echo "To stop services: docker-compose -f docker-compose.infrastructure.yml down"
echo "To view logs: docker-compose -f docker-compose.infrastructure.yml logs -f"
