'use client';

import { createContext, useContext, useEffect, useState } from 'react';
import { authAPI } from '@/src/services/api';
import {
  AUTH_EXPIRED_EVENT,
  clearStoredSession,
  getStoredRefreshToken,
  getStoredSession,
  setStoredSession,
} from '@/src/services/session';
import { getApiErrorMessage } from '@/src/services/apiUtils';
import { closeChatSocket } from '@/src/services/socket';
import { clearStoredWorkspaceSelection } from '@/src/services/workspace';

const AuthContext = createContext();

const normalizeUser = (payload) => {
  if (!payload) {
    return null;
  }

  return {
    ...payload,
    id: payload.id || payload._id,
  };
};

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [refreshToken, setRefreshToken] = useState(null);
  const [tenantId, setTenantId] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;

    const syncSession = async () => {
      const storedSession = getStoredSession();
      const storedToken = storedSession.token;
      const storedUser = storedSession.user;
      const storedRefreshToken = storedSession.refreshToken;
      const storedTenantId = storedSession.tenantId;

      if (!storedToken) {
        if (isMounted) {
          setUser(null);
          setToken(null);
          setRefreshToken(null);
          setTenantId(null);
          setIsLoading(false);
        }
        return;
      }

      if (isMounted) {
        setToken(storedToken);
        setRefreshToken(storedRefreshToken);
        setUser(normalizeUser(storedUser));
        setTenantId(storedTenantId || storedUser?.tenantId || storedUser?.companyId || null);
      }

      try {
        const response = await authAPI.getMe();
        const nextUser = normalizeUser(response.data?.data);

        if (nextUser) {
          setStoredSession({
            token: storedToken,
            refreshToken: storedRefreshToken,
            user: nextUser,
            tenantId: nextUser.tenantId || nextUser.companyId || storedTenantId,
          });
        }

        if (isMounted) {
          setUser(nextUser);
          setTenantId(nextUser?.tenantId || nextUser?.companyId || storedTenantId || null);
        }
      } catch (error) {
        console.error('Failed to restore session', error);
        clearStoredSession();
        clearStoredWorkspaceSelection();
        closeChatSocket();

        if (isMounted) {
          setUser(null);
          setToken(null);
          setRefreshToken(null);
          setTenantId(null);
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    const handleExpiredSession = () => {
      clearStoredSession();
      clearStoredWorkspaceSelection();
      closeChatSocket();
      if (isMounted) {
        setUser(null);
        setToken(null);
        setRefreshToken(null);
        setTenantId(null);
      }
    };

    window.addEventListener(AUTH_EXPIRED_EVENT, handleExpiredSession);
    syncSession();

    return () => {
      isMounted = false;
      window.removeEventListener(AUTH_EXPIRED_EVENT, handleExpiredSession);
    };
  }, []);

  const persistAuth = (payload) => {
    const nextUser = normalizeUser(payload?.user ?? payload ?? null);
    const nextToken = payload?.token ?? payload?.authToken ?? payload?.accessToken ?? null;
    const nextRefreshToken =
      payload?.refreshToken ?? getStoredRefreshToken() ?? null;
    const nextTenantId = nextUser?.tenantId || nextUser?.companyId || null;

    setUser(nextUser);
    setToken(nextToken);
    setRefreshToken(nextRefreshToken);
    setTenantId(nextTenantId);
    setStoredSession({
      token: nextToken,
      refreshToken: nextRefreshToken,
      user: nextUser,
      tenantId: nextTenantId,
    });
  };

  const login = async (payloadOrEmail, password) => {
    if (typeof payloadOrEmail === 'string') {
      const response = await authAPI.login(payloadOrEmail, password);
      const authPayload = response.data?.data;
      persistAuth({
        user: authPayload?.user,
        token: authPayload?.token,
      });
      return authPayload;
    }

    persistAuth(payloadOrEmail);
    return payloadOrEmail;
  };

  const register = async (name, email, password, role = 'counselor') => {
    const response = await authAPI.register(name, email, password, role);
    return response.data?.data;
  };

  const logout = () => {
    setUser(null);
    setToken(null);
    setRefreshToken(null);
    setTenantId(null);
    clearStoredSession();
    clearStoredWorkspaceSelection();
    closeChatSocket();
  };

  const value = {
    user,
    token,
    refreshToken,
    tenantId,
    isLoading,
    isAuthenticated: Boolean(user && token),
    permissions: Array.isArray(user?.effectivePermissions)
      ? user.effectivePermissions
      : [],
    fieldAccess: user?.fieldAccess || {},
    login,
    register,
    logout,
    setUser,
    getAuthErrorMessage: getApiErrorMessage,
  };

  return (
    <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
