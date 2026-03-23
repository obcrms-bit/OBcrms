'use client';

import React, { createContext, useContext } from 'react';
import { useAuth } from '@/lib/context/AuthContext';

export type PlanTier = 'BASIC' | 'PRO' | 'ENTERPRISE';

interface Entitlements {
    plan: PlanTier;
    maxBranches: number;
    maxUsers: number;
    features: {
        automations: boolean;
        whiteLabeling: boolean;
        apiAccess: boolean;
        customReports: boolean;
    };
}

const defaultEntitlements: Entitlements = {
    plan: 'PRO',
    maxBranches: 5,
    maxUsers: 25,
    features: {
        automations: true,
        whiteLabeling: false,
        apiAccess: false,
        customReports: true,
    }
};

const EntitlementContext = createContext<{ entitlements: Entitlements }>({ entitlements: defaultEntitlements });

export const EntitlementProvider = ({ children }: { children: React.ReactNode }) => {
    const { user } = useAuth();
    // In production, fetch this from the backend based on user.tenantId
    const entitlements = defaultEntitlements;

    return <EntitlementContext.Provider value={{ entitlements }}>{children}</EntitlementContext.Provider>;
};

export const useEntitlements = () => useContext(EntitlementContext);