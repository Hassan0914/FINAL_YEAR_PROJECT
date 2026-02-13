/** @type {import('next').NextConfig} */
const nextConfig = {
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    unoptimized: true,
  },
  // API Routes configuration for large video uploads
  experimental: {
    serverActions: {
      bodySizeLimit: '500mb', // Increased for large videos
    },
  },
  // Note: maxDuration is configured per route in route.ts files
  // This allows different timeouts for different endpoints
}

export default nextConfig
