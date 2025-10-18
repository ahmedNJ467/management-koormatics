/** @type {import('next').NextConfig} */
const nextConfig = {
  // Fleet portal specific configuration
  env: {
    NEXT_PUBLIC_APP_SUBDOMAIN: 'fleet',
    NEXT_PUBLIC_PORTAL_TYPE: 'fleet',
  },
  
  // Use custom build directory for fleet portal
  distDir: ".next-fleet",
  
  // Image optimization
  images: {
    domains: ["localhost"],
    formats: ["image/webp", "image/avif"],
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048, 3840],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
    minimumCacheTTL: 60,
  },

  // Environment variables
  env: {
    NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
    NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    NEXT_PUBLIC_APP_VERSION: require("./package.json").version,
    NEXT_PUBLIC_APP_SUBDOMAIN: 'fleet',
    NEXT_PUBLIC_PORTAL_TYPE: 'fleet',
    // Unique tag per build used for client-side cache busting on HTML
    NEXT_PUBLIC_BUILD_TAG: `fleet-${require("./package.json").version}-${Math.floor(
      Date.now() / 1000
    )}`,
  },

  // Performance optimizations
  compress: true,
  poweredByHeader: false,

  // Security + Cache headers
  async headers() {
    return [
      // Default security headers for all routes
      {
        source: "/(.*)",
        headers: [
          { key: "X-Frame-Options", value: "DENY" },
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "Referrer-Policy", value: "origin-when-cross-origin" },
        ],
      },
      // Never cache HTML/page responses so UI updates show without manual cache clear
      {
        source: "/((?!_next/static|_next/image|images|favicon.ico).*)",
        headers: [{ key: "Cache-Control", value: "no-store, must-revalidate" }],
      },
      // Cache static assets aggressively (hashed filenames)
      {
        source: "/_next/static/:path*",
        headers: [
          {
            key: "Cache-Control",
            value: "public, max-age=31536000, immutable",
          },
        ],
      },
    ];
  },
};

module.exports = nextConfig;
