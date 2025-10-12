import { NextRequest, NextResponse } from 'next/server';

export async function GET() {
  try {
    // Server-side environment variables - never exposed to client
    const clientId = process.env.LINKEDIN_CLIENT_ID;
    const redirectUri = process.env.LINKEDIN_REDIRECT_URI;
    
    // Validate configuration server-side
    if (!clientId || clientId === 'your_linkedin_client_id_here') {
      return NextResponse.json(
        { error: 'LinkedIn Client ID is not configured. Please set LINKEDIN_CLIENT_ID in your environment variables.' },
        { status: 500 }
      );
    }
    
    if (!redirectUri) {
      return NextResponse.json(
        { error: 'LinkedIn Redirect URI is not configured. Please set LINKEDIN_REDIRECT_URI in your environment variables.' },
        { status: 500 }
      );
    }
    
    // Define OAuth scopes - using only basic scopes that are available by default
    const scope = 'openid,profile,email';
    
    // Construct OAuth URL securely on server-side
    const authUrl = `https://www.linkedin.com/oauth/v2/authorization?response_type=code&client_id=${encodeURIComponent(clientId)}&redirect_uri=${encodeURIComponent(redirectUri)}&scope=${encodeURIComponent(scope)}`;
    
    // Return only the auth URL - no credentials exposed
    return NextResponse.json({ 
      success: true,
      authUrl: authUrl 
    });
    
  } catch (error) {
    console.error('LinkedIn OAuth initiation error:', error);
    return NextResponse.json(
      { error: 'Failed to initiate LinkedIn OAuth' },
      { status: 500 }
    );
  }
}