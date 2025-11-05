/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    unoptimized: true, // Required for static export
  },
  output: process.env.BUILD_STANDALONE === 'true' ? 'standalone' : (process.env.TAURI_BUILD ? 'export' : undefined),
  // Exclude Tauri build artifacts from Next.js compilation
  webpack: (config) => {
    config.watchOptions = {
      ...config.watchOptions,
      ignored: ['**/node_modules/**', '**/src-tauri/**'],
    }
    return config
  },
}

module.exports = nextConfig

