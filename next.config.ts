import type { NextConfig } from "next";
import createNextIntlPlugin from "next-intl/plugin";

const withNextIntl = createNextIntlPlugin("./src/i18n/request.ts");

const nextConfig: NextConfig = {
  // Enable experimental features for better caching
  experimental: {
    // Optimize CSS
    optimizeCss: true,
  },

  // Image optimization with caching
  images: {
    minimumCacheTTL: 86400, // 24 hours for optimized images
    formats: ['image/webp', 'image/avif'],
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**',
      },
    ],
  },

  // Custom HTTP headers for static assets and pages
  async headers() {
    return [
      // Static assets (JS, CSS, images, fonts) - long cache
      {
        source: '/_next/static/:path*',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable',
          },
        ],
      },
      // Static files in public folder
      {
        source: '/:path*.(jpg|jpeg|png|webp|avif|gif|ico|svg|woff|woff2|ttf|otf|eot)',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=86400, stale-while-revalidate=604800',
          },
        ],
      },
      // API routes - handled by individual route handlers
      // Static pages - ISR with revalidation
      {
        source: '/:locale(ar|en)/hotlines',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=3600, stale-while-revalidate=86400',
          },
        ],
      },
      {
        source: '/:locale(ar|en)/resources',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=3600, stale-while-revalidate=86400',
          },
        ],
      },
      {
        source: '/:locale(ar|en)',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=60, stale-while-revalidate=300',
          },
        ],
      },
    ];
  },

  // Compress responses
  compress: true,

  // Production optimizations
  productionBrowserSourceMaps: false,
  
  // Powered by header (optional - disable for security)
  poweredByHeader: false,

  // Enable React strict mode
  reactStrictMode: true,

  // Configure trailing slashes for consistency
  trailingSlash: false,
};

export default withNextIntl(nextConfig);
