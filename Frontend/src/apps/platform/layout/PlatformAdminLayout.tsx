'use client';

import SuperAdminShell from '@/components/admin/super-admin-shell';
import WorkspaceGuard from '@/src/apps/shared/guards/WorkspaceGuard';

type PlatformAdminLayoutProps = {
  children: React.ReactNode;
};

export default function PlatformAdminLayout({
  children,
}: PlatformAdminLayoutProps) {
  return (
    <WorkspaceGuard workspace="platform">
      <SuperAdminShell>{children}</SuperAdminShell>
    </WorkspaceGuard>
  );
}
