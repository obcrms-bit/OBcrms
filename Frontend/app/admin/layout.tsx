import { Suspense } from 'react';
import SuperAdminShell from '@/components/admin/super-admin-shell';

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <Suspense fallback={<div className="min-h-screen bg-slate-950 flex items-center justify-center text-white">Loading Admin...</div>}>
      <SuperAdminShell>{children}</SuperAdminShell>
    </Suspense>
  );
}
