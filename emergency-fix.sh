#!/bin/bash

echo "🛠️  Emergency Server Fix"
echo "======================="

# Nuclear option - clean everything and start fresh
echo "🧹 Nuclear clean..."
rm -rf .next
rm -rf node_modules
rm -rf .turbo
rm -rf .swc
rm -rf .vercel
rm -rf node_modules/.cache

echo "📦 Fresh install..."
npm install

echo "🧪 Create minimal setup..."
mkdir -p src/app

# Create absolute minimal page
cat > src/app/page.tsx << 'EOF'
export default function Home() {
  return <h1>Hello World!</h1>;
}
EOF

# Create minimal config
cat > next.config.ts << 'EOF'
/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
}

module.exports = nextConfig
EOF

echo "🚀 Starting server..."
next dev --port 3000
