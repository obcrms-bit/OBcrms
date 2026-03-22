'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { LoadingState } from '@/components/app/shared';
import { useAuth } from '@/context/AuthContext';
import { getDefaultWorkspacePath } from '@/src/apps/shared/routing';

export default function HomePage() {
  const router = useRouter();
  const { isAuthenticated, isLoading, user } = useAuth();

  useEffect(() => {
    if (isLoading) {
      return;
    }

    if (!isAuthenticated) {
      router.replace('/login');
      return;
    }

    router.replace(getDefaultWorkspacePath(user));
  }, [isAuthenticated, isLoading, router, user]);

  return <LoadingState label="Opening your workspace..." />;
}
