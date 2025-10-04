Write-Host "LinkedIn API Scope Tester" -ForegroundColor Cyan

Write-Host "1. Testing server connectivity..." -ForegroundColor Yellow
try {
    $response = Invoke-RestMethod -Uri "http://localhost:3000/api/linkedin-auth" -Method GET
    Write-Host "   Server: OK" -ForegroundColor Green
} catch {
    Write-Host "   Server: FAILED - $($_.Exception.Message)" -ForegroundColor Red
    exit
}

Write-Host "2. Checking authentication..." -ForegroundColor Yellow
try {
    $body = '{"action": "check_auth"}'
    $auth = Invoke-RestMethod -Uri "http://localhost:3000/api/linkedin-auth" -Method POST -Body $body -ContentType "application/json"
    if ($auth.authenticated) {
        Write-Host "   Auth: CONNECTED" -ForegroundColor Green
    } else {
        Write-Host "   Auth: NOT CONNECTED" -ForegroundColor Red
    }
} catch {
    Write-Host "   Auth: ERROR - $($_.Exception.Message)" -ForegroundColor Red
}

Write-Host "3. Testing LinkedIn posting..." -ForegroundColor Yellow
try {
    $postBody = '{"action": "test_post", "content": "Test from PowerShell script"}'
    $post = Invoke-RestMethod -Uri "http://localhost:3000/api/linkedin-auth" -Method POST -Body $postBody -ContentType "application/json"
    if ($post.success) {
        Write-Host "   Posting: SUCCESS" -ForegroundColor Green
    } else {
        Write-Host "   Posting: FAILED - $($post.error)" -ForegroundColor Red
    }
} catch {
    Write-Host "   Posting: ERROR - $($_.Exception.Message)" -ForegroundColor Red
}

Write-Host "4. Environment check..." -ForegroundColor Yellow
$env = Get-Content ".env.local" -Raw
if ($env -match "LINKEDIN_ACCESS_TOKEN=(.+)") {
    $token = $matches[1]
    if ($token.Length -gt 10) {
        Write-Host "   Access Token: SET ($(($token).Substring(0,10))...)" -ForegroundColor Green
    } else {
        Write-Host "   Access Token: EMPTY" -ForegroundColor Red
    }
} else {
    Write-Host "   Access Token: NOT FOUND" -ForegroundColor Red
}

Write-Host "`nDone!" -ForegroundColor Cyan