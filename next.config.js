/** @type {import('next').NextConfig} */
const nextConfig = {
  // ✅ Disable React Strict Mode
  reactStrictMode: false,

  // ✅ ESLint configuration
  eslint: {
    ignoreDuringBuilds: true,
  },

  // ✅ TypeScript build configuration
  typescript: {
    ignoreBuildErrors: true,
  },

  // ✅ Image optimization for external sources
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "lh3.googleusercontent.com",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "platform-lookaside.fbsbx.com",
        pathname: "/**",
      },
      // ✅ QR Server API - ADDED FOR QR CODE FIX
      {
        protocol: "https",
        hostname: "api.qrserver.com",
        pathname: "/**",
      },
      // ✅ Firebase Storage (if needed)
      {
        protocol: "https",
        hostname: "firebasestorage.googleapis.com",
        pathname: "/**",
      },
    ],
  },

  // ✅ CRITICAL: Content Security Policy Headers for QR Code
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          {
            key: "Content-Security-Policy",
            value: [
              "default-src 'self'",
              "script-src 'self' 'unsafe-eval' 'unsafe-inline'",
              "style-src 'self' 'unsafe-inline'",
              // ✅ CRITICAL FIX: Allow images from QR Server API
              "img-src 'self' data: blob: https: https://api.qrserver.com https://firebasestorage.googleapis.com https://lh3.googleusercontent.com https://platform-lookaside.fbsbx.com",
              "font-src 'self' data:",
              "connect-src 'self' https://api.qrserver.com https://firebasestorage.googleapis.com",
              "frame-src 'self'",
            ].join("; "),
          },
        ],
      },
    ];
  },

  // ✅ CRITICAL: Disable static export for dynamic routes
  // Don't add 'output: export' - keep it as default (Node.js)
};

module.exports = nextConfig;