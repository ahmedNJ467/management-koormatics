/** @type {import('next').NextConfig} */
const nextConfig = {
  // Next.js 15 optimizations - simplified to prevent chunk issues
  // Disable optimizePackageImports for lucide-react on Webpack to avoid import-time errors in Pages Router
  // experimental: {
  //   optimizePackageImports: ["lucide-react"],
  // },

  // Use custom build directory to avoid OneDrive file locking issues
  // distDir: ".next-build", // Disabled for Vercel deployment

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
    // Unique tag per build used for client-side cache busting on HTML
    NEXT_PUBLIC_BUILD_TAG: `${require("./package.json").version}-${Math.floor(
      Date.now() / 1000
    )}`,
  },

  // API rewrites
  async rewrites() {
    return [
      {
        source: "/api/:path*",
        destination: "/api/:path*",
      },
    ];
  },

  // Performance optimizations
  compress: true,
  poweredByHeader: false,

  // Bundle optimization - simplified to avoid chunk loading issues
  webpack: (config, { dev, isServer }) => {
    // Only apply optimizations in production
    if (!dev && !isServer) {
      // Use Next.js default splitChunks with minimal customization
      config.optimization.splitChunks = {
        chunks: "all",
        cacheGroups: {
          default: {
            minChunks: 2,
            priority: -20,
            reuseExistingChunk: true,
          },
          vendor: {
            test: /[\\/]node_modules[\\/]/,
            name: "vendors",
            priority: -10,
            chunks: "all",
          },
        },
      };
    }

    return config;
  },

  // Windows-specific optimizations
  reactStrictMode: true, // Enable strict mode for better Fast Refresh support

  // Security + Cache headers (avoid aggressive page caching)
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
      // Moderately cache Next Image optimizer responses
      {
        source: "/_next/image",
        headers: [
          {
            key: "Cache-Control",
            value:
              "public, max-age=60, s-maxage=60, stale-while-revalidate=300",
          },
        ],
      },
      // Public images: cache but allow revalidation
      {
        source: "/images/:path*",
        headers: [
          {
            key: "Cache-Control",
            value: "public, max-age=604800, must-revalidate",
          },
        ],
      },
    ];
  },
};

module.exports = nextConfig;
