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
  // Updated experimental options for Next.js 15
  experimental: {
    serverExternalPackages: ['@next-auth/mongodb-adapter'],
  },
};

module.exports = nextConfig; 