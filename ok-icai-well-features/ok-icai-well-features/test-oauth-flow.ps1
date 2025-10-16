# LinkedIn OAuth Flow Test
Write-Host "🔗 LinkedIn OAuth Flow Test" -ForegroundColor Cyan
Write-Host "=============================" -ForegroundColor Cyan

Write-Host "`n📋 Steps to test LinkedIn authentication:" -ForegroundColor Yellow
Write-Host "1. Start server: npm run dev" -ForegroundColor White
Write-Host "2. Open: http://localhost:3000/dashboard" -ForegroundColor White
Write-Host "3. Go to 'LinkedIn Automation' tab" -ForegroundColor White
Write-Host "4. Click '🔗 Connect LinkedIn' button" -ForegroundColor White
Write-Host "5. Complete OAuth in popup window" -ForegroundColor White
Write-Host "6. Test with '🧪 Test Posting' button" -ForegroundColor White

Write-Host "`n🧪 Quick API Test:" -ForegroundColor Yellow
try {
    Write-Host "Testing auth endpoint..." -ForegroundColor Gray
    $authTest = Invoke-RestMethod -Uri "http://localhost:3000/api/linkedin-auth" -Method GET -ErrorAction Stop
    Write-Host "✅ Auth endpoint working" -ForegroundColor Green
    Write-Host "Auth URL: $($authTest.data.authUrl.Substring(0, 80))..." -ForegroundColor Gray
} catch {
    Write-Host "❌ Server not running or auth endpoint failed" -ForegroundColor Red
    Write-Host "Run: npm run dev" -ForegroundColor Yellow
}

Write-Host "`n🔍 Current environment check:" -ForegroundColor Yellow
$envPath = ".\.env.local"
if (Test-Path $envPath) {
    $envContent = Get-Content $envPath -Raw
    
    $clientId = if ($envContent -match "LINKEDIN_CLIENT_ID=(.+)") { $matches[1] } else { "NOT SET" }
    $clientSecret = if ($envContent -match "LINKEDIN_CLIENT_SECRET=(.+)") { $matches[1] } else { "NOT SET" }
    $accessToken = if ($envContent -match "LINKEDIN_ACCESS_TOKEN=(.+)") { $matches[1] } else { "NOT SET" }
    
    Write-Host "CLIENT_ID: $($clientId.Substring(0, [Math]::Min(10, $clientId.Length)))..." -ForegroundColor White
    Write-Host "CLIENT_SECRET: $($clientSecret.Substring(0, [Math]::Min(10, $clientSecret.Length)))..." -ForegroundColor White
    Write-Host "ACCESS_TOKEN: $($accessToken -eq 'NOT SET' ? 'NOT SET' : 'SET (' + $accessToken.Substring(0, [Math]::Min(10, $accessToken.Length)) + '...)')" -ForegroundColor White
} else {
    Write-Host "❌ .env.local file not found" -ForegroundColor Red
}

Write-Host "`n🎯 What's Fixed:" -ForegroundColor Magenta
Write-Host "✅ Popup OAuth flow with proper callback handling" -ForegroundColor Green
Write-Host "✅ Access token automatically saved to .env.local" -ForegroundColor Green
Write-Host "✅ Visual feedback in popup window" -ForegroundColor Green
Write-Host "✅ Message passing between popup and parent window" -ForegroundColor Green
Write-Host "✅ Immediate posting option added ('🚀 Post Now' button)" -ForegroundColor Green

Write-Host "`n🚀 Ready to test! Open http://localhost:3000/dashboard" -ForegroundColor Cyan