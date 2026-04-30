import { SignJWT, jwtVerify } from 'jose';
import { createClient } from '@supabase/supabase-js';
import { NextRequest, NextResponse } from 'next/server';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

const secretKey = new TextEncoder().encode(JWT_SECRET);

/**
 * Create a signed JWT token
 */
export async function createToken(payload: { id: string; username?: string; email?: string; account_type?: string }) {
  return new SignJWT(payload)
    .setProtectedHeader({ alg: 'HS256' })
    .setExpirationTime('7d')
    .setIssuedAt()
    .sign(secretKey);
}

/**
 * Verify JWT Token (case-insensitive Authorization header)
 */
export async function verifyToken(authHeader: string | null): Promise<{ id: string; [key: string]: any } | null> {
  if (!authHeader) return null;

  // Case-insensitive Bearer extraction
  const match = authHeader.match(/^Bearer\s+(.+)$/i);
  if (!match) return null;

  const token = match[1].trim();

  try {
    const { payload } = await jwtVerify(token, secretKey, {
      clockTolerance: 60,
    });

    const id = (payload.id as string) || (payload.sub as string);
    if (!id) return null;

    return payload as { id: string; [key: string]: any };
  } catch {
    return null;
  }
}

/**
 * Extract bearer token from request headers (case-insensitive)
 */
export function getBearerToken(request: NextRequest): string | null {
  const auth = request.headers.get('Authorization') || request.headers.get('authorization');
  if (!auth) return null;
  const match = auth.match(/^Bearer\s+(.+)$/i);
  return match ? match[1].trim() : null;
}

/**
 * Verify API Key (AI agent authentication)
 * Format: base64({"user_id": "uuid"}) — verified against DB
 */
export async function verifyApiKey(apiKey: string): Promise<{ id: string; [key: string]: any } | null> {
  const supabase = createClient(supabaseUrl, supabaseServiceKey);

  try {
    const decoded = JSON.parse(Buffer.from(apiKey, 'base64').toString());

    const { data: user } = await supabase
      .from('agents')
      .select('id, account_type, email_verified')
      .eq('id', decoded.user_id)
      .single();

    if (!user) return null;

    return { ...decoded, ...user };
  } catch {
    return null;
  }
}

/**
 * Get current authenticated user from request.
 * Returns DB-verified agent data (id, username, account_type, etc.)
 * Token payload username is NOT trusted — always fetched from DB.
 */
export async function getCurrentUser(request: NextRequest) {
  // Try Authorization header (Bearer token)
  const authHeader = request.headers.get('Authorization') || request.headers.get('authorization');
  const jwtPayload = await verifyToken(authHeader);

  if (jwtPayload?.id) {
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    const { data: agent } = await supabase
      .from('agents')
      .select('id, username, account_type, email_verified, email, display_name, avatar_url')
      .eq('id', jwtPayload.id)
      .single();

    if (agent) return { ...jwtPayload, ...agent };
  }

  // Try API Key
  const apiKey = request.headers.get('X-API-Key') || request.headers.get('x-api-key');
  if (apiKey) {
    return await verifyApiKey(apiKey);
  }

  return null;
}

/**
 * Require authentication from any Request (not just NextRequest).
 * Returns agent data or throws response.
 */
export async function requireAuthFromRequest(request: Request): Promise<{ id: string; username: string; account_type: string; [key: string]: any }> {
  const authHeader = request.headers.get('Authorization') || request.headers.get('authorization');
  const jwtPayload = await verifyToken(authHeader);

  if (jwtPayload?.id) {
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    const { data: agent } = await supabase
      .from('agents')
      .select('id, username, account_type, email_verified, email, display_name, avatar_url')
      .eq('id', jwtPayload.id)
      .single();

    if (agent) return { ...jwtPayload, ...agent };
  }

  throw NextResponse.json(
    { success: false, error: { code: 'UNAUTHENTICATED', message: 'Login required' } },
    { status: 401 }
  );
}

/**
 * Check permissions
 */
export function checkPermission(
  user: { account_type: string; email_verified?: boolean } | null,
  requiredRole: 'visitor' | 'human' | 'ai' | 'admin',
  requireVerified: boolean = false
): boolean {
  if (!user) return requiredRole === 'visitor';

  if (requireVerified && user.account_type === 'human' && !user.email_verified) {
    return false;
  }

  if (requiredRole === 'admin') {
    return user.account_type === 'admin';
  }

  if (requiredRole === 'ai') {
    return user.account_type === 'ai' || user.account_type === 'admin';
  }

  if (requiredRole === 'human') {
    return user.account_type === 'human' || user.account_type === 'admin';
  }

  return true;
}

/**
 * Authentication middleware wrapper
 */
export function withAuth(
  handler: (req: NextRequest, user: any) => Promise<NextResponse>,
  options: {
    requiredRole?: 'visitor' | 'human' | 'ai' | 'admin';
    requireVerified?: boolean;
  } = {}
) {
  return async (req: NextRequest) => {
    const user = await getCurrentUser(req);

    if (!user && options.requiredRole && options.requiredRole !== 'visitor') {
      return NextResponse.json(
        { success: false, error: { code: 'UNAUTHENTICATED', message: 'Login required' } },
        { status: 401 }
      );
    }

    if (options.requiredRole && !checkPermission(user as { account_type: string; email_verified?: boolean } | null, options.requiredRole, options.requireVerified)) {
      return NextResponse.json(
        { success: false, error: { code: 'FORBIDDEN', message: 'Insufficient permissions' } },
        { status: 403 }
      );
    }

    return handler(req, user);
  };
}

/**
 * Create standard error response (hides raw DB errors in production)
 */
export function createErrorResponse(
  status: number,
  code: string,
  message: string,
  details?: unknown
) {
  const isDev = process.env.NODE_ENV === 'development';
  return NextResponse.json(
    {
      success: false,
      error: {
        code,
        message,
        ...(details && isDev ? { details } : {})
      }
    },
    { status }
  );
}

/**
 * Create standard success response
 */
export function createSuccessResponse(data: unknown, meta?: unknown) {
  return NextResponse.json({ success: true, data, ...(meta ? { meta } : {}) });
}
