@echo off
echo ========================================
echo    AccountantAI - Full Automation
echo ========================================
echo.
echo This will start:
echo 1. Next.js Development Server (Port 3000)
echo 2. Automated Cron Scheduler
echo.
echo Press Ctrl+C to stop any process
echo ========================================
echo.

echo Starting Next.js server...
start "AccountantAI Server" cmd /k "cd /d %~dp0 && npm run dev"

echo Waiting 10 seconds for server to start...
timeout /t 10 /nobreak > nul

echo Starting automation scheduler...
start "AccountantAI Automation" cmd /k "cd /d %~dp0 && node automation-scheduler.js"

echo.
echo ✅ Both terminals started!
echo.
echo 📋 What's running:
echo   - Terminal 1: Next.js Server (http://localhost:3000)
echo   - Terminal 2: Automation Scheduler with cron jobs
echo.
echo 💡 In the automation terminal, type:
echo   - 'news' to run news collection
echo   - 'content' to generate content  
echo   - 'exam' to generate exam questions
echo   - 'full' to run complete pipeline
echo   - 'help' for all commands
echo.
pause