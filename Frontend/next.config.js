/** @type {import('next').NextConfig} */
const backendApiUrl =
  process.env.REACT_APP_API_URL || process.env.NEXT_PUBLIC_API_URL || '';

const nextConfig = {
  reactStrictMode: true,
  env: {
    REACT_APP_API_URL: backendApiUrl,
    NEXT_PUBLIC_API_URL: backendApiUrl,
    NEXT_PUBLIC_APP_NAME:
      process.env.NEXT_PUBLIC_APP_NAME || 'Trust Education CRM',
  },
  async rewrites() {
    if (!backendApiUrl) {
      return [];
    }

    return [
      {
        source: '/api/:path*',
        destination: `${backendApiUrl.replace(/\/+$/, '')}/:path*`,
      },
    ];
  },
  headers: async () => [
    {
      source: '/:path*',
      headers: [
        {
          key: 'X-Content-Type-Options',
          value: 'nosniff',
        },
        {
          key: 'X-Frame-Options',
          value: 'DENY',
        },
        {
          key: 'X-XSS-Protection',
          value: '1; mode=block',
        },
      ],
    },
  ],
};

module.exports = nextConfig;
