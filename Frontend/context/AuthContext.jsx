'use client';

import { createContext, useContext, useEffect, useState } from 'react';
import { authAPI } from '@/src/services/api';
import {
  AUTH_EXPIRED_EVENT,
  clearStoredSession,
  getStoredToken,
  getStoredUser,
  setStoredSession,
} from '@/src/services/session';
import { closeChatSocket } from '@/src/services/socket';

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
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;

    const syncSession = async () => {
      const storedToken = getStoredToken();
      const storedUser = getStoredUser();

      if (!storedToken) {
        if (isMounted) {
          setUser(null);
          setToken(null);
          setIsLoading(false);
        }
        return;
      }

      if (isMounted) {
        setToken(storedToken);
        setUser(normalizeUser(storedUser));
      }

      try {
        const response = await authAPI.getMe();
        const nextUser = normalizeUser(response.data?.data);

        if (nextUser) {
          setStoredSession({ token: storedToken, user: nextUser });
        }

        if (isMounted) {
          setUser(nextUser);
        }
      } catch (error) {
        console.error('Failed to restore session', error);
        clearStoredSession();
        closeChatSocket();

        if (isMounted) {
          setUser(null);
          setToken(null);
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    const handleExpiredSession = () => {
      clearStoredSession();
      closeChatSocket();
      if (isMounted) {
        setUser(null);
        setToken(null);
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
    const nextToken = payload?.token ?? payload?.authToken ?? null;

    setUser(nextUser);
    setToken(nextToken);
    setStoredSession({ token: nextToken, user: nextUser });
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
    clearStoredSession();
    closeChatSocket();
  };

  const value = {
    user,
    token,
    isLoading,
    isAuthenticated: Boolean(user && token),
    login,
    register,
    logout,
    setUser,
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
