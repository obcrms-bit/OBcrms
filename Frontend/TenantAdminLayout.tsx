'use client';

import React from 'react';
import TenantAdminSidebar from '@/TenantAdminSidebar';
import Header from '@/Header';
import { ThemeProvider } from '@/ThemeContext';

export default function TenantAdminLayout({ children }: { children: React.ReactNode }) {
    return (
        <ThemeProvider>
            <div className="min-h-screen bg-gray-50 flex" style={{ '--theme-bg': 'var(--primary-color)' } as React.CSSProperties}>
                <TenantAdminSidebar />
                <div className="flex-1 ml-64 flex flex-col min-w-0">
                    <Header />
                    <main className="flex-1 p-6 pb-24 overflow-x-hidden">
                        {children}
                    </main>
                </div>
            </div>
        </ThemeProvider>
    );
}