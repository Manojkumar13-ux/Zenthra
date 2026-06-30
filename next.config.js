// next.config.js
/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'standalone',
  experimental: {
    serverActions: {
      bodySizeLimit: '2mb',
    },
  },
  // ✅ Add for Vercel
  images: {
    domains: ['localhost', 'res.cloudinary.com'],
  },
  // ✅ Increase timeout for serverless functions
  serverRuntimeConfig: {
    // Will only be available on the server side
  },
  publicRuntimeConfig: {
    // Will be available on both server and client
  },
  // ✅ Vercel specific
  poweredByHeader: false,
  reactStrictMode: true,
};

module.exports = nextConfig;