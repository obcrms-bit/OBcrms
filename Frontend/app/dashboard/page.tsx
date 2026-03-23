import React from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import Dashboard from '@/components/dashboard/Dashboard';
import { AuthProvider } from '@/lib/context/AuthContext';

export default function DashboardPage() {
    return (
        <AuthProvider>
            <DashboardLayout>
                <Dashboard />
            </DashboardLayout>
        </AuthProvider>
    );
}