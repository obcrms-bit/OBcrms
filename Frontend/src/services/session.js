'use client';

export const STORAGE_KEYS = {
  token: 'token',
  refreshToken: 'refreshToken',
  user: 'user',
  tenantId: 'tenantId',
};

export const AUTH_EXPIRED_EVENT = 'trust-education:auth-expired';

const canUseBrowserStorage = () => typeof window !== 'undefined';

export const getStoredToken = () => {
  if (!canUseBrowserStorage()) {
    return null;
  }

  return localStorage.getItem(STORAGE_KEYS.token);
};

export const getStoredRefreshToken = () => {
  if (!canUseBrowserStorage()) {
    return null;
  }

  return localStorage.getItem(STORAGE_KEYS.refreshToken);
};

export const getStoredUser = () => {
  if (!canUseBrowserStorage()) {
    return null;
  }

  const rawUser = localStorage.getItem(STORAGE_KEYS.user);
  if (!rawUser) {
    return null;
  }

  try {
    return JSON.parse(rawUser);
  } catch (error) {
    console.error('Failed to parse stored user session', error);
    localStorage.removeItem(STORAGE_KEYS.user);
    return null;
  }
};

export const getStoredTenantId = () => {
  if (!canUseBrowserStorage()) {
    return null;
  }

  return localStorage.getItem(STORAGE_KEYS.tenantId);
};

export const getStoredSession = () => ({
  token: getStoredToken(),
  refreshToken: getStoredRefreshToken(),
  user: getStoredUser(),
  tenantId: getStoredTenantId(),
});

export const setStoredSession = ({ token, refreshToken, user, tenantId }) => {
  if (!canUseBrowserStorage()) {
    return;
  }

  if (token) {
    localStorage.setItem(STORAGE_KEYS.token, token);
  } else {
    localStorage.removeItem(STORAGE_KEYS.token);
  }

  if (refreshToken) {
    localStorage.setItem(STORAGE_KEYS.refreshToken, refreshToken);
  } else {
    localStorage.removeItem(STORAGE_KEYS.refreshToken);
  }

  if (user) {
    localStorage.setItem(STORAGE_KEYS.user, JSON.stringify(user));
  } else {
    localStorage.removeItem(STORAGE_KEYS.user);
  }

  const nextTenantId = tenantId || user?.tenantId || user?.companyId;
  if (nextTenantId) {
    localStorage.setItem(STORAGE_KEYS.tenantId, String(nextTenantId));
  } else {
    localStorage.removeItem(STORAGE_KEYS.tenantId);
  }
};

export const clearStoredSession = () => {
  if (!canUseBrowserStorage()) {
    return;
  }

  localStorage.removeItem(STORAGE_KEYS.token);
  localStorage.removeItem(STORAGE_KEYS.refreshToken);
  localStorage.removeItem(STORAGE_KEYS.user);
  localStorage.removeItem(STORAGE_KEYS.tenantId);
};

export const emitAuthExpired = (detail = {}) => {
  if (!canUseBrowserStorage()) {
    return;
  }

  window.dispatchEvent(new CustomEvent(AUTH_EXPIRED_EVENT, { detail }));
};
