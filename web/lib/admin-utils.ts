/**
 * Admin Runbook Utilities
 * Provides dry-run and confirm_token patterns for destructive admin operations
 */

import { NextRequest } from 'next/server';

const adminSecret = process.env.ADMIN_SECRET_KEY || '';

// Simple in-memory rate limiter (use Redis in production)
const rateLimitStore = new Map<string, { count: number; resetAt: number }>();
const RATE_LIMIT_MAX = 10; // requests per minute
const RATE_LIMIT_WINDOW = 60 * 1000; // 1 minute

function checkRateLimit(ip: string): { allowed: boolean; retryAfter?: number } {
  const now = Date.now();
  const record = rateLimitStore.get(ip);

  if (!record || record.resetAt < now) {
    rateLimitStore.set(ip, { count: 1, resetAt: now + RATE_LIMIT_WINDOW });
    return { allowed: true };
  }

  if (record.count >= RATE_LIMIT_MAX) {
    return { allowed: false, retryAfter: Math.ceil((record.resetAt - now) / 1000) };
  }

  record.count++;
  return { allowed: true };
}

export function verifyAdmin(request: NextRequest): { valid: boolean; error?: { code: string; message: string }; status?: number; adminId?: string } {
  // 1. Rate limit check
  const ip = request.headers.get('x-forwarded-for') || 'unknown';
  const rateLimit = checkRateLimit(ip);
  if (!rateLimit.allowed) {
    return {
      valid: false,
      error: { code: 'RATE_LIMITED', message: `Too many requests. Retry after ${rateLimit.retryAfter}s.` },
      status: 429
    };
  }

  // 2. Secret check (no fallback to CRON_SECRET)
  const auth = request.headers.get('authorization') || '';
  const token = auth.replace(/^Bearer\s+/i, '');

  if (!adminSecret || adminSecret.length === 0) {
    return {
      valid: false,
      error: { code: 'NOT_CONFIGURED', message: 'ADMIN_SECRET_KEY not set' },
      status: 500
    };
  }

  if (token !== adminSecret) {
    return {
      valid: false,
      error: { code: 'UNAUTHORIZED', message: 'Invalid admin credentials' },
      status: 401
    };
  }

  return { valid: true };
}

// In-memory store for confirm tokens (use Redis in production)
const confirmTokens = new Map<string, { action: string; expiresAt: number; payload: any }>();

function generateToken(): string {
  return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
}

export function cleanupExpiredTokens() {
  const now = Date.now();
  const entries = Array.from(confirmTokens.entries());
  for (const [token, data] of entries) {
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
