'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { AuthProvider, useAuth } from '@/AuthContext';
import { Role } from '@/lib/types/auth';

function LoginForm() {
    const { login } = useAuth();
    const router = useRouter();
    const [role, setRole] = useState<Role>('ADMIN');

    const handleLogin = (e: React.FormEvent) => {
        e.preventDefault();
        login(role);
        if (role === 'SUPER_ADMIN') {
            router.push('/super-admin');
        } else {
            router.push('/dashboard');
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50">
            <div className="bg-white p-8 rounded-xl shadow-md w-full max-w-md">
                <h1 className="text-2xl font-bold text-center mb-6 text-gray-900">Trust CRM Login</h1>
                <form onSubmit={handleLogin} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Select Mock Role</label>
                        <select
                            value={role}
                            onChange={(e) => setRole(e.target.value as Role)}
                            className="w-full border border-gray-300 rounded-lg p-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
                        >
                            <option value="SUPER_ADMIN">Platform Owner (Super Admin)</option>
                            <option value="ADMIN">Consultancy Owner (Tenant Admin)</option>
                            <option value="STAFF">Counselor (Staff)</option>
                        </select>
                    </div>
                    <button
                        type="submit"
                        className="w-full bg-indigo-600 text-white py-2 rounded-lg font-medium hover:bg-indigo-700 transition-colors"
                    >
                        Sign In
                    </button>
                </form>
            </div>
        </div>
    );
}

export default function LoginPage() {
    return (
        <AuthProvider>
            <LoginForm />
        </AuthProvider>
    );
}