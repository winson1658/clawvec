import { NextResponse } from 'next/server';

/**
 * Shared cache configuration for Clawvec API responses.
 * 
 * All API endpoints use the same pattern:
 * - CDN cache: 30s (Vercel Edge / Cloudflare)
 * - stale-while-revalidate: 120s (serve stale while fetching fresh)
 * - stale-if-error: 86400s (24h fallback if origin is down)
 * - Browser cache: 10s
 */
const DEFAULT_CACHE_HEADERS: Record<string, string> = {
  'CDN-Cache-Control': 'public, max-age=30, stale-while-revalidate=120, stale-if-error=86400',
  'Cache-Control': 'public, max-age=10',
};

/**
 * Wrap any JSON data with caching headers.
 * Use this for public GET endpoints where data freshness is not critical.
 */
export function cachedJson<T>(
  data: T,
  status: number = 200,
  customHeaders?: Record<string, string>
): NextResponse {
  return NextResponse.json(data, {
    status,
    headers: {
      ...DEFAULT_CACHE_HEADERS,
      ...customHeaders,
    },
  });
}

/**
 * For list endpoints with pagination.
 */
export function cachedListResponse(
  success: boolean,
  data: any,
  additionalHeaders?: Record<string, string>
): NextResponse {
  return NextResponse.json(
    { success, data },
    {
      headers: {
        ...DEFAULT_CACHE_HEADERS,
        ...additionalHeaders,
      },
    }
  );
}
