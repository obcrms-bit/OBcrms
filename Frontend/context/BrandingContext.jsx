'use client';

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { platformAPI } from '@/src/services/api';
import {
  applyBrandingToDocument,
  DEFAULT_BRANDING,
  normalizeBranding,
} from '@/src/services/branding';
import { getSelectedBranchId, WORKSPACE_BRANCH_EVENT } from '@/src/services/workspace';

const BrandingContext = createContext({
  branding: DEFAULT_BRANDING,
  isLoading: false,
  refreshBranding: async () => {},
});

const buildBrandingFromUser = (user) =>
  normalizeBranding({
    companyName: user?.company?.name || DEFAULT_BRANDING.companyName,
    ...(user?.company?.settings || {}),
  });

export function BrandingProvider({ children }) {
  const { isAuthenticated, user } = useAuth();
  const [branding, setBranding] = useState(() => buildBrandingFromUser(user));
  const [isLoading, setIsLoading] = useState(false);

  const refreshBranding = useCallback(async (branchId = getSelectedBranchId()) => {
    if (!isAuthenticated) {
      const nextBranding = buildBrandingFromUser(user);
      setBranding(nextBranding);
      applyBrandingToDocument(nextBranding);
      return nextBranding;
    }

    setIsLoading(true);
    try {
      const response = await platformAPI.getBranding(branchId ? { branchId } : {});
      const nextBranding = normalizeBranding(
        response.data?.data?.effectiveBranding || buildBrandingFromUser(user)
      );
      setBranding(nextBranding);
      applyBrandingToDocument(nextBranding);
      return nextBranding;
    } catch (error) {
      const fallbackBranding = buildBrandingFromUser(user);
      setBranding(fallbackBranding);
      applyBrandingToDocument(fallbackBranding);
      return fallbackBranding;
    } finally {
      setIsLoading(false);
    }
  }, [isAuthenticated, user]);

  useEffect(() => {
    const initialBranding = buildBrandingFromUser(user);
    setBranding(initialBranding);
    applyBrandingToDocument(initialBranding);
  }, [user]);

  useEffect(() => {
    refreshBranding(getSelectedBranchId());

    const handleBranchChange = async (event) => {
      await refreshBranding(event?.detail?.branchId || '');
    };

    window.addEventListener(WORKSPACE_BRANCH_EVENT, handleBranchChange);
    return () => {
      window.removeEventListener(WORKSPACE_BRANCH_EVENT, handleBranchChange);
    };
  }, [isAuthenticated, refreshBranding]);

  const value = useMemo(
    () => ({
      branding,
      isLoading,
      refreshBranding,
      setBranding,
    }),
    [branding, isLoading, refreshBranding]
  );

  return <BrandingContext.Provider value={value}>{children}</BrandingContext.Provider>;
}

export function useBranding() {
  return useContext(BrandingContext);
}
