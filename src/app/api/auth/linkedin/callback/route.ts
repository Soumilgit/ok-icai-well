import { NextRequest, NextResponse } from 'next/server';
import { LinkedInAutomationService } from '@/lib/linkedin-automation';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const code = searchParams.get('code');
    const state = searchParams.get('state');
    const error = searchParams.get('error');
    const errorDescription = searchParams.get('error_description');

    // Handle OAuth errors
    if (error) {
      console.error('LinkedIn OAuth error:', error, errorDescription);
      return NextResponse.redirect(
        new URL(`/dashboard?error=linkedin_auth_failed&message=${encodeURIComponent(errorDescription || error)}`, request.url)
      );
    }

    // Handle missing authorization code
    if (!code) {
      return NextResponse.redirect(
        new URL('/dashboard?error=linkedin_auth_failed&message=No authorization code received', request.url)
      );
    }

    // Exchange code for access token
    const linkedinService = new LinkedInAutomationService();
    try {
      const accessToken = await linkedinService.exchangeCodeForToken(code);
      
      // Store the access token (in a real app, you'd store this securely in a database)
      // For now, we'll redirect with success
      return NextResponse.redirect(
        new URL('/dashboard?linkedin_connected=true', request.url)
      );
    } catch (tokenError) {
      console.error('Error exchanging code for token:', tokenError);
      return NextResponse.redirect(
        new URL(`/dashboard?error=linkedin_token_exchange_failed&message=${encodeURIComponent(tokenError instanceof Error ? tokenError.message : 'Token exchange failed')}`, request.url)
      );
    }
  } catch (error) {
    console.error('LinkedIn callback error:', error);
    return NextResponse.redirect(
      new URL(`/dashboard?error=linkedin_callback_error&message=${encodeURIComponent(error instanceof Error ? error.message : 'Callback processing failed')}`, request.url)
    );
  }
}