#!/bin/bash

echo "🔧 Diagnosing and Fixing Connection Issues"
echo "=========================================="

# Step 1: Check if any processes are running on port 3000
echo "📡 Step 1: Checking port 3000..."
PORT_PROCESSES=$(sudo lsof -ti:3000 2>/dev/null || echo "")
if [ ! -z "$PORT_PROCESSES" ]; then
    echo "⚠️  Found processes on port 3000: $PORT_PROCESSES"
    echo "🛑 Killing processes..."
    echo "$PORT_PROCESSES" | xargs sudo kill -9 2>/dev/null || true
    sleep 2
else
    echo "✅ Port 3000 is free"
fi

# Step 2: Clean all caches
echo "🧹 Step 2: Cleaning all caches..."
rm -rf .next
rm -rf node_modules/.cache
rm -rf .turbo
rm -rf .swc

# Step 3: Check Node.js and npm
echo "🔍 Step 3: Checking Node.js and npm..."
node --version
npm --version

# Step 4: Install dependencies
echo "📦 Step 4: Installing dependencies..."
npm install

# Step 5: Create a minimal test page
echo "🧪 Step 5: Creating minimal test page..."
mkdir -p src/app
cat > src/app/page.tsx << 'EOF'
export default function HomePage() {
  return (
    <div style={{ padding: '20px', fontFamily: 'Arial, sans-serif' }}>
      <h1>🚀 Server is Working!</h1>
      <p>If you can see this, the Next.js server is running successfully.</p>
      <div style={{ marginTop: '20px', padding: '10px', backgroundColor: '#e8f5e8', borderRadius: '5px' }}>
        <h3>✅ Status: Online</h3>
        <p>Connection successful!</p>
      </div>
    </div>
  );
}
EOF

# Step 6: Use simple config
echo "⚙️  Step 6: Using simple configuration..."
if [ -f "next.config.simple.ts" ]; then
    cp next.config.simple.ts next.config.ts
    echo "✅ Applied simple configuration"
else
    echo "⚠️  Simple config not found, using default"
fi

# Step 7: Start server with verbose output
echo "🚀 Step 7: Starting development server..."
echo "=========================================="
echo "Starting Next.js on http://localhost:3000"
echo "Press Ctrl+C to stop the server"
echo "=========================================="

# Start the server
next dev --port 3000
