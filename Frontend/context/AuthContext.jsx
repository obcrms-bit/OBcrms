'use client';

import { createContext, useContext, useEffect, useState } from 'react';
import { authAPI } from '@/src/services/api';

const AuthContext = createContext();

const readStoredUser = () => {
  if (typeof window === 'undefined') {
    return null;
  }

  try {
    const rawUser = localStorage.getItem('user');
    return rawUser ? JSON.parse(rawUser) : null;
  } catch (error) {
    console.error('Failed to parse stored user', error);
    return null;
  }
};

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (typeof window === 'undefined') {
      return;
    }

    setUser(readStoredUser());
    setToken(localStorage.getItem('token'));
    setIsLoading(false);
  }, []);

  const persistAuth = (payload) => {
    const nextUser = payload?.user ?? payload ?? null;
    const nextToken = payload?.token ?? payload?.authToken ?? null;

    setUser(nextUser);
    setToken(nextToken);

    if (typeof window !== 'undefined') {
      if (nextUser) {
        localStorage.setItem('user', JSON.stringify(nextUser));
      }
      if (nextToken) {
        localStorage.setItem('token', nextToken);
      }
    }
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

    if (typeof window !== 'undefined') {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
    }
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
