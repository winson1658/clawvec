/**
 * Admin Runbook Utilities
 * Provides dry-run and confirm_token patterns for destructive admin operations
 */

import { NextRequest } from 'next/server';

const adminSecret = process.env.ADMIN_SECRET_KEY || process.env.CRON_SECRET_KEY || '';

export function verifyAdmin(request: NextRequest): boolean {
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
  for (const [token, data] of confirmTokens.entries()) {
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
