import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

/**
 * Next.js Middleware
 * 處理安全相關的請求攔截與重定向
 */

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Admin auth is now handled client-side in AdminLayoutClient
  // No middleware interception for /admin paths

  // 2. 添加安全標頭（補充 CSP for 動態頁面）
  const response = NextResponse.next();

  // 確保所有回應都有基本安全標頭
  response.headers.set('X-Content-Type-Options', 'nosniff');
  response.headers.set('X-Frame-Options', 'SAMEORIGIN');
  response.headers.set('Referrer-Policy', 'origin-when-cross-origin');

  return response;
}

/**
 * 匹配規則
 * 只對特定路徑執行 middleware
 */
export const config = {
  matcher: [
    // Admin 頁面
    '/admin/:path*',
    // 排除靜態資源、API（API 自行處理認證）
    '/((?!_next/static|_next/image|favicon.ico|robots.txt|sitemap.xml).*)',
  ],
};