/** @type {import('next').NextConfig} */
const DEFAULT_DEPLOYED_API_URL = 'https://obcrms-backend.onrender.com';
const LEGACY_BACKEND_HOSTS = new Set([
  'trust-education-crm-api.onrender.com',
]);
const trimTrailingSlash = (value = '') => String(value).replace(/\/+$/, '');
const normalizeBackendApiUrl = (value = '') => {
  const trimmed = trimTrailingSlash(value);

  if (!trimmed) {
    return '';
  }

  try {
    const parsed = new URL(trimmed);
    if (LEGACY_BACKEND_HOSTS.has(parsed.hostname)) {
      parsed.hostname = new URL(DEFAULT_DEPLOYED_API_URL).hostname;
    }
    const normalizedPath = trimTrailingSlash(parsed.pathname || '');

    if (!normalizedPath) {
      parsed.pathname = '/api';
      return trimTrailingSlash(parsed.toString());
    }

    return trimTrailingSlash(parsed.toString());
  } catch (error) {
    return trimmed;
  }
};

const backendApiUrl = normalizeBackendApiUrl(
  process.env.NEXT_PUBLIC_API_URL ||
    process.env.REACT_APP_API_URL ||
    DEFAULT_DEPLOYED_API_URL
);

const nextConfig = {
  reactStrictMode: true,
  env: {
    NEXT_PUBLIC_API_URL: backendApiUrl,
    REACT_APP_API_URL: backendApiUrl,
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
