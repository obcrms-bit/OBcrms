'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { User, Role } from '@/lib/types/auth';

interface AuthContextType {
    user: User | null;
    isLoading: boolean;
    hasRole: (allowedRoles: Role[]) => boolean;
}

const AuthContext = createContext<AuthContextType>({
    user: null,
    isLoading: true,
    hasRole: () => false,
});

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
    const [user, setUser] = useState<User | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        // Mocking API fetch for user session
        setTimeout(() => {
            setUser({ id: '1', name: 'Admin User', email: 'admin@trust.com', role: 'SUPER_ADMIN' });
            setIsLoading(false);
        }, 500);
    }, []);

    const hasRole = (allowedRoles: Role[]) => {
        if (!user) return false;
        return allowedRoles.includes(user.role);
    };

    return <AuthContext.Provider value={{ user, isLoading, hasRole }}>{children}</AuthContext.Provider>;
};

export const useAuth = () => useContext(AuthContext);