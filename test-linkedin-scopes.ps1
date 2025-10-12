# LinkedIn Scope & Permission Tester
Write-Host "🔗 LinkedIn API Scope Tester" -ForegroundColor Cyan
Write-Host "=============================" -ForegroundColor Cyan

Write-Host "`n🔍 Testing LinkedIn API endpoints..." -ForegroundColor Yellow

# Test 1: Check if server is running
Write-Host "`n1. Server connectivity test:" -ForegroundColor White
try {
    $serverTest = Invoke-RestMethod -Uri "http://localhost:3000/api/linkedin-auth" -Method GET -ErrorAction Stop
    Write-Host "✅ Server running and LinkedIn auth endpoint accessible" -ForegroundColor Green
} catch {
    Write-Host "❌ Server not running. Run 'npm run dev' first" -ForegroundColor Red
    exit 1
}

# Test 2: Check current authentication status
Write-Host "`n2. Authentication status check:" -ForegroundColor White
try {
    $checkAuth = '{"action": "check_auth"}' | ConvertTo-Json
    $authStatus = Invoke-RestMethod -Uri "http://localhost:3000/api/linkedin-auth" -Method POST -Body $checkAuth -ContentType "application/json"
    
    if ($authStatus.authenticated) {
        Write-Host "✅ LinkedIn access token is set" -ForegroundColor Green
    } else {
        Write-Host "❌ LinkedIn access token missing" -ForegroundColor Red
        Write-Host "   → Complete OAuth flow: http://localhost:3000/dashboard" -ForegroundColor Yellow
    }
} catch {
    Write-Host "❌ Failed to check authentication status" -ForegroundColor Red
}

# Test 3: Test OAuth URL generation
Write-Host "`n3. OAuth URL generation test:" -ForegroundColor White
try {
    $authData = Invoke-RestMethod -Uri "http://localhost:3000/api/linkedin-auth" -Method GET
    if ($authData.success) {
        Write-Host "✅ OAuth URL generated successfully" -ForegroundColor Green
        Write-Host "   Scopes included: profile, email, w_member_social" -ForegroundColor Gray
        Write-Host "   URL: $($authData.data.authUrl.Substring(0, 80))..." -ForegroundColor Gray
    }
} catch {
    Write-Host "❌ Failed to generate OAuth URL" -ForegroundColor Red
}

# Test 4: Environment check
Write-Host "`n4. Environment configuration check:" -ForegroundColor White
$envPath = ".\.env.local"
if (Test-Path $envPath) {
    $envContent = Get-Content $envPath -Raw
    
    $clientId = if ($envContent -match "LINKEDIN_CLIENT_ID=(.+)") { $matches[1] } else { "" }
    $clientSecret = if ($envContent -match "LINKEDIN_CLIENT_SECRET=(.+)") { $matches[1] } else { "" }
    $accessToken = if ($envContent -match "LINKEDIN_ACCESS_TOKEN=(.+)") { $matches[1] } else { "" }
    
    Write-Host "CLIENT_ID: $(if($clientId) {'✅ Set'} else {'❌ Missing'})" -ForegroundColor $(if($clientId) {'Green'} else {'Red'})
    Write-Host "CLIENT_SECRET: $(if($clientSecret) {'✅ Set'} else {'❌ Missing'})" -ForegroundColor $(if($clientSecret) {'Green'} else {'Red'})
    Write-Host "ACCESS_TOKEN: $(if($accessToken) {'✅ Set'} else {'❌ Missing'})" -ForegroundColor $(if($accessToken) {'Green'} else {'Red'})
} else {
    Write-Host "❌ .env.local file not found" -ForegroundColor Red
}

# Test 5: Scope-specific testing
Write-Host "`n5. LinkedIn scope testing:" -ForegroundColor White

if ($authStatus.authenticated) {
    # Test basic profile access (should work with 'profile' scope)
    Write-Host "   Testing profile access..." -ForegroundColor Gray
    try {
        $profileTest = '{"action": "test_profile"}' | ConvertTo-Json
        # We'll add this endpoint
        Write-Host "   → Profile scope: Testing required" -ForegroundColor Yellow
    } catch {
        Write-Host "   → Profile scope: May not be available" -ForegroundColor Yellow
    }
    
    # Test posting capability (requires 'w_member_social' scope)
    Write-Host "   Testing posting capability..." -ForegroundColor Gray
    try {
        $postTest = '{"action": "test_post", "content": "Test post from AccountantAI scope tester"}' | ConvertTo-Json
        $postResult = Invoke-RestMethod -Uri "http://localhost:3000/api/linkedin-auth" -Method POST -Body $postTest -ContentType "application/json"
        
        if ($postResult.success) {
            Write-Host "   → Posting scope (w_member_social): ✅ Working" -ForegroundColor Green
        } else {
            Write-Host "   → Posting scope (w_member_social): ❌ Not authorized" -ForegroundColor Red
            Write-Host "     Error: $($postResult.error)" -ForegroundColor Red
        }
    } catch {
        Write-Host "   → Posting scope (w_member_social): ❌ Error occurred" -ForegroundColor Red
    }
} else {
    Write-Host "   → Skipping scope tests (not authenticated)" -ForegroundColor Yellow
}

Write-Host "`n📋 Common LinkedIn OAuth Issues:" -ForegroundColor Magenta
Write-Host "1. 'Scope not authorized' → App needs LinkedIn approval for w_member_social" -ForegroundColor White
Write-Host "2. 'Invalid client' → Check CLIENT_ID matches LinkedIn Developer Portal" -ForegroundColor White
Write-Host "3. 'Redirect URI mismatch' → Must be exactly: http://localhost:3000/api/auth/linkedin/callback" -ForegroundColor White
Write-Host "4. 'Email scope not available' → Request 'Sign In with LinkedIn using OpenID Connect' product" -ForegroundColor White

Write-Host "`n🎯 Next Steps:" -ForegroundColor Cyan
if (-not $authStatus.authenticated) {
    Write-Host "1. Open: http://localhost:3000/dashboard" -ForegroundColor White
    Write-Host "2. Click: 'Connect LinkedIn' button" -ForegroundColor White
    Write-Host "3. Complete OAuth flow" -ForegroundColor White
} else {
    Write-Host "1. Test posting with: '🧪 Test Posting' button in dashboard" -ForegroundColor White
    Write-Host "2. If posting fails, check LinkedIn Developer Portal for scope approvals" -ForegroundColor White
}

Write-Host "`n📖 See LINKEDIN-SETUP.md for detailed configuration guide" -ForegroundColor Yellow