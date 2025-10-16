import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  pageExtensions: ['tsx', 'ts', 'jsx', 'js'],
  typescript: {
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  webpack: (config, { isServer }) => {
    if (isServer) {
      config.externals = [...(config.externals || []), 'cheerio'];
    }
    
    // Handle Node.js modules for browser compatibility
    config.resolve.fallback = {
      ...config.resolve.fallback,
      fs: false,
      path: false,
      os: false,
      crypto: false,
      stream: false,
      util: false,
    };
    
    return config;
  },
  serverExternalPackages: ['cheerio', 'rss-parser', 'puppeteer', 'jsdom'],
  // Disable external services for development
  env: {
    DISABLE_KAFKA: 'true',
    DISABLE_REDIS: 'true',
  }
};

export default nextConfig;
