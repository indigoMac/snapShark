/** @type {import('next').NextConfig} */
const nextConfig = {
  eslint: {
    ignoreDuringBuilds: true,
  },
  experimental: {
    serverComponentsExternalPackages: ['pica'],
  },
  webpack: (config, { isServer }) => {
    // Handle WASM files for image processing
    config.experiments = {
      ...config.experiments,
      asyncWebAssembly: true,
    };

    return config;
  },
  // PWA configuration will be added later
  images: {
    domains: [],
  },
};

module.exports = nextConfig;
