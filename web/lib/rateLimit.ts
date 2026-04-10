/**
 * In-memory sliding window rate limiter for Vercel Serverless Functions.
 * 
 * Note: Each serverless instance has its own memory, so this provides
 * per-instance rate limiting. For distributed rate limiting, use
 * Upstash Redis (@upstash/ratelimit) with env vars:
 *   UPSTASH_REDIS_REST_URL, UPSTASH_REDIS_REST_TOKEN
 * 
 * This is still effective because:
 * 1. Brute force attacks hit the same instance within the window
 * 2. It prevents rapid-fire requests from a single IP
 * 3. It's zero-dependency and zero-cost
 */

interface RateLimitEntry {
  timestamps: number[];
}

// Global store (persists across requests in the same serverless instance)
const store = new Map<string, RateLimitEntry>();

// Cleanup stale entries every 5 minutes
let lastCleanup = Date.now();
const CLEANUP_INTERVAL = 5 * 60 * 1000;

function cleanup(windowMs: number) {
  const now = Date.now();
  if (now - lastCleanup < CLEANUP_INTERVAL) return;
  lastCleanup = now;
  
  for (const [key, entry] of store.entries()) {
    // Remove entries with no recent timestamps
    const recent = entry.timestamps.filter(t => now - t < windowMs);
    if (recent.length === 0) {
      store.delete(key);
    } else {
      entry.timestamps = recent;
    }
  }
}

interface RateLimitConfig {
  /** Maximum number of requests in the window */
  limit: number;
  /** Window size in milliseconds (default: 15 minutes) */
  windowMs?: number;
  /** Prefix for the key (to separate different endpoints) */
  prefix?: string;
}

interface RateLimitResult {
  success: boolean;
  limit: number;
  remaining: number;
  reset: number; // Unix timestamp (seconds) when the window resets
}

/**
 * Check rate limit for a given identifier (usually IP address).
 */
export function checkRateLimit(
  identifier: string,
  config: RateLimitConfig
): RateLimitResult {
  const { limit, windowMs = 15 * 60 * 1000, prefix = 'global' } = config;
  const now = Date.now();
  const key = `${prefix}:${identifier}`;

  // Periodic cleanup
  cleanup(windowMs);

  // Get or create entry
  let entry = store.get(key);
  if (!entry) {
    entry = { timestamps: [] };
    store.set(key, entry);
  }

  // Filter to only timestamps within the window
  entry.timestamps = entry.timestamps.filter(t => now - t < windowMs);

  // Check if over limit
  if (entry.timestamps.length >= limit) {
    const oldestInWindow = Math.min(...entry.timestamps);
    const resetAt = Math.ceil((oldestInWindow + windowMs) / 1000);
    return {
      success: false,
      limit,
      remaining: 0,
      reset: resetAt,
    };
  }

  // Add current request
  entry.timestamps.push(now);

  return {
    success: true,
    limit,
    remaining: limit - entry.timestamps.length,
    reset: Math.ceil((now + windowMs) / 1000),
  };
}

/**
 * Extract client IP from request headers (Vercel/Cloudflare compatible).
 */
export function getClientIP(request: Request): string {
  // Vercel provides this header
  const forwarded = request.headers.get('x-forwarded-for');
  if (forwarded) {
    return forwarded.split(',')[0].trim();
  }
  
  // Cloudflare
  const cfIP = request.headers.get('cf-connecting-ip');
  if (cfIP) return cfIP;

  // Fallback
  const realIP = request.headers.get('x-real-ip');
  if (realIP) return realIP;

  return 'unknown';
}

/**
 * Create a rate limit error response with proper headers.
 */
export function rateLimitResponse(result: RateLimitResult): Response {
  return new Response(
    JSON.stringify({
      error: 'Too many requests. Please try again later.',
      retryAfter: result.reset - Math.floor(Date.now() / 1000),
    }),
    {
      status: 429,
      headers: {
        'Content-Type': 'application/json',
        'X-RateLimit-Limit': String(result.limit),
        'X-RateLimit-Remaining': '0',
        'X-RateLimit-Reset': String(result.reset),
        'Retry-After': String(result.reset - Math.floor(Date.now() / 1000)),
      },
    }
  );
}

// ─── Preset configurations ───

/** Auth endpoints: 20 requests per 15 minutes */
export const AUTH_RATE_LIMIT: RateLimitConfig = {
  limit: 20,
  windowMs: 15 * 60 * 1000,
  prefix: 'auth',
};

/** Login specifically: 10 attempts per 15 minutes (stricter) */
export const LOGIN_RATE_LIMIT: RateLimitConfig = {
  limit: 10,
  windowMs: 15 * 60 * 1000,
  prefix: 'login',
};

/** Password reset: 5 requests per 15 minutes (strictest) */
export const PASSWORD_RESET_RATE_LIMIT: RateLimitConfig = {
  limit: 5,
  windowMs: 15 * 60 * 1000,
  prefix: 'pwd-reset',
};

/** Admin endpoints: 30 requests per 15 minutes */
export const ADMIN_RATE_LIMIT: RateLimitConfig = {
  limit: 30,
  windowMs: 15 * 60 * 1000,
  prefix: 'admin',
};

/** Agent gate: 15 requests per 15 minutes */
export const AGENT_GATE_RATE_LIMIT: RateLimitConfig = {
  limit: 15,
  windowMs: 15 * 60 * 1000,
  prefix: 'agent-gate',
};
