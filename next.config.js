/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    domains: ['firebasestorage.googleapis.com', 'lh3.googleusercontent.com', 'unpkg.com', 'images.unsplash.com'],
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  // Increase API timeout to handle slower MongoDB connections
  experimental: {
    serverComponentsExternalPackages: ['@next-auth/mongodb-adapter'],
  },
  // Increase API timeout
  api: {
    responseLimit: false,
    bodyParser: {
      sizeLimit: '1mb',
    },
  },
};

module.exports = nextConfig; 