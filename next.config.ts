import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // ✅ Disable React Strict Mode to prevent duplicate API calls in development
  reactStrictMode: false,

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
};

export default nextConfig;