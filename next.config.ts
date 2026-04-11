import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  devIndicators: {
    position: 'bottom-right',
  },
  experimental: {
    viewTransition: true,
    parallelServerCompiles: true,
    parallelServerBuildTraces: true,
    turbopackFileSystemCacheForDev: true,
    turbopackFileSystemCacheForBuild: true,
    cssChunking: true,
    optimizeCss: true,
    mdxRs: true,
    inlineCss: true,
    taint: true,
    serverComponentsHmrCache: true,
    optimizePackageImports: [
      'react-icons/*', 
      '@radix-ui/*', 
      'framer-motion', 
      'lucide-react', 
      'date-fns', 
      'lodash'
    ],
  },
  expireTime: 3600,
  pageExtensions: ['js', 'jsx', 'ts', 'tsx', 'md', 'mdx'],
  allowedDevOrigins: ['*.local', '*.tunnel.com'],
  transpilePackages: ['framer-motion', '@radix-ui/*'],
  reactCompiler: true,
  cacheComponents: true,
  compiler: {
    removeConsole: process.env.NODE_ENV === 'production' ? { exclude: ['error'] } : false,
    reactRemoveProperties: true,
  },
  typedRoutes: true,
  trailingSlash: true,
  reactStrictMode: true,
  poweredByHeader: false,
  productionBrowserSourceMaps: false,
  output: 'standalone',
  images: {
    formats: ['image/avif', 'image/webp'],
    remotePatterns: [
      { protocol: 'https', hostname: '**.supabase.co' },
      { protocol: 'https', hostname: 'avatars.githubusercontent.com' },
    ],
  },
  serverExternalPackages: ['typescript', 'ts-node', 'postcss', 'next-mdx-remote'],
  turbopack: {
    debugIds: true,
    rules: {
      '*.svg': {
        loaders: ['@svgr/webpack'],
        as: '*.js',
      },
    },
    resolveAlias: {
      '@icons': './components/icons',
    },
  },
};

export default nextConfig;
