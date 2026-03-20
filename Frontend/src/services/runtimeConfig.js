'use client';

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

  return normalizeConfiguredApiUrl(configuredUrl) || '/api';
};

export const getSocketBaseUrl = () =>
  getApiBaseUrl().replace(/\/api$/i, '') || undefined;
