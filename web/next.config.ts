import type { NextConfig } from "next";

// HTTP 安全標頭 (Phase 3 安全修復)
const securityHeaders = [
  // 防止點擊劫持
  { key: 'X-Frame-Options', value: 'SAMEORIGIN' },
  // 防止 MIME 類型嗅探
  { key: 'X-Content-Type-Options', value: 'nosniff' },
  // XSS 保護
  { key: 'X-XSS-Protection', value: '1; mode=block' },
  // DNS 預取控制
  { key: 'X-DNS-Prefetch-Control', value: 'on' },
  // Referrer 政策
  { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
  // 權限政策
  { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=()' },
  // HSTS (強制 HTTPS)
  { key: 'Strict-Transport-Security', value: 'max-age=63072000; includeSubDomains; preload' },
  // CSP (內容安全政策) - 2026-03-29 refined
  { 
    key: 'Content-Security-Policy', 
    value: [
      "default-src 'self'",
      "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://vercel.live",
      "style-src 'self' 'unsafe-inline'",
      "img-src 'self' data: https: blob:",
      "font-src 'self' data:",
      "connect-src 'self' https://*.supabase.co https://vercel.live wss://*.supabase.co https://*.upstash.io",
      "object-src 'none'",
      "frame-src 'none'",
      "frame-ancestors 'self'",
      "base-uri 'self'",
      "form-action 'self'",
      "upgrade-insecure-requests",
    ].join('; ')
  },
];

const nextConfig: NextConfig = {
  // TypeScript - 暫時忽略建置錯誤
  typescript: {
    ignoreBuildErrors: true,
  },
  
  // Performance optimizations
  compress: true,
  
  // Image optimization
  images: {
    formats: ['image/avif', 'image/webp'],
    minimumCacheTTL: 60,
  },

  // Headers for caching + security
  async headers() {
    return [
      // 全站安全標頭
      {
        source: '/:path*',
        headers: securityHeaders,
      },
      // API 路由特殊標頭
      {
        source: '/api/:path*',
        headers: [
          ...securityHeaders,
          { key: 'Cache-Control', value: 'no-store, max-age=0' },
        ],
      },
      // 靜態資源緩存
      {
        source: '/logo.svg',
        headers: [
          { key: 'Cache-Control', value: 'public, max-age=31536000, immutable' },
        ],
      },
      {
        source: '/favicon.svg',
        headers: [
          { key: 'Cache-Control', value: 'public, max-age=31536000, immutable' },
        ],
      },
      {
        source: '/og-image.svg',
        headers: [
          { key: 'Cache-Control', value: 'public, max-age=86400' },
        ],
      },
      {
        source: '/(.*)\\.js',
        headers: [
          { key: 'Cache-Control', value: 'public, max-age=31536000, immutable' },
        ],
      },
      {
        source: '/(.*)\\.css',
        headers: [
          { key: 'Cache-Control', value: 'public, max-age=31536000, immutable' },
        ],
      },
    ];
  },

  // Experimental performance features
  experimental: {
    optimizeCss: true,
  },
};

export default nextConfig;
