/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    domains: [],
  },
  output: process.env.BUILD_STANDALONE === 'true' ? 'standalone' : undefined,
  // Ensure all dependencies are included in standalone build
  experimental: {
    outputFileTracingIncludes: {
      '/': ['./**/*'],
    },
  },
}

module.exports = nextConfig

