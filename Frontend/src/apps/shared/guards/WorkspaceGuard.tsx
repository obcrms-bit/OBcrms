'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { LoadingState } from '@/components/app/shared';
import { useAuth } from '@/context/AuthContext';
import {
  getDefaultWorkspacePath,
  isPlatformUser,
  isTenantUser,
} from '../routing';

type WorkspaceGuardProps = {
  workspace: 'platform' | 'tenant';
  children: React.ReactNode;
};

export default function WorkspaceGuard({
  workspace,
  children,
}: WorkspaceGuardProps) {
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

    if (workspace === 'platform' && !isPlatformUser(user)) {
      router.replace(getDefaultWorkspacePath(user));
      return;
    }

    if (workspace === 'tenant' && !isTenantUser(user)) {
      router.replace(getDefaultWorkspacePath(user));
    }
  }, [isAuthenticated, isLoading, router, user, workspace]);

  if (isLoading || !isAuthenticated) {
    return <LoadingState label="Preparing workspace..." />;
  }

  if (workspace === 'platform' && !isPlatformUser(user)) {
    return <LoadingState label="Switching to your allowed workspace..." />;
  }

  if (workspace === 'tenant' && !isTenantUser(user)) {
    return <LoadingState label="Switching to your allowed workspace..." />;
  }

  return <>{children}</>;
}
