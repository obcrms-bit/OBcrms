'use client';

const trimTrailingSlash = (value = '') => String(value).replace(/\/+$/, '');

export const getApiBaseUrl = () => {
  const configuredUrl =
    process.env.REACT_APP_API_URL || process.env.NEXT_PUBLIC_API_URL || '';

  return trimTrailingSlash(configuredUrl) || '/api';
};

export const getSocketBaseUrl = () =>
  getApiBaseUrl().replace(/\/api$/i, '') || '/';
