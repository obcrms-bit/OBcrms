'use client';

export const STORAGE_KEYS = {
  token: 'token',
  user: 'user',
};

export const AUTH_EXPIRED_EVENT = 'trust-education:auth-expired';

const canUseBrowserStorage = () => typeof window !== 'undefined';

export const getStoredToken = () => {
  if (!canUseBrowserStorage()) {
    return null;
  }

  return localStorage.getItem(STORAGE_KEYS.token);
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

export const setStoredSession = ({ token, user }) => {
  if (!canUseBrowserStorage()) {
    return;
  }

  if (token) {
    localStorage.setItem(STORAGE_KEYS.token, token);
  }

  if (user) {
    localStorage.setItem(STORAGE_KEYS.user, JSON.stringify(user));
  }
};

export const clearStoredSession = () => {
  if (!canUseBrowserStorage()) {
    return;
  }

  localStorage.removeItem(STORAGE_KEYS.token);
  localStorage.removeItem(STORAGE_KEYS.user);
};

export const emitAuthExpired = (detail = {}) => {
  if (!canUseBrowserStorage()) {
    return;
  }

  window.dispatchEvent(new CustomEvent(AUTH_EXPIRED_EVENT, { detail }));
};
