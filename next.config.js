/** @type {import('next').NextConfig} */
const nextConfig = {
  // ✅ Disable React Strict Mode
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

module.exports = nextConfig;
