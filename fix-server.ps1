# PowerShell script to fix Next.js server issues

Write-Host "🔧 Fixing Next.js server issues..." -ForegroundColor Green

# Kill any processes using port 3000
Write-Host "📡 Killing processes on port 3000..." -ForegroundColor Yellow
$processes = Get-NetTCPConnection -LocalPort 3000 -ErrorAction SilentlyContinue | Select-Object -ExpandProperty OwningProcess
if ($processes) {
    $processes | ForEach-Object { Stop-Process -Id $_ -Force -ErrorAction SilentlyContinue }
}

# Clean build cache
Write-Host "🧹 Cleaning build cache..." -ForegroundColor Yellow
Remove-Item -Path .next -Recurse -Force -ErrorAction SilentlyContinue
Remove-Item -Path node_modules/.cache -Recurse -Force -ErrorAction SilentlyContinue
Remove-Item -Path .turbo -Recurse -Force -ErrorAction SilentlyContinue

# Backup original config
Write-Host "💾 Backing up original config..." -ForegroundColor Yellow
if (Test-Path "next.config.ts") {
    Copy-Item "next.config.ts" "next.config.original.ts" -Force
}

# Use simple config
Write-Host "⚙️  Using simplified configuration..." -ForegroundColor Yellow
if (Test-Path "next.config.simple.ts") {
    Copy-Item "next.config.simple.ts" "next.config.ts" -Force
}

# Install dependencies
Write-Host "📦 Installing dependencies..." -ForegroundColor Yellow
npm install

Write-Host "✅ Setup complete! Now run: npm run dev" -ForegroundColor Green
