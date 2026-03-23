'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { User, Role } from '@/lib/types/auth';

interface AuthContextType {
    user: User | null;
    isLoading: boolean;
    hasRole: (allowedRoles: Role[]) => boolean;
    login: (role: Role) => void;
    logout: () => void;
}

const AuthContext = createContext<AuthContextType>({
    user: null,
    isLoading: true,
    hasRole: () => false,
    login: () => { },
    logout: () => { },
});

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
    const [user, setUser] = useState<User | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const storedRole = (typeof window !== 'undefined' ? localStorage.getItem('mockRole') : null) as Role | null;
        if (storedRole) {
            setUser({ id: '1', name: 'Test User', email: 'test@trust.com', role: storedRole });
        } else {
            setUser(null);
        }
        setIsLoading(false);
    }, []);

    const login = (role: Role) => {
        if (typeof window !== 'undefined') localStorage.setItem('mockRole', role);
        setUser({ id: '1', name: 'Test User', email: 'test@trust.com', role });
    };

    const logout = () => {
        if (typeof window !== 'undefined') localStorage.removeItem('mockRole');
        setUser(null);
    };

    const hasRole = (allowedRoles: Role[]) => {
        if (!user) return false;
        return allowedRoles.includes(user.role);
    };

    return <AuthContext.Provider value={{ user, isLoading, hasRole, login, logout }}>{children}</AuthContext.Provider>;
};

export const useAuth = () => useContext(AuthContext);