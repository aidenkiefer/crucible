/** @type {import('next').NextConfig} */
const nextConfig = {
  // Next.js 14: use experimental key (serverExternalPackages is Next.js 15+)
  experimental: {
    serverComponentsExternalPackages: ['@prisma/client', 'prisma'],
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
