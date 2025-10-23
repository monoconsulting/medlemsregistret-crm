import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Enable standalone output for Docker
  output: 'standalone',
  
  // Transpile packages if needed
  transpilePackages: [],
  
  // Experimental features
  experimental: {
    // Enable Server Actions
    serverActions: {
      bodySizeLimit: '2mb',
    },
  },
};

export default nextConfig;
