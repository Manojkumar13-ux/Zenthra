/** @type {import('next').NextConfig} */
const nextConfig = {
  // Experimental features (App Router is stable now)
  experimental: {
    // External packages that need to be handled by server
    serverComponentsExternalPackages: ["mongoose", "bcryptjs", "cloudinary"],
    // Optional: Enable other experimental features
    // optimizeCss: true,
    // typedRoutes: true,
  },
  
  // Image optimization settings
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "res.cloudinary.com",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "lh3.googleusercontent.com",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "avatars.githubusercontent.com",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "platform-lookaside.fbsbx.com",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "api.dicebear.com",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "ui-avatars.com",
        pathname: "/**",
      },
    ],
    // Default image optimization
    formats: ["image/avif", "image/webp"],
    minimumCacheTTL: 60,
  },
  
  // Webpack configuration
  webpack: (config, { isServer, nextRuntime }) => {
    // Handle Node.js modules in client
    if (!isServer) {
      config.resolve.fallback = {
        fs: false,
        net: false,
        tls: false,
        crypto: false,
        stream: false,
        path: false,
        os: false,
        zlib: false,
        http: false,
        https: false,
        url: false,
      };
    }
    
    // Important: Return the modified config
    return config;
  },
  
  // React strict mode for better development
  reactStrictMode: true,
  
  // Enable SWC minification (faster than Terser)
  swcMinify: true,
  
  // Compiler options
  compiler: {
    // Remove console.log in production
    removeConsole: process.env.NODE_ENV === "production"
      ? {
          exclude: ["error", "warn"], // Keep errors and warnings
        }
      : false,
  },
  
  // Security headers
  poweredByHeader: false,
  
  // Performance
  compress: true,
  generateEtags: true,
  
  // HTTP agent options for better performance
  httpAgentOptions: {
    keepAlive: true,
  },
  
  // TypeScript
  typescript: {
    // Warning: This allows production builds to successfully complete even if
    // your project has type errors.
    ignoreBuildErrors: false,
  },
  
  // ESLint
  eslint: {
    // Warning: This allows production builds to successfully complete even if
    // your project has ESLint errors.
    ignoreDuringBuilds: false,
  },
  
  // Output configuration
  output: "standalone", // Better for deployment
  
  // Redirects
  async redirects() {
    return [
      {
        source: "/",
        destination: "/feed",
        permanent: true,
      },
    ];
  },
  
  // Headers for security
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          {
            key: "X-Content-Type-Options",
            value: "nosniff",
          },
          {
            key: "X-Frame-Options",
            value: "DENY",
          },
          {
            key: "X-XSS-Protection",
            value: "1; mode=block",
          },
        ],
      },
    ];
  },
};

module.exports = nextConfig;