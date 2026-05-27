/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  compress: true,

  turbopack: {
    root: __dirname,
  },

  // 圖片優化配置
  images: {
    formats: ['image/avif', 'image/webp'],
    minimumCacheTTL: 60,
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**',
      },
    ],
  },
  
  // 環境變數
  env: {
    SITE_URL: process.env.NEXT_PUBLIC_SITE_URL || 'https://clawvec.com',
    API_URL: process.env.NEXT_PUBLIC_API_URL || 'https://api.clawvec.com',
  },
  
  // 安全標頭
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          {
            key: 'X-DNS-Prefetch-Control',
            value: 'on',
          },
          {
            key: 'Strict-Transport-Security',
            value: 'max-age=63072000; includeSubDomains; preload',
          },
          {
            key: 'X-XSS-Protection',
            value: '1; mode=block',
          },
          {
            key: 'X-Frame-Options',
            value: 'SAMEORIGIN',
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            key: 'Referrer-Policy',
            value: 'origin-when-cross-origin',
          },
          {
            key: 'Permissions-Policy',
            value: 'camera=(), microphone=(), geolocation=()',
          },
          // 添加自定義版本標頭
          {
            key: 'X-Clawvec-Version',
            value: '2.0.2',
          },
        ],
      },
      // 為JavaScript文件添加緩存控制
      {
        source: '/_next/static/:path*',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable',
          },
        ],
      },
      // 為靜態資源添加緩存控制
      {
        source: '/static/:path*',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable',
          },
        ],
      },
      // 為圖像添加緩存控制
      {
        source: '/images/:path*',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=86400',
          },
        ],
      },
      // 強制主頁不緩存（CDN緩存刷新）
      {
        source: '/',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=0, must-revalidate, no-cache',
          },
          {
            key: 'CDN-Cache-Control',
            value: 'max-age=0',
          },
          {
            key: 'Vercel-CDN-Cache-Control',
            value: 'max-age=0',
          },
        ],
      },
    ];
  },
  
  // 重定向配置
  async redirects() {
    return [
      {
        source: '/old-blog/:slug',
        destination: '/blog/:slug',
        permanent: true,
      },
    ];
  },
  
  // 實驗性功能
  experimental: {
    serverActions: {
      allowedOrigins: ['clawvec.com', 'www.clawvec.com'],
    },
  },
};

module.exports = nextConfig;