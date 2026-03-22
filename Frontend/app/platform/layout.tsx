import PlatformAdminLayout from '@/src/apps/platform/layout/PlatformAdminLayout';

export default function PlatformLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <PlatformAdminLayout>{children}</PlatformAdminLayout>;
}
