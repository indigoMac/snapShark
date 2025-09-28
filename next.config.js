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

  // Security headers
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          // Prevent clickjacking attacks
          {
            key: 'X-Frame-Options',
            value: 'DENY',
          },
          // Prevent MIME type sniffing
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          // Control referrer information
          {
            key: 'Referrer-Policy',
            value: 'origin-when-cross-origin',
          },
          // Enable XSS protection
          {
            key: 'X-XSS-Protection',
            value: '1; mode=block',
          },
          // Strict transport security (HTTPS only)
          {
            key: 'Strict-Transport-Security',
            value: 'max-age=31536000; includeSubDomains',
          },
          // Permissions policy (restrict dangerous APIs)
          {
            key: 'Permissions-Policy',
            value:
              'camera=(), microphone=(), geolocation=(), interest-cohort=()',
          },
          // Content Security Policy (Clerk-friendly but secure)
          {
            key: 'Content-Security-Policy',
            value: [
              "default-src 'self'",
              // More permissive script-src for Clerk authentication
              "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://*.clerk.accounts.dev https://*.clerk.dev https://*.clerk.com https://clerk.snap-shark.com https://js.stripe.com https://challenges.cloudflare.com https://vercel.live https://va.vercel-scripts.com",
              "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
              "font-src 'self' https://fonts.gstatic.com",
              // Allow Clerk images and avatars
              "img-src 'self' data: blob: https://*.stripe.com https://images.clerk.dev https://*.clerk.com https://*.gravatar.com https://img.clerk.com",
              // Allow Clerk API connections + social OAuth
              "connect-src 'self' https://api.stripe.com https://*.clerk.accounts.dev https://*.clerk.dev https://*.clerk.com https://clerk.snap-shark.com https://challenges.cloudflare.com https://vitals.vercel-insights.com https://clerk-telemetry.com https://*.google.com https://*.facebook.com https://*.github.com",
              // Allow Clerk frames (for OAuth providers) + social media in-app browsers
              "frame-src 'self' https://js.stripe.com https://hooks.stripe.com https://challenges.cloudflare.com https://*.clerk.accounts.dev https://*.clerk.dev https://*.clerk.com https://*.google.com https://*.facebook.com https://*.github.com",
              "worker-src 'self' blob:",
              "object-src 'none'",
              "base-uri 'self'",
              // Allow form submissions to Clerk + OAuth providers
              "form-action 'self' https://api.stripe.com https://*.clerk.accounts.dev https://*.clerk.dev https://*.clerk.com https://*.google.com https://*.facebook.com https://*.github.com",
            ].join('; '),
          },
        ],
      },
      // Special headers for API routes (more restrictive)
      {
        source: '/api/(.*)',
        headers: [
          {
            key: 'X-Frame-Options',
            value: 'DENY',
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            key: 'Cache-Control',
            value: 'no-store, no-cache, must-revalidate',
          },
        ],
      },
    ];
  },
};

module.exports = nextConfig;
