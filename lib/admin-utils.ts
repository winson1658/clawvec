/**
 * Admin Runbook Utilities
 * Provides dry-run and confirm_token patterns for destructive admin operations
 */

import { NextRequest } from 'next/server';

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
const adminSecret = process.env.ADMIN_SECRET_KEY || process.env.CRON_SECRET_KEY || '';

// Helper to create a service-role Supabase client
function getServiceClient() {
  return createClient(supabaseUrl, supabaseServiceKey);
}

export async function verifyAdmin(request: NextRequest): Promise<{ success: boolean; error?: string; status?: number; adminId?: string }> {
  // 1. Check Bearer token (for API/cron access)
  const auth = request.headers.get('authorization') || '';
  const bearerToken = auth.replace(/^Bearer\s+/i, '');
  if (bearerToken === adminSecret && adminSecret.length > 0) {
    return { success: true };
  }

  // 2. Check cookie-based admin session (for browser access)
  try {
    const { jwtVerify } = await import('jose');
    const JWT_SECRET = process.env.ADMIN_JWT_SECRET || process.env.JWT_SECRET || 'your-secret-key';
    const secretKey = new TextEncoder().encode(JWT_SECRET);
    
    const cookieToken = request.cookies.get('admin_session')?.value || '';
    
    if (cookieToken) {
      const { payload } = await jwtVerify(cookieToken, secretKey, { clockTolerance: 60 });
      if (payload.role === 'admin') {
        return { success: true, adminId: payload.id as string };
      }
    }
  } catch (err) {
    // Cookie invalid or expired, fall through to legacy header check
  }

  // 3. Legacy: Check x-admin-token header (for backward compatibility)
  try {
    const token = request.headers.get('x-admin-token') || '';
    if (token) {
      const supabase = getServiceClient();
      
      const parts = token.split('.');
      if (parts.length >= 2) {
        const payload = JSON.parse(Buffer.from(parts[1], 'base64').toString());
        const userId = payload.sub || payload.id;
        
        if (userId) {
          const { data: agent, error: agentError } = await supabase
            .from('agents')
            .select('id, role')
            .eq('id', userId)
            .single();

          if (!agentError && agent && agent.role === 'admin') {
            return { success: true, adminId: agent.id };
          }
        }
      }
    }
  } catch (err) {
    console.error('Admin verification error:', err);
  }

  return { success: false, error: 'Unauthorized. Please sign in.', status: 401 };
}

// Legacy function for backward compatibility
export function verifyAdminLegacy(request: NextRequest): boolean {
  const auth = request.headers.get('authorization') || '';
  const token = auth.replace(/^Bearer\s+/i, '');
  return token === adminSecret && adminSecret.length > 0;
}

// In-memory store for confirm tokens (use Redis in production)
const confirmTokens = new Map<string, { action: string; expiresAt: number; payload: any }>();

function generateToken(): string {
  return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
}

export function cleanupExpiredTokens() {
  const now = Date.now();
  const entries = Array.from(confirmTokens.entries());
  for (let i = 0; i < entries.length; i++) {
    const [token, data] = entries[i];
    if (data.expiresAt < now) {
      confirmTokens.delete(token);
    }
  }
}

export function createConfirmToken(action: string, payload: any, ttlMinutes: number = 5): string {
  const token = generateToken();
  confirmTokens.set(token, {
    action,
    expiresAt: Date.now() + ttlMinutes * 60 * 1000,
    payload
  });
  return token;
}

export function validateConfirmToken(
  token: string,
  action: string,
  expectedPayload?: any
): { valid: boolean; error?: { code: string; message: string } } {
  cleanupExpiredTokens();
  
  const data = confirmTokens.get(token);
  if (!data || data.action !== action) {
    return {
      valid: false,
      error: {
        code: 'CONFIRM_REQUIRED',
        message: 'Dry-run required first. Call with ?dry_run=true to get a confirm_token.'
      }
    };
  }

  if (expectedPayload && JSON.stringify(data.payload) !== JSON.stringify(expectedPayload)) {
    return {
      valid: false,
      error: {
        code: 'STALE_TOKEN',
        message: 'Data has changed since dry-run. Please run dry-run again.'
      }
    };
  }

  return { valid: true };
}

export function consumeConfirmToken(token: string): void {
  confirmTokens.delete(token);
}

export interface DryRunResult {
  dry_run: true;
  confirm_token: string;
  expires_in: string;
  warning: string;
}

export function createDryRunResponse(
  action: string,
  preview: any,
  ttlMinutes: number = 5
): DryRunResult {
  const token = createConfirmToken(action, preview, ttlMinutes);
  return {
    dry_run: true,
    confirm_token: token,
    expires_in: `${ttlMinutes} minutes`,
    warning: '⚠️ To execute, call again with ?confirm_token=<token>'
  };
}
