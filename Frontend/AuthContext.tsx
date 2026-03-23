'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { User, Role } from '@/lib/types/auth';

interface AuthContextType {
    user: User | null;
    isLoading: boolean;
    hasRole: (allowedRoles: Role[]) => boolean;
    login: (email: string, password: string) => Promise<{ success: boolean; message?: string }>;
    logout: () => void;
}

const AuthContext = createContext<AuthContextType>({
    user: null,
    isLoading: true,
    hasRole: () => false,
    login: async () => ({ success: false }),
    logout: () => { },
});

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
    const [user, setUser] = useState<User | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    // Uses NEXT_PUBLIC_API_URL from .env.local, fallback to standard local backend port
    const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

    useEffect(() => {
        if (typeof window !== 'undefined') {
            const token = localStorage.getItem('token');
            const storedUser = localStorage.getItem('user');
            if (token && storedUser) {
                try {
                    setUser(JSON.parse(storedUser));
                } catch (err) {
                    setUser(null);
                }
            }
        }
        setIsLoading(false);
    }, []);

    const login = async (email: string, password: string) => {
        try {
            const response = await fetch(`${API_URL}/auth/login`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, password }),
            });
            const data = await response.json();

            if (data.success && data.data) {
                const { token, user: userData } = data.data;
                if (typeof window !== 'undefined') {
                    localStorage.setItem('token', token);
                    localStorage.setItem('user', JSON.stringify(userData));
                }
                setUser(userData);
                return { success: true };
            } else {
                return { success: false, message: data.message || 'Login failed' };
            }
        } catch (error) {
            console.error("Login request failed", error);
            return { success: false, message: 'Network error or backend is unreachable' };
        }
    };

    const logout = () => {
        if (typeof window !== 'undefined') {
            localStorage.removeItem('token');
            localStorage.removeItem('user');
        }
        setUser(null);
    };

    const hasRole = (allowedRoles: Role[]) => {
        if (!user) return false;
        return allowedRoles.includes(user.role);
    };

    return <AuthContext.Provider value={{ user, isLoading, hasRole, login, logout }}>{children}</AuthContext.Provider>;
};

export const useAuth = () => useContext(AuthContext);