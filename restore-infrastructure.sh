#!/bin/bash

echo "🔧 Restoring Kafka, Docker, and Redis Infrastructure"
echo "=================================================="

# Check if Docker is running
if ! docker info > /dev/null 2>&1; then
    echo "❌ Docker is not running. Please start Docker first."
    exit 1
fi

# Kill any processes using port 3000
echo "📡 Step 1: Killing processes on port 3000..."
sudo lsof -ti:3000 | xargs sudo kill -9 2>/dev/null || true
sudo netstat -tlnp | grep :3000 | awk '{print $7}' | cut -d'/' -f1 | xargs sudo kill -9 2>/dev/null || true

# Clean build cache
echo "🧹 Step 2: Cleaning build cache..."
rm -rf .next
rm -rf node_modules/.cache
rm -rf .turbo

# Backup and use production config
echo "⚙️  Step 3: Using production configuration..."
if [ -f "next.config.ts" ]; then
    cp next.config.ts next.config.backup.ts
    echo "✅ Backed up current config to next.config.backup.ts"
fi

if [ -f "next.config.production.ts" ]; then
    cp next.config.production.ts next.config.ts
    echo "✅ Applied production configuration with external services enabled"
else
    echo "❌ next.config.production.ts not found!"
    exit 1
fi

# Start infrastructure services
echo "🐳 Step 4: Starting Docker infrastructure services..."
docker-compose -f docker-compose.infrastructure.yml down
docker-compose -f docker-compose.infrastructure.yml up -d

# Wait for services to be ready
echo "⏳ Step 5: Waiting for services to be ready..."
sleep 15

# Check service health
echo "🔍 Step 6: Checking service health..."

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

# Install dependencies
echo "📦 Step 7: Installing dependencies..."
npm install

# Final instructions
echo ""
echo "🎉 Infrastructure Restored!"
echo "=========================="
echo ""
echo "Services running:"
echo "📊 Kafka UI: http://localhost:8080"
echo "📊 Redis Commander: http://localhost:8081"
echo "🔌 Kafka Broker: localhost:9092"
echo "🔌 Redis: localhost:6379"
echo ""
echo "Now you can run:"
echo "  npm run dev"
echo ""
echo "To stop infrastructure:"
echo "  docker-compose -f docker-compose.infrastructure.yml down"
echo ""
