/**
 * Simple in-memory rate limiter for API endpoints.
 * Uses IP address as key. Resets every windowMs.
 * Note: In serverless env, this is per-instance only.
 */

interface RateLimitEntry {
  count: number;
  resetAt: number;
}

const store = new Map<string, RateLimitEntry>();

const WINDOW_MS = 60 * 1000; // 1 minute
const MAX_REQUESTS = 30; // 30 requests per minute per IP

function getClientIP(request: Request): string {
  // Try various headers for the client IP
  const headers = request.headers;
  const forwarded = headers.get('x-forwarded-for');
  if (forwarded) {
    return forwarded.split(',')[0].trim();
  }
  const realIP = headers.get('x-real-ip');
  if (realIP) return realIP;
  return 'unknown';
}

export function checkRateLimit(request: Request): {
  allowed: boolean;
  remaining: number;
  resetAt: number;
} {
  const ip = getClientIP(request);
  const now = Date.now();

  const entry = store.get(ip);

  if (!entry || now > entry.resetAt) {
    // First request or window expired
    const resetAt = now + WINDOW_MS;
    store.set(ip, { count: 1, resetAt });
    return { allowed: true, remaining: MAX_REQUESTS - 1, resetAt };
  }

  if (entry.count >= MAX_REQUESTS) {
    return { allowed: false, remaining: 0, resetAt: entry.resetAt };
  }

  entry.count++;
  return { allowed: true, remaining: MAX_REQUESTS - entry.count, resetAt: entry.resetAt };
}

export function rateLimitHeaders(result: { allowed: boolean; remaining: number; resetAt: number }): Record<string, string> {
  return {
    'X-RateLimit-Limit': String(MAX_REQUESTS),
    'X-RateLimit-Remaining': String(Math.max(0, result.remaining)),
    'X-RateLimit-Reset': String(Math.ceil(result.resetAt / 1000)),
  };
}
