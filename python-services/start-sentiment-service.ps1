# PowerShell script to start sentiment analysis service
# Run this script to launch the FastAPI sentiment API

Write-Host "🚀 Starting CA Authority Sentiment Analysis Service..." -ForegroundColor Green
Write-Host ""

# Check if Python is installed
try {
    $pythonVersion = python --version 2>&1
    Write-Host "✅ Python found: $pythonVersion" -ForegroundColor Green
} catch {
    Write-Host "❌ Python not found. Please install Python 3.8+ first." -ForegroundColor Red
    exit 1
}

# Check if requirements are installed
Write-Host ""
Write-Host "📦 Checking dependencies..." -ForegroundColor Cyan

$pipList = pip list 2>&1
if ($pipList -match "fastapi") {
    Write-Host "✅ FastAPI installed" -ForegroundColor Green
} else {
    Write-Host "❌ FastAPI not found. Installing dependencies..." -ForegroundColor Yellow
    pip install -r requirements.txt
}

# Setup NLTK data if needed
Write-Host ""
Write-Host "📚 Checking NLTK data..." -ForegroundColor Cyan
python setup_nltk.py

# Start the service
Write-Host ""
Write-Host "🔥 Launching Sentiment Analysis API on http://localhost:8000" -ForegroundColor Magenta
Write-Host "   Press Ctrl+C to stop the service" -ForegroundColor Yellow
Write-Host ""

python sentiment_api.py

