const path = require('path')
const { PrismaPlugin } = require('@prisma/nextjs-monorepo-workaround-plugin')

/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    // Monorepo: trace from repo root so Prisma engine in root node_modules is included in serverless bundle
    outputFileTracingRoot: path.join(__dirname, '../../'),
  },
  webpack: (config, { isServer }) => {
    if (isServer) {
      // Prisma monorepo workaround: copies engine binaries to the correct location
      config.plugins = [...config.plugins, new PrismaPlugin()]
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
