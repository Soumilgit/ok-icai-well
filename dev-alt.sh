#!/bin/bash

echo "🚀 Alternative Development Server"
echo "================================="

# Kill any processes on port 3000
echo "📡 Killing processes on port 3000..."
sudo lsof -ti:3000 | xargs sudo kill -9 2>/dev/null || true

# Clean cache
echo "🧹 Cleaning cache..."
rm -rf .next

# Try different approaches
echo "🔧 Trying different server configurations..."

echo ""
echo "Option 1: Standard Next.js dev server"
echo "====================================="
echo "Starting: next dev --port 3000"
echo "If this doesn't work, try Option 2"
echo ""

# Start with standard configuration
next dev --port 3000
