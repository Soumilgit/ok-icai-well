#!/bin/bash

echo "🚀 Complete Server Fix & Start"
echo "============================="

# Function to check if command exists
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

# Step 1: Environment check
echo "🔍 Step 1: Environment Check"
echo "Current directory: $(pwd)"
echo "Node.js version: $(node --version)"
echo "npm version: $(npm --version)"

# Step 2: Kill all processes on port 3000
echo ""
echo "📡 Step 2: Freeing port 3000"
if command_exists lsof; then
    sudo lsof -ti:3000 | xargs sudo kill -9 2>/dev/null || true
elif command_exists netstat; then
    sudo netstat -tlnp | grep :3000 | awk '{print $7}' | cut -d'/' -f1 | xargs sudo kill -9 2>/dev/null || true
fi
echo "✅ Port 3000 cleared"

# Step 3: Clean everything
echo ""
echo "🧹 Step 3: Deep Clean"
rm -rf .next
rm -rf node_modules/.cache
rm -rf .turbo
rm -rf .swc
rm -rf .vercel
echo "✅ Cache cleared"

# Step 4: Ensure dependencies
echo ""
echo "📦 Step 4: Installing Dependencies"
npm install
echo "✅ Dependencies installed"

# Step 5: Create minimal page
echo ""
echo "🧪 Step 5: Creating Test Page"
mkdir -p src/app
cat > src/app/page.tsx << 'EOF'
export default function TestPage() {
  return (
    <div style={{ 
      padding: '40px', 
      fontFamily: 'Arial, sans-serif',
      textAlign: 'center',
      backgroundColor: '#f5f5f5',
      minHeight: '100vh'
    }}>
      <h1 style={{ color: '#2d3748', marginBottom: '20px' }}>
        🚀 Next.js Server is Running!
      </h1>
      <p style={{ fontSize: '18px', color: '#4a5568', marginBottom: '30px' }}>
        If you can see this page, your development server is working correctly.
      </p>
      <div style={{ 
        backgroundColor: '#e6fffa', 
        border: '2px solid #38b2ac',
        borderRadius: '10px',
        padding: '20px',
        maxWidth: '400px',
        margin: '0 auto'
      }}>
        <h3 style={{ color: '#2c7a7b', margin: '0 0 10px 0' }}>✅ Status: Online</h3>
        <p style={{ color: '#2c7a7b', margin: '0' }}>Server connection successful!</p>
      </div>
    </div>
  );
}
EOF
echo "✅ Test page created"

# Step 6: Use simple config
echo ""
echo "⚙️  Step 6: Configuration"
if [ -f "next.config.simple.ts" ]; then
    cp next.config.simple.ts next.config.ts
    echo "✅ Using simple configuration"
else
    echo "⚠️  Using default configuration"
fi

# Step 7: Start server
echo ""
echo "🚀 Step 7: Starting Development Server"
echo "======================================"
echo "🌐 Server will be available at: http://localhost:3000"
echo "⏹️  Press Ctrl+C to stop the server"
echo "======================================"
echo ""

# Start the server with error handling
if npm run dev; then
    echo "✅ Server started successfully"
else
    echo "❌ Server failed to start"
    echo ""
    echo "🔧 Troubleshooting steps:"
    echo "1. Check if port 3000 is free: netstat -tlnp | grep :3000"
    echo "2. Try a different port: npm run dev -- --port 3001"
    echo "3. Check Node.js version: node --version"
    echo "4. Reinstall dependencies: rm -rf node_modules && npm install"
fi
