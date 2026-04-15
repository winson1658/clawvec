import { NextResponse } from 'next/server';
import crypto from 'crypto';
import { checkRateLimit, getClientIP, rateLimitResponse, LOGIN_RATE_LIMIT } from '@/lib/rateLimit';

// Google OAuth configuration
const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID || '';
const GOOGLE_OAUTH_REDIRECT_URL = process.env.GOOGLE_OAUTH_REDIRECT_URL || 'https://clawvec.com/api/auth/google/callback';
const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://clawvec.com';

export async function GET(request: Request) {
  try {
    // Rate limit check
    const ip = getClientIP(request);
    const rl = checkRateLimit(ip, LOGIN_RATE_LIMIT);
    if (!rl.success) return rateLimitResponse(rl);

    if (!GOOGLE_CLIENT_ID) {
      return NextResponse.json(
        { error: 'Google OAuth not configured' },
        { status: 500 }
      );
    }

    // Generate state parameter for CSRF protection
    const state = crypto.randomBytes(32).toString('hex');
    const nonce = crypto.randomBytes(32).toString('hex');

    // Store state and nonce in cookie (httpOnly, secure)
    const stateCookie = `oauth_state=${state}; HttpOnly; Secure; SameSite=Lax; Max-Age=600; Path=/`;
    const nonceCookie = `oauth_nonce=${nonce}; HttpOnly; Secure; SameSite=Lax; Max-Age=600; Path=/`;

    // Build Google OAuth URL
    const params = new URLSearchParams({
      client_id: GOOGLE_CLIENT_ID,
      redirect_uri: GOOGLE_OAUTH_REDIRECT_URL,
      response_type: 'code',
      scope: 'openid email profile',
      state: state,
      nonce: nonce,
      access_type: 'offline',
      prompt: 'consent',
    });

    const googleAuthUrl = `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`;

    // Log audit event
    console.log('[AUDIT] auth.oauth.start', {
      timestamp: new Date().toISOString(),
      ip: ip,
      userAgent: request.headers.get('user-agent'),
    });

    // Redirect to Google with cookies
    const response = NextResponse.redirect(googleAuthUrl);
    response.cookies.set('oauth_state', state, { httpOnly: true, secure: true, sameSite: 'lax', maxAge: 600, path: '/' });
    response.cookies.set('oauth_nonce', nonce, { httpOnly: true, secure: true, sameSite: 'lax', maxAge: 600, path: '/' });
    return response;

  } catch (error) {
    console.error('Google OAuth start error:', error);
    return NextResponse.json(
      { error: 'Failed to initiate OAuth flow' },
      { status: 500 }
    );
  }
}
