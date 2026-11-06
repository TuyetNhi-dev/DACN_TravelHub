import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    // Avoid persistence-directory failures when reopening the dev server on Windows.
    turbopackFileSystemCacheForDev: false,
  },
  async rewrites() {
    const api = (process.env.API_BASE_URL || process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:5108").replace(/\/$/, "");
    return [{ source: "/api/auth/:path*", destination: `${api}/api/auth/:path*` }];
  },
};

export default nextConfig;
