'use client';

import { useEffect, useMemo, useState } from 'react';
import { AlertTriangle } from 'lucide-react';
import {
  EmptyState,
  ErrorState,
  LoadingState,
  StatusPill,
} from '@/components/app/shared';
import { useTenantStore } from '@/src/stores/AppDataStore';

type PlatformTenantOverview = {
  id: string;
  name: string;
  status: string;
  healthScore: number;
  warnings?: string[];
};

type PlatformAlertItem = {
  id: string;
  tenantName: string;
  status: string;
  healthScore: number;
  message: string;
};

export default function PlatformAlertsPage() {
  const [actionError, setActionError] = useState('');
  const { overview, loadingOverview, error: storeError, loadOverview } = useTenantStore();

  useEffect(() => {
    loadOverview().catch((error: Error) => {
      setActionError(error?.message || 'Failed to load platform alerts.');
    });
  }, [loadOverview]);

  const error = actionError || storeError;

  const alertItems = useMemo(
    () =>
      (overview?.tenants || [])
        .flatMap((tenant: PlatformTenantOverview) =>
          (tenant.warnings || []).map((warning: string, index: number): PlatformAlertItem => ({
            id: `${tenant.id}-${index}`,
            tenantName: tenant.name,
            status: tenant.status,
            healthScore: tenant.healthScore,
            message: warning,
          }))
        )
        .sort(
          (left: PlatformAlertItem, right: PlatformAlertItem) =>
            left.healthScore - right.healthScore
        ),
    [overview]
  );

  if (loadingOverview) {
    return <LoadingState label="Loading platform alerts..." />;
  }

  return (
    <div className="space-y-8">
      {error ? <ErrorState message={error} onRetry={loadOverview} /> : null}

      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.25em] text-teal-700">
          System Alerts
        </p>
        <h1 className="mt-2 text-3xl font-semibold tracking-tight text-slate-950">
          Cross-tenant risk watchlist
        </h1>
        <p className="mt-2 max-w-4xl text-sm leading-6 text-slate-600">
          Review onboarding issues, billing drift, missing setup, and low-health tenants before
          they become support incidents.
        </p>
      </div>

      {alertItems.length ? (
        <div className="grid gap-4 xl:grid-cols-2">
          {alertItems.map((item: PlatformAlertItem) => (
            <article
              key={item.id}
              className="rounded-3xl border border-amber-200 bg-[linear-gradient(180deg,#fffdf7_0%,#fff7ed_100%)] p-5 shadow-sm"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-amber-100 text-amber-700">
                    <AlertTriangle className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="font-semibold text-slate-900">{item.tenantName}</p>
                    <p className="mt-1 text-sm text-slate-600">{item.message}</p>
                  </div>
                </div>
                <StatusPill tone={item.status === 'suspended' ? 'overdue' : 'pending'}>
                  {item.status}
                </StatusPill>
              </div>
              <div className="mt-4 flex flex-wrap gap-2">
                <StatusPill tone="pending">Health {item.healthScore}/100</StatusPill>
              </div>
            </article>
          ))}
        </div>
      ) : (
        <EmptyState
          title="No platform alerts"
          description="All tenants currently look healthy from the platform perspective."
        />
      )}
    </div>
  );
}
