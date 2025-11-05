/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**.supabase.co',
      },
      {
        protocol: 'https',
        hostname: 'supabase.co',
      },
    ],
  },
  // Optimize for production
  swcMinify: true,
  // Enable strict mode for better error catching
  reactStrictMode: true,
  // Disable static page generation errors
  eslint: {
    ignoreDuringBuilds: false,
  },
  typescript: {
    ignoreBuildErrors: false,
  },
  // Skip static generation for certain routes
  experimental: {
    missingSuspenseWithCSRBailout: false,
  },
};

export default nextConfig;