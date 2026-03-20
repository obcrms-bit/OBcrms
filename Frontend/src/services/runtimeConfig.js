'use client';

const DEFAULT_DEPLOYED_API_URL = 'https://obcrms-backend.onrender.com';
const LEGACY_BACKEND_HOSTS = new Set([
  'trust-education-crm-api.onrender.com',
]);
const trimTrailingSlash = (value = '') => String(value).replace(/\/+$/, '');
const hasApiSuffix = (value = '') => /\/api$/i.test(value);

const normalizeConfiguredApiUrl = (value = '') => {
  const trimmed = trimTrailingSlash(value);

  if (!trimmed) {
    return '';
  }

  if (trimmed.startsWith('/')) {
    return hasApiSuffix(trimmed) ? trimmed : `${trimmed}/api`;
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

export const getApiBaseUrl = () => {
  const configuredUrl =
    process.env.NEXT_PUBLIC_API_URL || process.env.REACT_APP_API_URL || '';

  return (
    normalizeConfiguredApiUrl(configuredUrl) ||
    normalizeConfiguredApiUrl(DEFAULT_DEPLOYED_API_URL) ||
    '/api'
  );
};

export const getSocketBaseUrl = () =>
  getApiBaseUrl().replace(/\/api$/i, '') || undefined;
