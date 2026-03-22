import TenantAdminLayout from '@/src/apps/tenant/layout/TenantAdminLayout';

export default function TenantLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <TenantAdminLayout>{children}</TenantAdminLayout>;
}
