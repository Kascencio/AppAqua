/** @type {import('next').NextConfig} */
const EXTERNAL_BACKEND_URL = process.env.NEXT_PUBLIC_EXTERNAL_API_URL || process.env.EXTERNAL_API_URL || 'http://195.35.11.179:3300'

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
  async rewrites() {
    return {
      beforeFiles: [
        // Proxy para todos los API calls al backend externo
        {
          source: '/api/:path*',
          destination: `${EXTERNAL_BACKEND_URL}/api/:path*`,
        },
        {
          // Proxy alterno para el backend externo (evita conflicto con route handlers locales en /api/*)
          source: '/external-api/:path*',
          destination: `${EXTERNAL_BACKEND_URL}/api/:path*`,
        },
        {
          source: '/health',
          destination: `${EXTERNAL_BACKEND_URL}/health`,
        },
        {
          source: '/external-health',
          destination: `${EXTERNAL_BACKEND_URL}/health`,
        },
      ],
    }
  },
}

export default nextConfig
