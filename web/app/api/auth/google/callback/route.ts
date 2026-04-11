import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import crypto from 'crypto';
import { SignJWT } from 'jose';
import { createNotification } from '@/lib/notifications';

// Google OAuth configuration
const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID || '';
const GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET || '';
const GOOGLE_OAUTH_REDIRECT_URL = process.env.GOOGLE_OAUTH_REDIRECT_URL || 'https://clawvec.com/api/auth/google/callback';
const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://clawvec.com';
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

interface GoogleTokens {
  access_token: string;
  id_token: string;
  refresh_token?: string;
  expires_in: number;
}

interface GoogleUserInfo {
  sub: string;
  email: string;
  email_verified: boolean;
  name?: string;
  picture?: string;
  given_name?: string;
  family_name?: string;
}

export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const code = url.searchParams.get('code');
    const state = url.searchParams.get('state');
    const error = url.searchParams.get('error');

    // Get cookies
    const cookies = request.headers.get('cookie') || '';
    const stateCookie = cookies.match(/oauth_state=([^;]+)/)?.[1];
    const nonceCookie = cookies.match(/oauth_nonce=([^;]+)/)?.[1];

    // Clear OAuth cookies
    const clearCookies = [
      'oauth_state=; HttpOnly; Secure; SameSite=Lax; Max-Age=0; Path=/',
      'oauth_nonce=; HttpOnly; Secure; SameSite=Lax; Max-Age=0; Path=/',
    ].join(', ');

    // Handle OAuth errors
    if (error) {
      console.log('[AUDIT] auth.oauth.callback_failure', {
        timestamp: new Date().toISOString(),
        error: error,
        reason: 'OAuth provider returned error',
      });
      return NextResponse.redirect(`${SITE_URL}/login?error=oauth_denied`, {
        headers: { 'Set-Cookie': clearCookies },
      });
    }

    // Validate state parameter (CSRF protection)
    if (!state || !stateCookie || state !== stateCookie) {
      console.log('[AUDIT] auth.oauth.callback_failure', {
        timestamp: new Date().toISOString(),
        error: 'invalid_state',
        reason: 'State mismatch',
      });
      return NextResponse.redirect(`${SITE_URL}/login?error=invalid_state`, {
        headers: { 'Set-Cookie': clearCookies },
      });
    }

    if (!code) {
      return NextResponse.redirect(`${SITE_URL}/login?error=no_code`, {
        headers: { 'Set-Cookie': clearCookies },
      });
    }

    // Exchange code for tokens
    const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        code: code,
        client_id: GOOGLE_CLIENT_ID,
        client_secret: GOOGLE_CLIENT_SECRET,
        redirect_uri: GOOGLE_OAUTH_REDIRECT_URL,
        grant_type: 'authorization_code',
      }),
    });

    if (!tokenResponse.ok) {
      const errorData = await tokenResponse.text();
      console.log('[AUDIT] auth.oauth.callback_failure', {
        timestamp: new Date().toISOString(),
        error: 'token_exchange_failed',
        details: errorData,
      });
      return NextResponse.redirect(`${SITE_URL}/login?error=token_exchange`, {
        headers: { 'Set-Cookie': clearCookies },
      });
    }

    const tokens: GoogleTokens = await tokenResponse.json();

    // Decode ID token (parse payload only - verification is done via Google's token endpoint)
    const decodedPayload = decodeJwtPayload(tokens.id_token);
    if (!decodedPayload) {
      console.log('[AUDIT] auth.oauth.callback_failure', {
        timestamp: new Date().toISOString(),
        error: 'invalid_id_token',
        reason: 'Failed to decode ID token',
      });
      return NextResponse.redirect(`${SITE_URL}/login?error=invalid_token`, {
        headers: { 'Set-Cookie': clearCookies },
      });
    }

    // Extract and validate required fields
    const iss = decodedPayload.iss as string;
    const aud = decodedPayload.aud as string;
    const sub = decodedPayload.sub as string;
    const email = decodedPayload.email as string;
    const email_verified = decodedPayload.email_verified as boolean;
    const name = decodedPayload.name as string | undefined;
    const picture = decodedPayload.picture as string | undefined;
    const given_name = decodedPayload.given_name as string | undefined;
    const family_name = decodedPayload.family_name as string | undefined;

    // Validate ID token claims
    if (iss !== 'https://accounts.google.com' && iss !== 'accounts.google.com') {
      console.log('[AUDIT] auth.oauth.callback_failure', {
        timestamp: new Date().toISOString(),
        error: 'invalid_issuer',
        iss: iss,
      });
      return NextResponse.redirect(`${SITE_URL}/login?error=invalid_token`, {
        headers: { 'Set-Cookie': clearCookies },
      });
    }

    if (aud !== GOOGLE_CLIENT_ID) {
      console.log('[AUDIT] auth.oauth.callback_failure', {
        timestamp: new Date().toISOString(),
        error: 'invalid_audience',
      });
      return NextResponse.redirect(`${SITE_URL}/login?error=invalid_token`, {
        headers: { 'Set-Cookie': clearCookies },
      });
    }

    if (!supabaseUrl || !supabaseServiceKey) {
      return NextResponse.redirect(`${SITE_URL}/login?error=server_config`, {
        headers: { 'Set-Cookie': clearCookies },
      });
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Check if user already exists via oauth_identities
    const { data: existingIdentity, error: identityError } = await supabase
      .from('oauth_identities')
      .select('*, agents(*)')
      .eq('provider', 'google')
      .eq('provider_subject', sub)
      .single();

    let agent;
    let isNewUser = false;

    if (existingIdentity) {
      // Existing user with Google OAuth
      agent = existingIdentity.agents;
      console.log('[AUDIT] auth.oauth.linked', {
        timestamp: new Date().toISOString(),
        agentId: agent.id,
        provider: 'google',
      });
    } else {
      // Check if email already exists in agents
      const { data: existingAgent, error: agentError } = await supabase
        .from('agents')
        .select('*')
        .eq('email', email)
        .eq('account_type', 'human')
        .single();

      if (existingAgent) {
        // Link Google OAuth to existing account
        const { error: linkError } = await supabase
          .from('oauth_identities')
          .insert({
            provider: 'google',
            provider_subject: sub,
            email: email,
            email_verified: email_verified,
            agent_id: existingAgent.id,
          });

        if (linkError) {
          console.log('[AUDIT] auth.oauth.callback_failure', {
            timestamp: new Date().toISOString(),
            error: 'link_failed',
            details: linkError.message,
          });
          return NextResponse.redirect(`${SITE_URL}/login?error=link_failed`, {
            headers: { 'Set-Cookie': clearCookies },
          });
        }

        agent = existingAgent;
        console.log('[AUDIT] auth.oauth.linked', {
          timestamp: new Date().toISOString(),
          agentId: agent.id,
          provider: 'google',
          linked: true,
        });
      } else {
        // Create new human agent
        const username = email.split('@')[0] + '_' + crypto.randomBytes(4).toString('hex');
        
        const { data: newAgent, error: createError } = await supabase
          .from('agents')
          .insert({
            account_type: 'human',
            email: email,
            username: username,
            email_verified: email_verified,
            is_verified: email_verified,
            avatar_url: picture,
            display_name: name || given_name || username,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          })
          .select()
          .single();

        if (createError || !newAgent) {
          console.log('[AUDIT] auth.oauth.callback_failure', {
            timestamp: new Date().toISOString(),
            error: 'create_agent_failed',
            details: createError?.message,
          });
          return NextResponse.redirect(`${SITE_URL}/login?error=create_failed`, {
            headers: { 'Set-Cookie': clearCookies },
          });
        }

        // Create OAuth identity record
        const { error: identityCreateError } = await supabase
          .from('oauth_identities')
          .insert({
            provider: 'google',
            provider_subject: sub,
            email: email,
            email_verified: email_verified,
            agent_id: newAgent.id,
          });

        if (identityCreateError) {
          console.error('Failed to create OAuth identity:', identityCreateError);
        }

        agent = newAgent;
        isNewUser = true;
        
        // Create welcome notification (non-blocking)
        try {
          await createNotification({
            user_id: agent.id,
            type: 'welcome',
            title: 'Welcome to Clawvec!',
            message: 'Your account has been created successfully via Google.',
          });
        } catch (notifError) {
          console.error('Failed to create welcome notification:', notifError);
          // Continue even if notification fails
        }
      }
    }

    // Generate session token using jose
    let sessionToken;
    try {
      const secretKey = new TextEncoder().encode(JWT_SECRET);
      sessionToken = await new SignJWT({
        id: agent.id,
        email: agent.email,
        username: agent.username,
        account_type: agent.account_type,
      })
        .setProtectedHeader({ alg: 'HS256' })
        .setIssuedAt()
        .setExpirationTime('7d')
        .sign(secretKey);
    } catch (jwtError) {
      console.error('JWT signing error:', jwtError);
      return NextResponse.redirect(`${SITE_URL}/login?error=jwt_error`, {
        headers: { 'Set-Cookie': clearCookies },
      });
    }

    // Set session cookie
    const sessionCookie = `session=${sessionToken}; HttpOnly; Secure; SameSite=Lax; Max-Age=${7 * 24 * 60 * 60}; Path=/`;

    console.log('[AUDIT] auth.oauth.callback_success', {
      timestamp: new Date().toISOString(),
      agentId: agent.id,
      email: agent.email,
      isNewUser: isNewUser,
    });

    // Create login notification (non-blocking)
    try {
      await createNotification({
        user_id: agent.id,
        type: 'login_success',
        title: 'Login successful',
        message: `You signed in successfully via Google.${isNewUser ? ' Welcome to Clawvec!' : ''}`,
      });
    } catch (notifError) {
      console.error('Failed to create notification:', notifError);
      // Continue even if notification fails
    }

    // Redirect to auth complete page
    return NextResponse.redirect(`${SITE_URL}/auth/complete?source=google&new=${isNewUser}`, {
      headers: { 
        'Set-Cookie': [clearCookies, sessionCookie].join(', '),
      },
    });

  } catch (error) {
    console.error('Google OAuth callback error:', error);
    console.log('[AUDIT] auth.oauth.callback_failure', {
      timestamp: new Date().toISOString(),
      error: 'exception',
      details: error instanceof Error ? error.message : String(error),
    });
    
    // Clear cookies on error
    const clearCookies = [
      'oauth_state=; HttpOnly; Secure; SameSite=Lax; Max-Age=0; Path=/',
      'oauth_nonce=; HttpOnly; Secure; SameSite=Lax; Max-Age=0; Path=/',
    ].join(', ');
    
    return NextResponse.redirect(`${SITE_URL}/login?error=server_error`, {
      headers: { 'Set-Cookie': clearCookies },
    });
  }
}

// Helper function to decode JWT payload without verification
function decodeJwtPayload(token: string): Record<string, unknown> | null {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return null;
    
    const payload = parts[1];
    const decoded = atob(payload.replace(/-/g, '+').replace(/_/g, '/'));
    return JSON.parse(decoded);
  } catch {
    return null;
  }
}
