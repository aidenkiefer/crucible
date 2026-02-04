const path = require('path')

/** @type {import('next').NextConfig} */
const nextConfig = {
  // Next.js 14: use experimental key (serverExternalPackages is Next.js 15+)
  experimental: {
    serverComponentsExternalPackages: ['@prisma/client', 'prisma'],
    // Monorepo: trace from repo root so Prisma engine in root node_modules is included in serverless bundle
    outputFileTracingRoot: path.join(__dirname, '../../'),
    // Force-include Prisma engine binary (paths relative to outputFileTracingRoot = repo root)
    outputFileTracingIncludes: {
      '/api/auth/[...nextauth]': [
        'packages/database/node_modules/.prisma/client/**'
      ],
      '/api/**': [
        'packages/database/node_modules/.prisma/client/**'
      ],
    },
  },
  webpack: (config, { isServer }) => {
    // Wagmi/connectors pull in optional deps that aren't used in browser build
    config.resolve.fallback = {
      ...config.resolve.fallback,
      '@react-native-async-storage/async-storage': false,
      'pino-pretty': false,
    }
    return config
  },
}

module.exports = nextConfig
