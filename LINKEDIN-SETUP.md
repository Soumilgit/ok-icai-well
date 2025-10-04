# LinkedIn OAuth Setup Guide

## 🔧 LinkedIn Developer Portal Configuration

### Step 1: Create/Update LinkedIn App
1. Go to [LinkedIn Developer Portal](https://developer.linkedin.com/applications)
2. Create new app or select existing app
3. Fill in basic information:
   - **App name**: AccountantAI
   - **Company**: Your company
   - **Website**: http://localhost:3000 (for development)
   - **Application use**: Content creation

### Step 2: Configure OAuth Settings
1. Go to **Auth** tab in your LinkedIn app
2. Add **Redirect URLs**:
   ```
   http://localhost:3000/api/auth/linkedin/callback
   ```

### Step 3: Request Required Scopes
Your app needs these permissions (Products):

#### ✅ **Required Products to Request:**
1. **Sign In with LinkedIn using OpenID Connect**
   - Provides: `profile`, `email` scopes
   - Status: Usually auto-approved

2. **Share on LinkedIn**
   - Provides: `w_member_social` scope
   - Status: Requires review by LinkedIn

3. **Marketing Developer Platform** (if available)
   - Additional posting capabilities
   - Status: Requires company verification

### Step 4: Current Scopes Used by AccountantAI
```
profile           - Basic profile information
email            - Email address (for account linking)
w_member_social  - Post content on behalf of user
```

### Step 5: App Verification Process
For `w_member_social` scope, LinkedIn requires:
1. **Company Page**: Must have a LinkedIn company page
2. **Business Verification**: Company must be verified
3. **Use Case Description**: Clear explanation of how you'll use posting
4. **Review Process**: Can take 1-7 days

## 🚨 Common Issues & Solutions

### Issue 1: "Scope not authorized" 
**Solution**: Make sure all required products are approved in LinkedIn Developer Portal

### Issue 2: "Invalid redirect_uri"
**Solution**: Ensure redirect URI exactly matches: `http://localhost:3000/api/auth/linkedin/callback`

### Issue 3: "Application not found"
**Solution**: Check CLIENT_ID in .env.local matches LinkedIn app

### Issue 4: "w_member_social scope not available"
**Solution**: 
- Request "Share on LinkedIn" product in Developer Portal
- May require business verification
- Can take several days for approval

## 🧪 Testing Without Full Approval

If waiting for LinkedIn approval, you can test with limited scopes:

### Test Mode Setup
1. Use only `profile` and `email` scopes for authentication testing
2. Mock the posting functionality until `w_member_social` is approved
3. Test OAuth flow without actual posting

### Update Scopes for Testing
Temporarily modify scopes in `linkedin-service.ts`:
```typescript
const scopes = [
  'profile',     // Basic profile - usually approved
  'email'        // Email access - usually approved
  // 'w_member_social'  // Comment out until approved
];
```

## 📝 .env.local Configuration

Ensure these variables are set:
```bash
LINKEDIN_CLIENT_ID=your_client_id_here
LINKEDIN_CLIENT_SECRET=your_client_secret_here  
LINKEDIN_REDIRECT_URI=http://localhost:3000/api/auth/linkedin/callback
LINKEDIN_ACCESS_TOKEN=  # Will be set automatically after OAuth
```

## 🎯 Next Steps After Setup

1. **Test Authentication**: Use the "Connect LinkedIn" button
2. **Verify Scopes**: Check what permissions were granted
3. **Test Posting**: Once `w_member_social` is approved
4. **Production Setup**: Update redirect URI for production domain

## 🔗 Useful LinkedIn Developer Resources

- [LinkedIn API Documentation](https://docs.microsoft.com/en-us/linkedin/)
- [OAuth 2.0 Flow](https://docs.microsoft.com/en-us/linkedin/shared/authentication/authorization-code-flow)
- [Share API](https://docs.microsoft.com/en-us/linkedin/marketing/integrations/community-management/shares/ugc-post-api)
- [Developer Support](https://www.linkedin.com/help/linkedin/topics/6127/6128)

---

**Note**: LinkedIn has become stricter with API access. The approval process for posting capabilities may take time. Start with basic authentication and profile access first.