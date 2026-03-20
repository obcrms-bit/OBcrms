import SuperAdminShell from '@/components/admin/super-admin-shell';

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <SuperAdminShell>{children}</SuperAdminShell>;
}
