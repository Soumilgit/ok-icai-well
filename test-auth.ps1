# LinkedIn Authentication Test Script
Write-Host "🔍 Testing LinkedIn Authentication..." -ForegroundColor Cyan

# Test auth endpoint
Write-Host "`n1. Testing auth endpoint..." -ForegroundColor Yellow
try {
    $authResponse = Invoke-RestMethod -Uri "http://localhost:3000/api/linkedin-auth" -Method GET
    Write-Host "✅ Auth endpoint response:" -ForegroundColor Green
    $authResponse | ConvertTo-Json -Depth 3
} catch {
    Write-Host "❌ Auth endpoint failed: $($_.Exception.Message)" -ForegroundColor Red
}

# Test immediate posting
Write-Host "`n2. Testing immediate posting..." -ForegroundColor Yellow
$postData = @{
    content = "Test post from AccountantAI - LinkedIn integration working! 🚀`nTimestamp: $(Get-Date)"
} | ConvertTo-Json

try {
    $postResponse = Invoke-RestMethod -Uri "http://localhost:3000/api/linkedin-auth" -Method POST -Body $postData -ContentType "application/json"
    Write-Host "✅ Posting response:" -ForegroundColor Green
    $postResponse | ConvertTo-Json -Depth 3
} catch {
    Write-Host "❌ Posting failed: $($_.Exception.Message)" -ForegroundColor Red
}

# Test automation pipeline
Write-Host "`n3. Testing automation pipeline..." -ForegroundColor Yellow
$automationData = @{
    trigger = "post_now"
} | ConvertTo-Json

try {
    $automationResponse = Invoke-RestMethod -Uri "http://localhost:3000/api/linkedin-automation" -Method POST -Body $automationData -ContentType "application/json"
    Write-Host "✅ Automation response:" -ForegroundColor Green
    $automationResponse | ConvertTo-Json -Depth 3
} catch {
    Write-Host "❌ Automation failed: $($_.Exception.Message)" -ForegroundColor Red
}

Write-Host "`n🎯 Next Steps:" -ForegroundColor Magenta
Write-Host "1. If auth failed: Visit http://localhost:3000/dashboard and click 'Connect LinkedIn'" -ForegroundColor White
Write-Host "2. If posting failed: Complete OAuth first, then try posting again" -ForegroundColor White
Write-Host "3. If automation failed: Check server logs for detailed error messages" -ForegroundColor White