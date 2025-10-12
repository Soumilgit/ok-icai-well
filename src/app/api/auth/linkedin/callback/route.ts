import { NextRequest, NextResponse } from 'next/server';
import { LinkedInService } from '@/lib/linkedin-service';
import fs from 'fs';
import path from 'path';

// Function to update .env.local file with access token
async function updateEnvFile(accessToken: string): Promise<void> {
  try {
    const envPath = path.join(process.cwd(), '.env.local');
    const envContent = fs.readFileSync(envPath, 'utf8');
    
    // Replace or add the LINKEDIN_ACCESS_TOKEN
    const lines = envContent.split('\n');
    let tokenLineFound = false;
    
    for (let i = 0; i < lines.length; i++) {
      if (lines[i].startsWith('LINKEDIN_ACCESS_TOKEN=')) {
        lines[i] = `LINKEDIN_ACCESS_TOKEN=${accessToken}`;
        tokenLineFound = true;
        break;
      }
    }
    
    if (!tokenLineFound) {
      lines.push(`LINKEDIN_ACCESS_TOKEN=${accessToken}`);
    }
    
    fs.writeFileSync(envPath, lines.join('\n'));
    console.log('✅ Successfully updated .env.local with LinkedIn access token');
  } catch (error) {
    console.error('❌ Failed to update .env.local:', error);
    // Don't throw here to avoid breaking the OAuth flow
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const code = searchParams.get('code');
    const state = searchParams.get('state');
    const error = searchParams.get('error');
    const errorDescription = searchParams.get('error_description');

    console.log('🔗 LinkedIn callback received:', { code: code?.substring(0, 10) + '...', error, errorDescription });

    // Handle OAuth errors
    if (error) {
      console.error('LinkedIn OAuth error:', error, errorDescription);
      return new NextResponse(`
        <html>
          <body>
            <h2>❌ LinkedIn Authentication Failed</h2>
            <p><strong>Error:</strong> ${error}</p>
            <p><strong>Description:</strong> ${errorDescription || 'No description provided'}</p>
            <script>
              setTimeout(() => {
                window.close();
                if (window.opener) {
                  window.opener.postMessage({ type: 'linkedin_auth_error', error: '${error}' }, '*');
                }
              }, 3000);
            </script>
          </body>
        </html>
      `, {
        headers: { 'Content-Type': 'text/html' }
      });
    }

    // Handle missing authorization code
    if (!code) {
      return new NextResponse(`
        <html>
          <body>
            <h2>❌ LinkedIn Authentication Failed</h2>
            <p>No authorization code received from LinkedIn.</p>
            <script>
              setTimeout(() => {
                window.close();
                if (window.opener) {
                  window.opener.postMessage({ type: 'linkedin_auth_error', error: 'no_code' }, '*');
                }
              }, 3000);
            </script>
          </body>
        </html>
      `, {
        headers: { 'Content-Type': 'text/html' }
      });
    }

    // Exchange code for access token
    const linkedinService = new LinkedInService();
    try {
      console.log('🔄 Exchanging authorization code for access token...');
      
      const clientId = process.env.LINKEDIN_CLIENT_ID;
      const clientSecret = process.env.LINKEDIN_CLIENT_SECRET;
      const redirectUri = process.env.LINKEDIN_REDIRECT_URI;
      
      if (!clientId || !clientSecret || !redirectUri) {
        throw new Error('LinkedIn OAuth configuration missing');
      }
      
      const tokenResult = await linkedinService.exchangeCodeForToken(code, clientId, clientSecret, redirectUri);
      
      if (tokenResult && tokenResult.accessToken) {
        console.log('✅ Successfully obtained LinkedIn access token');
        
        // Update the .env.local file with the access token
        await updateEnvFile(tokenResult.accessToken);
        
        return new NextResponse(`
          <html>
            <body style="font-family: Arial, sans-serif; text-align: center; padding: 50px;">
              <h2 style="color: #22c55e;">✅ LinkedIn Connected Successfully!</h2>
              <p>Your LinkedIn account has been connected to AccountantAI.</p>
              <p>You can now post content to LinkedIn automatically!</p>
              <p style="color: #666; font-size: 14px;">This window will close automatically...</p>
              <script>
                setTimeout(() => {
                  window.close();
                  if (window.opener) {
                    window.opener.postMessage({ type: 'linkedin_auth_success', token: 'received' }, '*');
                  }
                }, 2000);
              </script>
            </body>
          </html>
        `, {
          headers: { 'Content-Type': 'text/html' }
        });
      } else {
        throw new Error('Failed to get access token from LinkedIn');
      }
    } catch (tokenError) {
      console.error('Error exchanging code for token:', tokenError);
      return new NextResponse(`
        <html>
          <body>
            <h2>❌ Token Exchange Failed</h2>
            <p><strong>Error:</strong> ${tokenError instanceof Error ? tokenError.message : 'Token exchange failed'}</p>
            <script>
              setTimeout(() => {
                window.close();
                if (window.opener) {
                  window.opener.postMessage({ type: 'linkedin_auth_error', error: 'token_exchange_failed' }, '*');
                }
              }, 3000);
            </script>
          </body>
        </html>
      `, {
        headers: { 'Content-Type': 'text/html' }
      });
    }
  } catch (error) {
    console.error('LinkedIn callback error:', error);
    return NextResponse.redirect(
      new URL(`/dashboard?error=linkedin_callback_error&message=${encodeURIComponent(error instanceof Error ? error.message : 'Callback processing failed')}`, request.url)
    );
  }
}