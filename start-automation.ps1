# AccountantAI - Full Automation Startup Script
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "    AccountantAI - Full Automation" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "This will start:" -ForegroundColor Yellow
Write-Host "1. Next.js Development Server (Port 3000)" -ForegroundColor White
Write-Host "2. Automated Cron Scheduler with Web Scraping" -ForegroundColor White
Write-Host ""
Write-Host "Press Ctrl+C to stop any process" -ForegroundColor Red
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Get the script directory
$scriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path

Write-Host "Starting Next.js server..." -ForegroundColor Green
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$scriptDir'; npm run dev" -WindowStyle Normal

Write-Host "Waiting 10 seconds for server to start..." -ForegroundColor Yellow
Start-Sleep -Seconds 10

Write-Host "Starting automation scheduler..." -ForegroundColor Green  
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$scriptDir'; node automation-scheduler.js" -WindowStyle Normal

Write-Host ""
Write-Host "✅ Both terminals started!" -ForegroundColor Green
Write-Host ""
Write-Host "📋 What's running:" -ForegroundColor Cyan
Write-Host "  - Terminal 1: Next.js Server (http://localhost:3000)" -ForegroundColor White  
Write-Host "  - Terminal 2: Automation Scheduler with cron jobs" -ForegroundColor White
Write-Host ""
Write-Host "💡 In the automation terminal, type:" -ForegroundColor Yellow
Write-Host "  - 'news' to run news collection" -ForegroundColor White
Write-Host "  - 'content' to generate content" -ForegroundColor White  
Write-Host "  - 'exam' to generate exam questions" -ForegroundColor White
Write-Host "  - 'full' to run complete pipeline" -ForegroundColor White
Write-Host "  - 'help' for all commands" -ForegroundColor White
Write-Host ""
Write-Host "Dashboard: http://localhost:3000/dashboard" -ForegroundColor Magenta
Write-Host ""

Read-Host "Press Enter to close this window"