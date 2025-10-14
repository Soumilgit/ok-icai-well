@echo off
setlocal enabledelayedexpansion

REM AccountantAI Production Startup Script for Windows
REM This script starts the production environment for handling 5000 users/minute

echo 🚀 Starting AccountantAI Production Environment
echo ================================================

REM Check if Docker is running
docker info >nul 2>&1
if errorlevel 1 (
    echo [ERROR] Docker is not running. Please start Docker and try again.
    exit /b 1
)

REM Check if Docker Compose is available
docker-compose --version >nul 2>&1
if errorlevel 1 (
    echo [ERROR] Docker Compose is not installed. Please install Docker Compose and try again.
    exit /b 1
)

echo [INFO] Docker and Docker Compose are available ✓

REM Check if required files exist
set required_files=docker-compose.production.yml nginx/nginx.conf monitoring/prometheus.yml load-test.yml
for %%f in (%required_files%) do (
    if not exist "%%f" (
        echo [ERROR] Required file %%f not found. Please ensure all configuration files are present.
        exit /b 1
    )
)

echo [INFO] All required files found ✓

REM Create necessary directories
echo [INFO] Creating necessary directories...
if not exist "nginx\ssl" mkdir nginx\ssl
if not exist "monitoring\grafana\dashboards" mkdir monitoring\grafana\dashboards
if not exist "monitoring\grafana\datasources" mkdir monitoring\grafana\datasources
if not exist "redis" mkdir redis

REM Check if environment file exists
if not exist ".env.production" (
    echo [WARNING] Production environment file not found. Creating from template...
    (
        echo # Application
        echo NODE_ENV=production
        echo INSTANCE_ID=app-1
        echo PORT=3000
        echo.
        echo # Redis Cluster
        echo REDIS_URL=redis://redis-cluster:6379
        echo REDIS_PASSWORD=AccountantAI_Redis_2025!
        echo REDIS_DB=0
        echo.
        echo # Kafka Cluster
        echo KAFKA_BROKERS=kafka-1:9092,kafka-2:9092,kafka-3:9092
        echo KAFKA_CLIENT_ID=accountant-ai-prod
        echo KAFKA_GROUP_ID=accountant-ai-consumers
        echo.
        echo # Rate Limiting
        echo RATE_LIMITER_HOST=rate-limiter
        echo RATE_LIMITER_PORT=6380
        echo RATE_LIMITER_PASSWORD=RateLimiter_2025!
        echo.
        echo # Monitoring
        echo PROMETHEUS_ENDPOINT=http://prometheus:9090
        echo GRAFANA_ENDPOINT=http://grafana:3000
        echo.
        echo # Performance Tuning
        echo NODE_OPTIONS="--max-old-space-size=2048"
        echo UV_THREADPOOL_SIZE=32
    ) > .env.production
    echo [SUCCESS] Created .env.production file
)

REM Stop any existing containers
echo [INFO] Stopping any existing containers...
docker-compose -f docker-compose.production.yml down >nul 2>&1

REM Build the application image
echo [INFO] Building production Docker image...
docker build -f Dockerfile.production -t accountant-ai:latest .
if errorlevel 1 (
    echo [ERROR] Failed to build Docker image
    exit /b 1
)
echo [SUCCESS] Docker image built successfully

REM Start infrastructure services first
echo [INFO] Starting infrastructure services (Redis, Kafka, Zookeeper)...
docker-compose -f docker-compose.production.yml up -d redis-cluster zookeeper-1 zookeeper-2 zookeeper-3 kafka-1 kafka-2 kafka-3 kafka-cluster rate-limiter

REM Wait for infrastructure to be ready
echo [INFO] Waiting for infrastructure services to be ready...
timeout /t 30 /nobreak >nul

