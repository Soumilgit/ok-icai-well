import { NextRequest, NextResponse } from 'next/server';
import { LinkedInService } from '../../../lib/linkedin-service';

export async function GET() {
  try {
    const clientId = process.env.LINKEDIN_CLIENT_ID;
    const redirectUri = process.env.LINKEDIN_REDIRECT_URI;
    
    if (!clientId || !redirectUri) {
      return NextResponse.json(
        { success: false, error: 'LinkedIn OAuth not configured' },
        { status: 500 }
      );
    }

    const linkedinService = new LinkedInService();
    const authUrl = linkedinService.generateAuthUrl(clientId, redirectUri);
    
    return NextResponse.json({
      success: true,
      data: {
        authUrl,
        message: 'Redirect user to this URL to authorize LinkedIn access'
      }
    });

  } catch (error) {
    console.error('Error generating LinkedIn auth URL:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to generate auth URL' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action } = body;

    if (action === 'check_auth') {
      // Check if LinkedIn is authenticated
      const accessToken = process.env.LINKEDIN_ACCESS_TOKEN;
      
      return NextResponse.json({
        success: !!accessToken,
        authenticated: !!accessToken,
        message: accessToken ? 'LinkedIn is connected' : 'LinkedIn not connected'
      });
    }

    if (action === 'test_post') {
      // Test posting with current credentials
      const accessToken = process.env.LINKEDIN_ACCESS_TOKEN;
      
      if (!accessToken) {
        return NextResponse.json({
          success: false,
          error: 'LinkedIn access token not found. Please complete OAuth flow first.',
          needsAuth: true
        });
      }

      const linkedinService = new LinkedInService();
      linkedinService.setAccessToken(accessToken);

      // Test with a simple post
      const testResult = await linkedinService.publishPost({
        text: 'Test post from AccountantAI automation system! 🚀\n\nThis confirms that LinkedIn integration is working properly.',
        hashtags: ['#TestPost', '#CharteredAccountant', '#Automation', '#AccountantAI']
      });

      return NextResponse.json({
        success: testResult.success,
        data: testResult,
        message: testResult.success ? 'Test post published successfully!' : 'Test post failed'
      });
    }

    return NextResponse.json(
      { success: false, error: 'Unknown action' },
      { status: 400 }
    );

  } catch (error) {
    console.error('LinkedIn auth API error:', error);
    return NextResponse.json(
      { success: false, error: 'API error occurred' },
      { status: 500 }
    );
  }
}