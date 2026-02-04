const path = require('path')

/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    // Monorepo: trace from repo root so Prisma engine in root node_modules is included in serverless bundle
    outputFileTracingRoot: path.join(__dirname, '../../'),
  },
  // Don't externalize Prisma - let webpack bundle it
  // This ensures the engines are included in the bundle
  webpack: (config, { isServer }) => {
    if (isServer) {
      // Force Prisma to be bundled by webpack instead of externalized
      // This makes Next.js include the engine binaries in the deployment
      config.externals = config.externals.map((external) => {
        if (typeof external === 'function') {
          return async (context) => {
            const result = await external(context)
            // Don't externalize @prisma/client
            if (result && (result.includes('@prisma/client') || result.includes('.prisma/client'))) {
              return undefined
            }
            return result
          }
        }
        return external
      })
    }

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
