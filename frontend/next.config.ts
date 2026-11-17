import type { NextConfig } from "next";

const DEFAULT_API_URL = "http://localhost:5108";

const nextConfig: NextConfig = {
  // Lets a build run beside a dev server (or a locked .next on Windows) without touching its output.
  distDir: process.env.NEXT_DIST_DIR || ".next",
  experimental: {
    // Avoid persistence-directory failures when reopening the dev server on Windows.
    turbopackFileSystemCacheForDev: false,
  },
  images: {
    // Every photo comes from src/lib/media.ts; only its hosts are allowed through the optimizer.
    remotePatterns: [{ protocol: "https", hostname: "images.unsplash.com", pathname: "/photo-**" }],
  },
  async rewrites() {
    // Same-origin proxy: session and CSRF cookies stay first-party and SameSite=Strict keeps working.
    const api = (process.env.API_BASE_URL || DEFAULT_API_URL).replace(/\/$/, "");
    return [{ source: "/api/:path*", destination: `${api}/api/:path*` }];
  },
};

export default nextConfig;
