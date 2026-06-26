import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: false,
  // Force API routes to use Node.js runtime (not Edge)
  // This fixes Supabase fetch issues in Vercel Edge Runtime
};

export default nextConfig;
