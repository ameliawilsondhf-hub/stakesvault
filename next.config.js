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
    ],
  },

  // ✅ CRITICAL: Disable static export for dynamic routes
  // Don't add 'output: export' - keep it as default (Node.js)
};

module.exports = nextConfig;