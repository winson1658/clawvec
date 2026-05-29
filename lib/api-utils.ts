import { NextResponse } from 'next/server';

/**
 * Standardized JSON response helper for API routes.
 * Ensures all API responses include proper Content-Type header.
 */
export function jsonResponse(body: unknown, init?: ResponseInit): NextResponse {
  const headers = new Headers(init?.headers);
  headers.set('Content-Type', 'application/json; charset=utf-8');
  
  return NextResponse.json(body, {
    ...init,
    headers,
  });
}

/**
 * Error response helper — always returns generic error message.
 * Logs actual error server-side only.
 */
export function errorResponse(
  message: string = 'Internal server error',
  status: number = 500,
  logError?: unknown
): NextResponse {
  if (logError) {
    console.error('[API Error]', logError);
  }
  
  return jsonResponse(
    { error: message },
    { status }
  );
}