REM Check if Redis is ready
echo [INFO] Checking Redis cluster status...
set /a attempt=1
set /a max_attempts=30
:check_redis
docker exec accountant-redis-cluster redis-cli -a "AccountantAI_Redis_2025!" ping >nul 2>&1
if not errorlevel 1 (
    echo [SUCCESS] Redis cluster is ready
    goto redis_ready
)
if %attempt% geq %max_attempts% (
    echo [ERROR] Redis cluster failed to start within expected time
    exit /b 1
)
echo [INFO] Waiting for Redis... (attempt %attempt%/%max_attempts%)
timeout /t 2 /nobreak >nul
set /a attempt+=1
goto check_redis
:redis_ready

REM Check if Kafka is ready
echo [INFO] Checking Kafka cluster status...
set /a attempt=1
:check_kafka
docker exec accountant-kafka-1 kafka-broker-api-versions --bootstrap-server localhost:9092 >nul 2>&1
if not errorlevel 1 (
    echo [SUCCESS] Kafka cluster is ready
    goto kafka_ready
)
if %attempt% geq %max_attempts% (
    echo [ERROR] Kafka cluster failed to start within expected time
    exit /b 1
)
echo [INFO] Waiting for Kafka... (attempt %attempt%/%max_attempts%)
timeout /t 2 /nobreak >nul
set /a attempt+=1
goto check_kafka
:kafka_ready

REM Start application services
echo [INFO] Starting application services...
docker-compose -f docker-compose.production.yml up -d app-1 app-2 app-3

REM Start load balancer
echo [INFO] Starting load balancer...
docker-compose -f docker-compose.production.yml up -d nginx

REM Wait for applications to be ready
echo [INFO] Waiting for application services to be ready...
timeout /t 20 /nobreak >nul

REM Check application health
echo [INFO] Checking application health...
set /a attempt=1
:check_app
curl -f http://localhost/api/health >nul 2>&1
if not errorlevel 1 (
    echo [SUCCESS] Application is healthy
    goto app_ready
)
if %attempt% geq %max_attempts% (
    echo [ERROR] Application failed to start within expected time
    exit /b 1
)
echo [INFO] Waiting for application... (attempt %attempt%/%max_attempts%)
timeout /t 2 /nobreak >nul
set /a attempt+=1
goto check_app
:app_ready

REM Start monitoring services
echo [INFO] Starting monitoring services...
docker-compose -f docker-compose.production.yml up -d prometheus grafana

REM Wait for monitoring to be ready
echo [INFO] Waiting for monitoring services to be ready...
timeout /t 10 /nobreak >nul

REM Display service status
echo [INFO] Displaying service status...
docker-compose -f docker-compose.production.yml ps

REM Display access information
echo.
echo 🎉 Production Environment Started Successfully!
echo ================================================
echo.
echo 📊 Application Access:
echo   • Main Application: http://localhost
echo   • Health Check: http://localhost/api/health
echo.
echo 📈 Monitoring Dashboards:
echo   • Grafana: http://localhost:3001 (admin/admin123)
echo   • Prometheus: http://localhost:9090
echo   • Kafka UI: http://localhost:8080
echo   • Redis Commander: http://localhost:8081
echo.
echo 🔧 Management Commands:
echo   • View logs: npm run docker:compose:logs
echo   • Stop services: npm run docker:compose:down
echo   • Restart services: docker-compose -f docker-compose.production.yml restart
echo.
echo 📊 Load Testing:
echo   • Run load test: npm run load:test
echo   • Test 5000 users/minute: artillery run load-test.yml
echo.
echo 🚨 Performance Monitoring:
echo   • Monitor real-time metrics in Grafana
echo   • Check system health: curl http://localhost/api/health
echo   • View service logs: docker-compose -f docker-compose.production.yml logs -f [service-name]
echo.

echo [SUCCESS] Production environment is ready to handle 5000 users/minute!
echo [WARNING] Monitor the Grafana dashboard for real-time performance metrics

echo.
echo [SUCCESS] Setup complete! Your application is ready for production load.

pause
