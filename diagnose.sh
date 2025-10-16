#!/bin/bash

echo "🔍 Quick Diagnostic Check"
echo "========================"

# Check if we're in the right directory
echo "📁 Current directory: $(pwd)"
echo "📁 Directory contents:"
ls -la | head -10

# Check if package.json exists
if [ -f "package.json" ]; then
    echo "✅ package.json found"
    echo "📦 Project name: $(grep '"name"' package.json | cut -d'"' -f4)"
else
    echo "❌ package.json not found!"
    exit 1
fi

# Check Node.js
echo ""
echo "🔍 Node.js version: $(node --version)"
echo "🔍 npm version: $(npm --version)"

# Check port 3000
echo ""
echo "🔍 Checking port 3000..."
if netstat -tlnp 2>/dev/null | grep -q :3000; then
    echo "⚠️  Port 3000 is in use:"
    netstat -tlnp | grep :3000
else
    echo "✅ Port 3000 is free"
fi

# Check if .next directory exists
echo ""
echo "🔍 Checking build directory..."
if [ -d ".next" ]; then
    echo "📁 .next directory exists"
    echo "📁 .next contents:"
    ls -la .next/ | head -5
else
    echo "📁 No .next directory (this is normal for first run)"
fi

# Check if node_modules exists
echo ""
echo "🔍 Checking dependencies..."
if [ -d "node_modules" ]; then
    echo "✅ node_modules exists"
    echo "📦 Dependencies count: $(ls node_modules | wc -l)"
else
    echo "❌ node_modules not found! Run 'npm install' first"
fi

echo ""
echo "🚀 Ready to start server. Run: bash fix-connection.sh"
