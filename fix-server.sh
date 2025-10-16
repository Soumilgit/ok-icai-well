#!/bin/bash

echo "🔧 Fixing Next.js server issues..."

# Kill any processes using port 3000
echo "📡 Killing processes on port 3000..."
sudo lsof -ti:3000 | xargs sudo kill -9 2>/dev/null || true
sudo netstat -tlnp | grep :3000 | awk '{print $7}' | cut -d'/' -f1 | xargs sudo kill -9 2>/dev/null || true

# Clean build cache
echo "🧹 Cleaning build cache..."
rm -rf .next
rm -rf node_modules/.cache
rm -rf .turbo

# Backup original config
echo "💾 Backing up original config..."
cp next.config.ts next.config.original.ts 2>/dev/null || true

# Use simple config
echo "⚙️  Using simplified configuration..."
cp next.config.simple.ts next.config.ts

# Install dependencies
echo "📦 Installing dependencies..."
npm install

echo "✅ Setup complete! Now run: npm run dev"
