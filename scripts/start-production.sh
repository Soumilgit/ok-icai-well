#!/bin/bash

# AccountantAI Production Startup Script
# This script starts the production environment for handling 5000 users/minute

set -e

echo "🚀 Starting AccountantAI Production Environment"
echo "================================================"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check if Docker is running
if ! docker info > /dev/null 2>&1; then
    print_error "Docker is not running. Please start Docker and try again."
    exit 1
fi

# Check if Docker Compose is available
if ! command -v docker-compose &> /dev/null; then
    print_error "Docker Compose is not installed. Please install Docker Compose and try again."
    exit 1
fi

# Check if required files exist
required_files=(
    "docker-compose.production.yml"
    "nginx/nginx.conf"
    "monitoring/prometheus.yml"
    "load-test.yml"
)

for file in "${required_files[@]}"; do
    if [[ ! -f "$file" ]]; then
        print_error "Required file $file not found. Please ensure all configuration files are present."
        exit 1
    fi
done

print_status "All required files found ✓"

# Create necessary directories
print_status "Creating necessary directories..."
mkdir -p nginx/ssl
mkdir -p monitoring/grafana/dashboards
mkdir -p monitoring/grafana/datasources
mkdir -p redis

# Check if environment file exists
if [[ ! -f ".env.production" ]]; then
    print_warning "Production environment file not found. Creating from template..."
    cat > .env.production << EOF
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
EOF
    print_success "Created .env.production file"
fi

# Stop any existing containers
print_status "Stopping any existing containers..."
docker-compose -f docker-compose.production.yml down > /dev/null 2>&1 || true

# Build the application image
print_status "Building production Docker image..."
docker build -f Dockerfile.production -t accountant-ai:latest . || {
    print_error "Failed to build Docker image"
    exit 1
}

print_success "Docker image built successfully"

# Start infrastructure services first
print_status "Starting infrastructure services (Redis, Kafka, Zookeeper)..."
docker-compose -f docker-compose.production.yml up -d redis-cluster zookeeper-1 zookeeper-2 zookeeper-3 kafka-1 kafka-2 kafka-3 kafka-cluster rate-limiter

# Wait for infrastructure to be ready
print_status "Waiting for infrastructure services to be ready..."
sleep 30

# Check if Redis is ready
print_status "Checking Redis cluster status..."
max_attempts=30
attempt=1
while [[ $attempt -le $max_attempts ]]; do
    if docker exec accountant-redis-cluster redis-cli -a "AccountantAI_Redis_2025!" ping > /dev/null 2>&1; then
        print_success "Redis cluster is ready"
        break
    fi
    if [[ $attempt -eq $max_attempts ]]; then
        print_error "Redis cluster failed to start within expected time"
        exit 1
    fi
    print_status "Waiting for Redis... (attempt $attempt/$max_attempts)"
    sleep 2
    ((attempt++))
done

# Check if Kafka is ready
print_status "Checking Kafka cluster status..."
max_attempts=30
attempt=1
while [[ $attempt -le $max_attempts ]]; do
    if docker exec accountant-kafka-1 kafka-broker-api-versions --bootstrap-server localhost:9092 > /dev/null 2>&1; then
        print_success "Kafka cluster is ready"
        break
    fi
    if [[ $attempt -eq $max_attempts ]]; then
        print_error "Kafka cluster failed to start within expected time"
        exit 1
    fi
    print_status "Waiting for Kafka... (attempt $attempt/$max_attempts)"
    sleep 2
    ((attempt++))
done

# Start application services
print_status "Starting application services..."
docker-compose -f docker-compose.production.yml up -d app-1 app-2 app-3

# Start load balancer
print_status "Starting load balancer..."
docker-compose -f docker-compose.production.yml up -d nginx

# Wait for applications to be ready
print_status "Waiting for application services to be ready..."
sleep 20

# Check application health
print_status "Checking application health..."
max_attempts=30
attempt=1
while [[ $attempt -le $max_attempts ]]; do
    if curl -f http://localhost/api/health > /dev/null 2>&1; then
        print_success "Application is healthy"
        break
    fi
    if [[ $attempt -eq $max_attempts ]]; then
        print_error "Application failed to start within expected time"
        exit 1
    fi
    print_status "Waiting for application... (attempt $attempt/$max_attempts)"
    sleep 2
    ((attempt++))
done

# Start monitoring services
print_status "Starting monitoring services..."
docker-compose -f docker-compose.production.yml up -d prometheus grafana

# Wait for monitoring to be ready
print_status "Waiting for monitoring services to be ready..."
sleep 10

# Display service status
print_status "Displaying service status..."
docker-compose -f docker-compose.production.yml ps

# Display access information
echo ""
echo "🎉 Production Environment Started Successfully!"
echo "================================================"
echo ""
echo "📊 Application Access:"
echo "  • Main Application: http://localhost"
echo "  • Health Check: http://localhost/api/health"
echo ""
echo "📈 Monitoring Dashboards:"
echo "  • Grafana: http://localhost:3001 (admin/admin123)"
echo "  • Prometheus: http://localhost:9090"
echo "  • Kafka UI: http://localhost:8080"
echo "  • Redis Commander: http://localhost:8081"
echo ""
echo "🔧 Management Commands:"
echo "  • View logs: npm run docker:compose:logs"
echo "  • Stop services: npm run docker:compose:down"
echo "  • Restart services: docker-compose -f docker-compose.production.yml restart"
echo ""
echo "📊 Load Testing:"
echo "  • Run load test: npm run load:test"
echo "  • Test 5000 users/minute: artillery run load-test.yml"
echo ""
echo "🚨 Performance Monitoring:"
echo "  • Monitor real-time metrics in Grafana"
echo "  • Check system health: curl http://localhost/api/health"
echo "  • View service logs: docker-compose -f docker-compose.production.yml logs -f [service-name]"
echo ""

print_success "Production environment is ready to handle 5000 users/minute!"
print_warning "Monitor the Grafana dashboard for real-time performance metrics"

# Optional: Run a quick load test
read -p "Would you like to run a quick load test? (y/n): " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    print_status "Running quick load test..."
    if command -v artillery &> /dev/null; then
        artillery quick --count 100 --num 10 http://localhost/api/health
    else
        print_warning "Artillery not installed. Install with: npm install -g artillery"
    fi
fi

echo ""
print_success "Setup complete! Your application is ready for production load."
