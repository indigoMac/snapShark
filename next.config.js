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

    // Handle vtracer-wasm WASM files
    config.module.rules.push({
      test: /\.wasm$/,
      type: 'webassembly/async',
    });

    // Copy WASM files to public directory
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        path: false,
      };
    }

    return config;
  },
  // PWA configuration will be added later
  images: {
    domains: [],
    unoptimized: false,
    // Allow optimization but handle edge cases
    dangerouslyAllowSVG: true,
    contentSecurityPolicy: "default-src 'self'; script-src 'none'; sandbox;",
  },
};

module.exports = nextConfig;
