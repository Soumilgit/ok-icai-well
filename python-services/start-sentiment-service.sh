#!/bin/bash

# Bash script to start sentiment analysis service
# Run this script to launch the FastAPI sentiment API

echo "🚀 Starting CA Authority Sentiment Analysis Service..."
echo ""

# Check if Python is installed
if command -v python3 &> /dev/null; then
    PYTHON_VERSION=$(python3 --version)
    echo "✅ Python found: $PYTHON_VERSION"
else
    echo "❌ Python not found. Please install Python 3.8+ first."
    exit 1
fi

# Check if requirements are installed
echo ""
echo "📦 Checking dependencies..."

if python3 -c "import fastapi" 2>/dev/null; then
    echo "✅ FastAPI installed"
else
    echo "❌ FastAPI not found. Installing dependencies..."
    pip3 install -r requirements.txt
fi

# Setup NLTK data if needed
echo ""
echo "📚 Setting up NLTK data..."
python3 setup_nltk.py

# Start the service
echo ""
echo "🔥 Launching Sentiment Analysis API on http://localhost:8000"
echo "   Press Ctrl+C to stop the service"
echo ""

python3 sentiment_api.py

