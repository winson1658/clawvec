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

    // Clear OAuth cookies - use proper header format for multiple cookies
    const clearStateCookie = 'oauth_state=; HttpOnly; Secure; SameSite=Lax; Max-Age=0; Path=/';
    const clearNonceCookie = 'oauth_nonce=; HttpOnly; Secure; SameSite=Lax; Max-Age=0; Path=/';

    // Handle OAuth errors
    if (error) {
      console.log('[AUDIT] auth.oauth.callback_failure', {
        timestamp: new Date().toISOString(),
        error: error,
        reason: 'OAuth provider returned error',
      });
      const response = NextResponse.redirect(`${SITE_URL}/?auth_error=oauth_denied`);
      response.headers.append('Set-Cookie', clearStateCookie);
      response.headers.append('Set-Cookie', clearNonceCookie);
      return response;
    }

    // Validate state parameter (CSRF protection)
    if (!state || !stateCookie || state !== stateCookie) {
      console.log('[AUDIT] auth.oauth.callback_failure', {
        timestamp: new Date().toISOString(),
        error: 'invalid_state',
        reason: 'State mismatch',
      });
      const response = NextResponse.redirect(`${SITE_URL}/?auth_error=invalid_state`);
      response.headers.append('Set-Cookie', clearStateCookie);
      response.headers.append('Set-Cookie', clearNonceCookie);
      return response;
    }

    if (!code) {
      const response = NextResponse.redirect(`${SITE_URL}/?auth_error=no_code`);
      response.headers.append('Set-Cookie', clearStateCookie);
      response.headers.append('Set-Cookie', clearNonceCookie);
      return response;
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
      const response = NextResponse.redirect(`${SITE_URL}/?auth_error=token_exchange`);
      response.headers.append('Set-Cookie', clearStateCookie);
      response.headers.append('Set-Cookie', clearNonceCookie);
      return response;
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
      const response = NextResponse.redirect(`${SITE_URL}/?auth_error=invalid_token`);
      response.headers.append('Set-Cookie', clearStateCookie);
      response.headers.append('Set-Cookie', clearNonceCookie);
      return response;
    }

    // Extract and validate required fields
    const iss = decodedPayload.iss as string;
    const aud = decodedPayload.aud as string;
    const sub = decodedPayload.sub as string;
    const email = (decodedPayload.email as string).toLowerCase().trim();
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
      const response = NextResponse.redirect(`${SITE_URL}/?auth_error=invalid_token`);
      response.headers.append('Set-Cookie', clearStateCookie);
      response.headers.append('Set-Cookie', clearNonceCookie);
      return response;
    }

    if (aud !== GOOGLE_CLIENT_ID) {
      console.log('[AUDIT] auth.oauth.callback_failure', {
        timestamp: new Date().toISOString(),
        error: 'invalid_audience',
      });
      const response = NextResponse.redirect(`${SITE_URL}/?auth_error=invalid_token`);
      response.headers.append('Set-Cookie', clearStateCookie);
      response.headers.append('Set-Cookie', clearNonceCookie);
      return response;
    }

    if (!supabaseUrl || !supabaseServiceKey) {
      const response = NextResponse.redirect(`${SITE_URL}/?auth_error=server_config`);
      response.headers.append('Set-Cookie', clearStateCookie);
      response.headers.append('Set-Cookie', clearNonceCookie);
      return response;
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Check if user already exists via oauth_identities
    let existingIdentity = null;
    try {
      const result = await supabase
        .from('oauth_identities')
        .select('*, agents(*)')
        .eq('provider', 'google')
        .eq('provider_subject', sub)
        .single();
      existingIdentity = result.data;
      if (result.error && result.error.code !== 'PGRST116') { // PGRST116 = no rows returned
        console.error('OAuth identity query error:', result.error);
      }
    } catch (dbError) {
      console.error('Database error when checking OAuth identity:', dbError);
    }

    let agent;
    let isNewUser = false;

    if (existingIdentity) {
      // B4: Existing user with Google OAuth - just login
      agent = existingIdentity.agents;
      console.log('[AUDIT] auth.oauth.linked', {
        timestamp: new Date().toISOString(),
        agentId: agent.id,
        provider: 'google',
      });
    } else {
      // Check if email already exists in agents (only human accounts can be linked)
      const { data: existingAgent, error: agentError } = await supabase
        .from('agents')
        .select('*')
        .ilike('email', email)
        .eq('account_type', 'human')
        .maybeSingle();

      if (existingAgent) {
        agent = existingAgent;
        
        // Safety check: only human accounts can be linked via Google OAuth
        if (agent.account_type !== 'human') {
          console.log('[AUDIT] auth.oauth.callback_failure', {
            timestamp: new Date().toISOString(),
            error: 'link_failed',
            reason: 'Existing account is not a human account',
          });
          const response = NextResponse.redirect(`${SITE_URL}/?auth_error=link_failed`);
          response.headers.append('Set-Cookie', clearStateCookie);
          response.headers.append('Set-Cookie', clearNonceCookie);
          return response;
        }
        
        // Determine account state
        const isVerified = agent.email_verified === true || agent.is_verified === true;
        const hasPassword = !!agent.hashed_password;
        
        // Update agent with Google info
        const updateData: any = {
          google_id: sub,
          updated_at: new Date().toISOString(),
        };
        
        if (isVerified) {
          // B2: Existing verified account - bind Google (becomes 'both')
          updateData.provider = hasPassword ? 'both' : 'google';
          console.log('[AUDIT] auth.oauth.linked_to_verified', {
            timestamp: new Date().toISOString(),
            agentId: agent.id,
            provider: updateData.provider,
          });
        } else {
          // B3: Unverified email account - verify and bind Google
          updateData.email_verified = true;
          updateData.is_verified = true;
          updateData.provider = hasPassword ? 'both' : 'google';
          console.log('[AUDIT] auth.oauth.merged_unverified', {
            timestamp: new Date().toISOString(),
            agentId: agent.id,
            provider: updateData.provider,
          });
        }
        
        // Update the agent record
        const { error: updateError } = await supabase
          .from('agents')
          .update(updateData)
          .eq('id', agent.id);
          
        if (updateError) {
          console.warn('Failed to update agent with Google info:', updateError.message);
        } else {
          // Update local agent object
          Object.assign(agent, updateData);
        }
        
        // Try to link Google OAuth to existing account
        try {
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
            // Ignore unique violation - identity might already exist
            if (linkError.code !== '23505') {
              console.warn('Failed to link OAuth identity:', linkError.message);
            }
          } else {
            console.log('[AUDIT] auth.oauth.linked', {
              timestamp: new Date().toISOString(),
              agentId: agent.id,
              provider: 'google',
              linked: true,
            });
          }
        } catch (linkErr) {
          console.warn('OAuth identity linking error:', linkErr);
        }
      } else {
        // B1: Create new human agent via Google
        const username = email.split('@')[0] + '_' + crypto.randomBytes(4).toString('hex');
        
        const { data: newAgent, error: createError } = await supabase
          .from('agents')
          .insert({
            account_type: 'human',
            email: email,
            username: username,
            email_verified: email_verified,
            is_verified: email_verified,
            google_id: sub,
            provider: 'google',
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
          const response = NextResponse.redirect(`${SITE_URL}/?auth_error=create_failed`);
          response.headers.append('Set-Cookie', clearStateCookie);
          response.headers.append('Set-Cookie', clearNonceCookie);
          return response;
        }

        // Create OAuth identity record
        try {
          const { error: identityCreateError } = await supabase
            .from('oauth_identities')
            .insert({
              provider: 'google',
              provider_subject: sub,
              email: email,
              email_verified: email_verified,
              agent_id: newAgent.id,
            });

          if (identityCreateError && identityCreateError.code !== '23505') {
            console.warn('Failed to create OAuth identity:', identityCreateError.message);
          }
        } catch (identityErr) {
          console.warn('OAuth identity creation error:', identityErr);
        }

        agent = newAgent;
        isNewUser = true;
        
        // Create welcome notification (non-blocking, must not break login flow)
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
      const response = NextResponse.redirect(`${SITE_URL}/?auth_error=jwt_error`);
      response.headers.append('Set-Cookie', clearStateCookie);
      response.headers.append('Set-Cookie', clearNonceCookie);
      return response;
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

    // Redirect to auth complete page - properly set all cookies
    const response = NextResponse.redirect(`${SITE_URL}/auth/complete?source=google&new=${isNewUser}`);
    response.cookies.set('oauth_state', '', { httpOnly: true, secure: true, sameSite: 'lax', maxAge: 0, path: '/' });
    response.cookies.set('oauth_nonce', '', { httpOnly: true, secure: true, sameSite: 'lax', maxAge: 0, path: '/' });
    response.cookies.set('session', sessionToken, { httpOnly: true, secure: true, sameSite: 'lax', maxAge: 7 * 24 * 60 * 60, path: '/' });
    return response;

  } catch (error) {
    const errorDetails = error instanceof Error ? error.message : String(error);
    console.error('Google OAuth callback error:', error);
    console.log('[AUDIT] auth.oauth.callback_failure', {
      timestamp: new Date().toISOString(),
      error: 'exception',
      details: errorDetails,
    });
    
    // Redirect with detailed error for debugging
    const errorParam = encodeURIComponent(errorDetails.substring(0, 100));
    const response = NextResponse.redirect(`${SITE_URL}/?auth_error=server_error&details=${errorParam}`);
    response.cookies.set('oauth_state', '', { httpOnly: true, secure: true, sameSite: 'lax', maxAge: 0, path: '/' });
    response.cookies.set('oauth_nonce', '', { httpOnly: true, secure: true, sameSite: 'lax', maxAge: 0, path: '/' });
    return response;
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
