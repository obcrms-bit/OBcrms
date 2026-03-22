'use client';

import WorkspaceGuard from '@/src/apps/shared/guards/WorkspaceGuard';

type TenantAdminLayoutProps = {
  children: React.ReactNode;
};

export default function TenantAdminLayout({
  children,
}: TenantAdminLayoutProps) {
  return <WorkspaceGuard workspace="tenant">{children}</WorkspaceGuard>;
}
