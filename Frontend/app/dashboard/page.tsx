import React from 'react';
import DashboardLayout from '../../src/layouts/DashboardLayout';
import Dashboard from '../../src/modules/dashboard/Dashboard';
import { AuthProvider } from '../../src/context/AuthContext';

export default function DashboardPage() {
    return (
        <AuthProvider>
            <DashboardLayout>
                <Dashboard />
            </DashboardLayout>
        </AuthProvider>
    );
}