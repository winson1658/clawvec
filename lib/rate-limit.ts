/**
 * Simple in-memory rate limiter for Next.js API routes.
 * Uses IP-based tracking with sliding window.
 * 
 * NOTE: In-memory store is per-instance (serverless functions).
 * For production scale, migrate to Redis.
 */

interface RateLimitEntry {
  count: number;
  resetAt: number;
}

const store = new Map<string, RateLimitEntry>();

// Cleanup expired entries every 5 minutes
setInterval(() => {
  const now = Date.now();
  const keysToDelete: string[] = [];
  store.forEach((entry, key) => {
    if (entry.resetAt < now) {
      keysToDelete.push(key);
    }
  });
  keysToDelete.forEach(key => store.delete(key));
}, 300000);

export interface RateLimitConfig {
  windowMs: number;      // Time window in milliseconds
  maxRequests: number;   // Max requests per window
  keyPrefix?: string;    // Optional prefix for the key
}

export interface RateLimitResult {
  success: boolean;
  limit: number;
  remaining: number;
  resetAt: number;
  retryAfter?: number;
}

/**
 * Check if a request should be rate limited.
 * @param identifier - IP address or user ID
 * @param config - Rate limit configuration
 */
export function checkRateLimit(
  identifier: string,
  config: RateLimitConfig
): RateLimitResult {
  const now = Date.now();
  const key = config.keyPrefix ? `${config.keyPrefix}:${identifier}` : identifier;
  
  const entry = store.get(key);
  
  if (!entry || entry.resetAt < now) {
    // New window
    const resetAt = now + config.windowMs;
    store.set(key, { count: 1, resetAt });
    return {
      success: true,
      limit: config.maxRequests,
      remaining: config.maxRequests - 1,
      resetAt,
    };
  }
  
  if (entry.count >= config.maxRequests) {
    // Rate limited
    return {
      success: false,
      limit: config.maxRequests,
      remaining: 0,
      resetAt: entry.resetAt,
      retryAfter: Math.ceil((entry.resetAt - now) / 1000),
    };
  }
  
  // Increment count
  entry.count++;
  return {
    success: true,
    limit: config.maxRequests,
    remaining: config.maxRequests - entry.count,
    resetAt: entry.resetAt,
  };
}

// Predefined configs for common use cases
export const RateLimits = {
  // Strict: Admin operations (10 per minute)
  admin: { windowMs: 60000, maxRequests: 10, keyPrefix: 'admin' },
  
  // Auth: Login/register (5 per minute)
  auth: { windowMs: 60000, maxRequests: 5, keyPrefix: 'auth' },
  
  // Standard: Write operations (30 per minute)
  write: { windowMs: 60000, maxRequests: 30, keyPrefix: 'write' },
  
  // Generous: Read operations (100 per minute)
  read: { windowMs: 60000, maxRequests: 100, keyPrefix: 'read' },
  
  // Strict: Sensitive operations like password reset (3 per hour)
  sensitive: { windowMs: 3600000, maxRequests: 3, keyPrefix: 'sensitive' },
} as const;

/**
 * Legacy rate limit check for backward compatibility.
 * Uses IP-based tracking with default config (100 req/min).
 * @deprecated Use checkRateLimit(identifier, config) instead.
 */
export function checkRateLimitLegacy(request: Request): { allowed: boolean; limit: number; remaining: number; resetAt: number; retryAfter?: number } {
  const ip = getClientIP(request);
  const result = checkRateLimit(ip, RateLimits.read);
  return {
    allowed: result.success,
    limit: result.limit,
    remaining: result.remaining,
    resetAt: result.resetAt,
    retryAfter: result.retryAfter,
  };
}

export function rateLimitHeaders(result: { retryAfter?: number }): Record<string, string> {
  const headers: Record<string, string> = {};
  if (result.retryAfter) {
    headers['Retry-After'] = String(result.retryAfter);
  }
  return headers;
}

/**
 * Get client IP from request.
 * Checks X-Forwarded-For, X-Real-IP, and fallback to 'unknown'.
 */
export function getClientIP(request: Request): string {
  const forwarded = request.headers.get('x-forwarded-for');
  if (forwarded) {
    return forwarded.split(',')[0].trim();
  }
  
  const realIP = request.headers.get('x-real-ip');
  if (realIP) {
    return realIP;
  }
  
  // Fallback - not ideal but prevents crashes
  return 'unknown';
}
