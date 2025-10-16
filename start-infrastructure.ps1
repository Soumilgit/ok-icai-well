# PowerShell script to start infrastructure services

Write-Host "🚀 Starting Infrastructure Services" -ForegroundColor Green
Write-Host "==================================" -ForegroundColor Green

# Check if Docker is running
try {
    docker info | Out-Null
    Write-Host "✅ Docker is running" -ForegroundColor Green
} catch {
    Write-Host "❌ Docker is not running. Please start Docker first." -ForegroundColor Red
    exit 1
}

# Check if Docker Compose is available
try {
    docker-compose --version | Out-Null
    Write-Host "✅ Docker Compose is available" -ForegroundColor Green
} catch {
    Write-Host "❌ Docker Compose is not installed. Please install Docker Compose first." -ForegroundColor Red
    exit 1
}

# Stop any existing containers
Write-Host "🛑 Stopping existing containers..." -ForegroundColor Yellow
docker-compose -f docker-compose.infrastructure.yml down

# Start infrastructure services
Write-Host "🔧 Starting Zookeeper, Kafka, and Redis..." -ForegroundColor Yellow
docker-compose -f docker-compose.infrastructure.yml up -d

# Wait for services to be ready
Write-Host "⏳ Waiting for services to be ready..." -ForegroundColor Yellow
Start-Sleep -Seconds 10

# Check service health
Write-Host "🔍 Checking service health..." -ForegroundColor Yellow

# Check Redis
try {
    docker exec redis redis-cli ping | Out-Null
    Write-Host "✅ Redis is ready" -ForegroundColor Green
} catch {
    Write-Host "⚠️  Redis is starting up..." -ForegroundColor Yellow
}

# Check Kafka
try {
    docker exec kafka kafka-broker-api-versions --bootstrap-server localhost:9092 | Out-Null
    Write-Host "✅ Kafka is ready" -ForegroundColor Green
} catch {
    Write-Host "⚠️  Kafka is starting up..." -ForegroundColor Yellow
}

# Show service URLs
Write-Host ""
Write-Host "🎉 Infrastructure Services Started!" -ForegroundColor Green
Write-Host "==================================" -ForegroundColor Green
Write-Host "📊 Kafka UI: http://localhost:8080" -ForegroundColor Cyan
Write-Host "📊 Redis Commander: http://localhost:8081" -ForegroundColor Cyan
Write-Host "🔌 Kafka Broker: localhost:9092" -ForegroundColor Cyan
Write-Host "🔌 Redis: localhost:6379" -ForegroundColor Cyan
Write-Host ""
Write-Host "To stop services: docker-compose -f docker-compose.infrastructure.yml down" -ForegroundColor Gray
Write-Host "To view logs: docker-compose -f docker-compose.infrastructure.yml logs -f" -ForegroundColor Gray
