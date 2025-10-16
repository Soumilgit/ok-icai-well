#!/bin/bash

echo "🔍 Quick Server Status Check"
echo "============================"

# Check current directory
echo "📁 Directory: $(pwd)"
echo "📁 Has package.json: $([ -f package.json ] && echo '✅ Yes' || echo '❌ No')"

# Check Node.js
echo "🔧 Node.js: $(node --version)"
echo "🔧 npm: $(npm --version)"

# Check port 3000
echo ""
echo "🔍 Port 3000 Status:"
if netstat -tlnp 2>/dev/null | grep -q :3000; then
    echo "⚠️  Port 3000 is in use:"
    netstat -tlnp | grep :3000
else
    echo "✅ Port 3000 is free"
fi

# Check if server is running
echo ""
echo "🌐 Testing localhost:3000..."
if curl -s http://localhost:3000 > /dev/null 2>&1; then
    echo "✅ Server is responding on localhost:3000"
else
    echo "❌ Server is not responding on localhost:3000"
fi

# Check dependencies
echo ""
echo "📦 Dependencies:"
if [ -d "node_modules" ]; then
    echo "✅ node_modules exists"
else
    echo "❌ node_modules missing - run 'npm install'"
fi

# Check build directory
echo ""
echo "🏗️  Build directory:"
if [ -d ".next" ]; then
    echo "✅ .next directory exists"
else
    echo "📁 No .next directory (normal for first run)"
fi

echo ""
echo "🚀 To start server: bash start-server.sh"
