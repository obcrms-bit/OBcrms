'use client';

import SuperAdminShell from '@/components/admin/super-admin-shell';
import WorkspaceGuard from '@/src/apps/shared/guards/WorkspaceGuard';
import { Suspense } from 'react';

type PlatformAdminLayoutProps = {
  children: React.ReactNode;
};

export default function PlatformAdminLayout({
  children,
}: PlatformAdminLayoutProps) {
  return (
    <WorkspaceGuard workspace="platform">
      <Suspense fallback={<div className="min-h-screen bg-slate-950 flex items-center justify-center text-white">Loading...</div>}>
        <SuperAdminShell>{children}</SuperAdminShell>
      </Suspense>
    </WorkspaceGuard>
  );
}
