'use client';

import axios from 'axios';
import { getApiBaseUrl } from './runtimeConfig';
import {
  clearStoredSession,
  emitAuthExpired,
  getStoredRefreshToken,
  getStoredSession,
  getStoredTenantId,
  getStoredToken,
  setStoredSession,
} from './session';
import { getApiErrorMessage } from './apiUtils';

export const API_ERROR_EVENT = 'trust-education:api-error';

const canUseWindow = () => typeof window !== 'undefined';

const emitApiError = (detail = {}) => {
  if (!canUseWindow()) {
    return;
  }

  window.dispatchEvent(new CustomEvent(API_ERROR_EVENT, { detail }));
};

const attachSessionHeaders = (config) => {
  const nextConfig = { ...config };
  const token = getStoredToken();
  const tenantId = getStoredTenantId();

  nextConfig.baseURL = getApiBaseUrl();
  nextConfig.headers = nextConfig.headers || {};

  if (token) {
    nextConfig.headers.Authorization = `Bearer ${token}`;
  }

  if (tenantId && !nextConfig.headers['X-Tenant-Id']) {
    nextConfig.headers['X-Tenant-Id'] = tenantId;
  }

  if (!nextConfig.headers['X-Requested-With']) {
    nextConfig.headers['X-Requested-With'] = 'XMLHttpRequest';
  }

  return nextConfig;
};

const buildNormalizedError = (error) => {
  const normalizedError = error;
  normalizedError.userMessage = getApiErrorMessage(error);
  normalizedError.status = error?.response?.status || error?.status || 0;
  return normalizedError;
};

let refreshPromise = null;

const attemptTokenRefresh = async (client) => {
  const refreshToken = getStoredRefreshToken();

  if (!refreshToken) {
    throw new Error('No refresh token available');
  }

  const response = await client.post(
    '/auth/refresh',
    { refreshToken },
    {
      skipAuthHandling: true,
      skipRefresh: true,
    }
  );

  const authPayload = response?.data?.data || {};
  const nextToken = authPayload?.token || authPayload?.accessToken;
  const nextRefreshToken = authPayload?.refreshToken || refreshToken;
  const nextUser = authPayload?.user || getStoredSession().user || null;

  if (!nextToken) {
    throw new Error('Refresh token response did not include a new access token');
  }

  setStoredSession({
    token: nextToken,
    refreshToken: nextRefreshToken,
    user: nextUser,
    tenantId: nextUser?.tenantId || nextUser?.companyId || getStoredTenantId(),
  });

  return nextToken;
};

export const apiClient = axios.create({
  baseURL: getApiBaseUrl(),
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 20000,
});

apiClient.interceptors.request.use(
  (config) => attachSessionHeaders(config),
  (error) => Promise.reject(buildNormalizedError(error))
);

apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const normalizedError = buildNormalizedError(error);
    const originalRequest = normalizedError?.config || {};
    const status = normalizedError?.response?.status;

    if (
      status === 401 &&
      !originalRequest.skipAuthHandling &&
      !originalRequest.skipRefresh &&
      !originalRequest._retry &&
      getStoredRefreshToken()
    ) {
      originalRequest._retry = true;

      try {
        refreshPromise = refreshPromise || attemptTokenRefresh(apiClient);
        const nextToken = await refreshPromise;
        refreshPromise = null;

        originalRequest.headers = originalRequest.headers || {};
        originalRequest.headers.Authorization = `Bearer ${nextToken}`;
        return apiClient(originalRequest);
      } catch (refreshError) {
        refreshPromise = null;
      }
    }

    if (status === 401 && !originalRequest.skipAuthHandling) {
      clearStoredSession();
      emitAuthExpired({
        reason:
          normalizedError?.response?.data?.message || 'Your session has expired.',
      });
    }

    if (!originalRequest.skipGlobalErrorEvent) {
      emitApiError({
        status: normalizedError.status,
        message: normalizedError.userMessage,
        url: originalRequest?.url || '',
        method: originalRequest?.method || 'get',
      });
    }

    return Promise.reject(normalizedError);
  }
);

export default apiClient;
