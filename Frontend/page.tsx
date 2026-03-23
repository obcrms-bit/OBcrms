import React from 'react';
import SuperAdminLayout from '@/SuperAdminLayout';
import TenantDetail from '@/TenantDetail';
import { AuthProvider } from '@/AuthContext';

export default function TenantDetailPage({ params }: { params: { id: string } }) {
    return (
        <AuthProvider>
            <SuperAdminLayout>
                <TenantDetail tenantId={params.id} />
            </SuperAdminLayout>
        </AuthProvider>
    );
}