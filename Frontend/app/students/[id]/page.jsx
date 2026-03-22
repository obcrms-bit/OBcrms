'use client';

import { useParams } from 'next/navigation';
import AppShell from '@/components/app/app-shell';
import ClientProfile from '@/components/profile/ClientProfile';
import { LoadingState } from '@/components/app/shared';
import { useEffect, useState } from 'react';

export default function StudentDetailPage() {
  const params = useParams();
  const studentId = params?.id;
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (studentId) setReady(true);
  }, [studentId]);

  if (!ready) return <LoadingState label="Loading student profile..." />;

  return (
    <AppShell
      title="Student Profile"
      description="360° workspace for student progression, applications, and Course AI recommendations."
    >
      <ClientProfile id={studentId} type="student" />
    </AppShell>
  );
}
