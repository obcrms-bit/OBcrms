'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/AuthContext';
import { Clock, LogOut } from 'lucide-react';

export default function Header() {
    const { user, logout } = useAuth();
    const router = useRouter();
    const [time, setTime] = useState<Date | null>(null);

    useEffect(() => {
        setTime(new Date());
        const timer = setInterval(() => setTime(new Date()), 1000);
        return () => clearInterval(timer);
    }, []);

    return (
        <header className="bg-white border-b border-gray-200 h-16 flex items-center justify-between px-6 sticky top-0 z-10">
            <div>
                <h1 className="text-2xl font-semibold text-gray-800">
                    Good Morning, {user?.name || 'User'}
                </h1>
                <p className="text-sm text-gray-500">Here is what's happening today.</p>
            </div>

            <div className="flex items-center space-x-6">
                <div className="flex items-center text-gray-600 bg-gray-100 px-4 py-2 rounded-lg font-mono">
                    <Clock className="w-4 h-4 mr-2 text-blue-600" />
                    {time ? time.toLocaleTimeString() : '--:--:--'}
                </div>

                <button
                    onClick={() => {
                        logout();
                        router.push('/login');
                    }}
                    className="bg-rose-50 hover:bg-rose-100 text-rose-600 px-4 py-2 rounded-lg font-medium transition-colors shadow-sm flex items-center border border-rose-200">
                    <LogOut className="w-4 h-4 mr-2" /> Logout
                </button>
            </div>
        </header>
    );
}