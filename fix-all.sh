#!/bin/bash

echo "🔧 Comprehensive Next.js Server Fix"
echo "=================================="

# Function to check if command exists
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

# Kill processes on port 3000
echo "📡 Step 1: Killing processes on port 3000..."
if command_exists lsof; then
    sudo lsof -ti:3000 | xargs sudo kill -9 2>/dev/null || true
elif command_exists netstat; then
    sudo netstat -tlnp | grep :3000 | awk '{print $7}' | cut -d'/' -f1 | xargs sudo kill -9 2>/dev/null || true
else
    echo "⚠️  Could not find lsof or netstat. Please manually kill processes on port 3000."
fi

# Clean all caches
echo "🧹 Step 2: Cleaning all caches..."
rm -rf .next
rm -rf node_modules/.cache
rm -rf .turbo
rm -rf .swc

# Backup and replace config
echo "⚙️  Step 3: Updating configuration..."
if [ -f "next.config.ts" ]; then
    cp next.config.ts next.config.backup.ts
    echo "✅ Backed up original config to next.config.backup.ts"
fi

if [ -f "next.config.simple.ts" ]; then
    cp next.config.simple.ts next.config.ts
    echo "✅ Applied simplified configuration"
else
    echo "❌ next.config.simple.ts not found!"
    exit 1
fi

# Install dependencies
echo "📦 Step 4: Installing dependencies..."
npm install

# Create minimal test files
echo "🧪 Step 5: Creating test files..."

# Create a simple test page
cat > src/app/page-test.tsx << 'EOF'
export default function TestPage() {
  return (
    <div style={{ padding: '20px', fontFamily: 'Arial, sans-serif' }}>
      <h1>🚀 Test Page - Server Working!</h1>
      <p>This is a minimal test page to verify the server is running.</p>
      <div style={{ marginTop: '20px', padding: '10px', backgroundColor: '#e8f5e8', borderRadius: '5px' }}>
        <h3>✅ Status: Online</h3>
        <p>External services are disabled for development.</p>
      </div>
    </div>
  );
}
EOF

# Create a simple API test
mkdir -p src/app/api/test
cat > src/app/api/test/route.ts << 'EOF'
export async function GET() {
  return Response.json({
    success: true,
    message: "API is working!",
    timestamp: new Date().toISOString(),
    status: "healthy"
  });
}
EOF

echo "✅ Created test files"

# Final instructions
echo ""
echo "🎉 Fix Complete!"
echo "==============="
echo ""
echo "Now you can run:"
echo "  npm run dev"
echo ""
echo "Then visit:"
echo "  http://localhost:3000/page-test  (test page)"
echo "  http://localhost:3000/api/test   (test API)"
echo ""
echo "If you still get errors, try:"
echo "  npm run build && npm run dev"
echo ""
