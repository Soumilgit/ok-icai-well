# PowerShell script to restore Kafka, Docker, and Redis infrastructure

Write-Host "🔧 Restoring Kafka, Docker, and Redis Infrastructure" -ForegroundColor Green
Write-Host "==================================================" -ForegroundColor Green

# Check if Docker is running
try {
    docker info | Out-Null
    Write-Host "✅ Docker is running" -ForegroundColor Green
} catch {
    Write-Host "❌ Docker is not running. Please start Docker first." -ForegroundColor Red
    exit 1
}

# Kill any processes using port 3000
Write-Host "📡 Step 1: Killing processes on port 3000..." -ForegroundColor Yellow
$processes = Get-NetTCPConnection -LocalPort 3000 -ErrorAction SilentlyContinue | Select-Object -ExpandProperty OwningProcess
if ($processes) {
    $processes | ForEach-Object { Stop-Process -Id $_ -Force -ErrorAction SilentlyContinue }
}

# Clean build cache
Write-Host "🧹 Step 2: Cleaning build cache..." -ForegroundColor Yellow
Remove-Item -Path .next -Recurse -Force -ErrorAction SilentlyContinue
Remove-Item -Path node_modules/.cache -Recurse -Force -ErrorAction SilentlyContinue
Remove-Item -Path .turbo -Recurse -Force -ErrorAction SilentlyContinue

# Backup and use production config
Write-Host "⚙️  Step 3: Using production configuration..." -ForegroundColor Yellow
if (Test-Path "next.config.ts") {
    Copy-Item "next.config.ts" "next.config.backup.ts" -Force
    Write-Host "✅ Backed up current config to next.config.backup.ts" -ForegroundColor Green
}

if (Test-Path "next.config.production.ts") {
    Copy-Item "next.config.production.ts" "next.config.ts" -Force
    Write-Host "✅ Applied production configuration with external services enabled" -ForegroundColor Green
} else {
    Write-Host "❌ next.config.production.ts not found!" -ForegroundColor Red
    exit 1
}

# Start infrastructure services
Write-Host "🐳 Step 4: Starting Docker infrastructure services..." -ForegroundColor Yellow
docker-compose -f docker-compose.infrastructure.yml down
docker-compose -f docker-compose.infrastructure.yml up -d

# Wait for services to be ready
Write-Host "⏳ Step 5: Waiting for services to be ready..." -ForegroundColor Yellow
Start-Sleep -Seconds 15

# Check service health
Write-Host "🔍 Step 6: Checking service health..." -ForegroundColor Yellow

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

# Install dependencies
Write-Host "📦 Step 7: Installing dependencies..." -ForegroundColor Yellow
npm install

# Final instructions
Write-Host ""
Write-Host "🎉 Infrastructure Restored!" -ForegroundColor Green
Write-Host "==========================" -ForegroundColor Green
Write-Host ""
Write-Host "Services running:" -ForegroundColor Cyan
Write-Host "📊 Kafka UI: http://localhost:8080" -ForegroundColor Cyan
Write-Host "📊 Redis Commander: http://localhost:8081" -ForegroundColor Cyan
Write-Host "🔌 Kafka Broker: localhost:9092" -ForegroundColor Cyan
Write-Host "🔌 Redis: localhost:6379" -ForegroundColor Cyan
Write-Host ""
Write-Host "Now you can run:" -ForegroundColor White
Write-Host "  npm run dev" -ForegroundColor White
Write-Host ""
Write-Host "To stop infrastructure:" -ForegroundColor Gray
Write-Host "  docker-compose -f docker-compose.infrastructure.yml down" -ForegroundColor Gray
Write-Host ""
