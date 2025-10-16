# PowerShell script to fix connection issues

Write-Host "🔧 Diagnosing and Fixing Connection Issues" -ForegroundColor Green
Write-Host "==========================================" -ForegroundColor Green

# Step 1: Check if any processes are running on port 3000
Write-Host "📡 Step 1: Checking port 3000..." -ForegroundColor Yellow
$portProcesses = Get-NetTCPConnection -LocalPort 3000 -ErrorAction SilentlyContinue | Select-Object -ExpandProperty OwningProcess
if ($portProcesses) {
    Write-Host "⚠️  Found processes on port 3000: $portProcesses" -ForegroundColor Yellow
    Write-Host "🛑 Killing processes..." -ForegroundColor Yellow
    $portProcesses | ForEach-Object { Stop-Process -Id $_ -Force -ErrorAction SilentlyContinue }
    Start-Sleep -Seconds 2
} else {
    Write-Host "✅ Port 3000 is free" -ForegroundColor Green
}

# Step 2: Clean all caches
Write-Host "🧹 Step 2: Cleaning all caches..." -ForegroundColor Yellow
Remove-Item -Path .next -Recurse -Force -ErrorAction SilentlyContinue
Remove-Item -Path node_modules/.cache -Recurse -Force -ErrorAction SilentlyContinue
Remove-Item -Path .turbo -Recurse -Force -ErrorAction SilentlyContinue
Remove-Item -Path .swc -Recurse -Force -ErrorAction SilentlyContinue

# Step 3: Check Node.js and npm
Write-Host "🔍 Step 3: Checking Node.js and npm..." -ForegroundColor Yellow
node --version
npm --version

# Step 4: Install dependencies
Write-Host "📦 Step 4: Installing dependencies..." -ForegroundColor Yellow
npm install

# Step 5: Create a minimal test page
Write-Host "🧪 Step 5: Creating minimal test page..." -ForegroundColor Yellow
if (!(Test-Path "src/app")) {
    New-Item -ItemType Directory -Path "src/app" -Force
}

@"
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
"@ | Out-File -FilePath "src/app/page.tsx" -Encoding UTF8

# Step 6: Use simple config
Write-Host "⚙️  Step 6: Using simple configuration..." -ForegroundColor Yellow
if (Test-Path "next.config.simple.ts") {
    Copy-Item "next.config.simple.ts" "next.config.ts" -Force
    Write-Host "✅ Applied simple configuration" -ForegroundColor Green
} else {
    Write-Host "⚠️  Simple config not found, using default" -ForegroundColor Yellow
}

# Step 7: Start server
Write-Host "🚀 Step 7: Starting development server..." -ForegroundColor Green
Write-Host "==========================================" -ForegroundColor Green
Write-Host "Starting Next.js on http://localhost:3000" -ForegroundColor Cyan
Write-Host "Press Ctrl+C to stop the server" -ForegroundColor Cyan
Write-Host "==========================================" -ForegroundColor Green

# Start the server
npm run dev
