import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  output: 'export',
  experimental: {
    optimizePackageImports: ['@tanstack/react-query', 'lucide-react']
  }
}

export default nextConfig
