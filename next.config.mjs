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
  webpack: (config, { isServer }) => {
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
      }
    }
    // Suppress Supabase realtime warning
    config.ignoreWarnings = [
      { module: /node_modules\/@supabase\/realtime-js/ }
    ]
    return config
  },
}

export default nextConfig
