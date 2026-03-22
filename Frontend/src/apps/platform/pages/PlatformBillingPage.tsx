'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ErrorState,
  LoadingState,
  MetricCard,
  StatusPill,
  formatCurrency,
} from '@/components/app/shared';
import { CreditCard, Landmark, Users } from 'lucide-react';
import { superAdminAPI } from '@/src/services/api';
import { useTenantStore } from '@/src/stores/AppDataStore';

export default function PlatformBillingPage() {
  const [plans, setPlans] = useState<any[]>([]);
  const [actionError, setActionError] = useState('');
  const { overview, loadingOverview, error: storeError, loadOverview } = useTenantStore();

  const loadBillingWorkspace = useCallback(async () => {
    setActionError('');
    try {
      const [overviewResponse, plansResponse] = await Promise.all([
        loadOverview(),
        superAdminAPI.getBillingPlans(),
      ]);
      setPlans(plansResponse.data?.data?.plans || []);
      return overviewResponse;
    } catch (requestError: any) {
      setActionError(
        requestError?.response?.data?.message ||
          requestError?.message ||
          'Failed to load platform billing data.'
      );
      return null;
    }
  }, [loadOverview]);

  useEffect(() => {
    void loadBillingWorkspace();
  }, [loadBillingWorkspace]);

  const cards = useMemo(
    () => [
      {
        label: 'Active Subscriptions',
        value: overview?.kpis?.activeSubscriptions || 0,
        helper: 'Tenants in trial or active state',
        icon: CreditCard,
        accent: 'bg-slate-900',
      },
      {
        label: 'Past Due Tenants',
        value: overview?.supportTools?.pastDueTenants || 0,
        helper: 'Require billing follow-up',
        icon: Landmark,
        accent: 'bg-amber-600',
      },
      {
        label: 'Suspended Tenants',
        value: overview?.supportTools?.suspendedTenants || 0,
        helper: 'Disabled from tenant access',
        icon: Users,
        accent: 'bg-rose-600',
      },
    ],
    [overview]
  );

  const error = actionError || storeError;

  if (loadingOverview) {
    return <LoadingState label="Loading billing overview..." />;
  }

  return (
    <div className="space-y-8">
      {error ? <ErrorState message={error} onRetry={loadBillingWorkspace} /> : null}

      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.25em] text-teal-700">
          Billing Overview
        </p>
        <h1 className="mt-2 text-3xl font-semibold tracking-tight text-slate-950">
          Plan mix and commercial posture
        </h1>
        <p className="mt-2 max-w-4xl text-sm leading-6 text-slate-600">
          Review pricing tiers, tenant subscription state, and platform revenue posture from one
          control-plane surface.
        </p>
      </div>

      <div className="grid gap-4 xl:grid-cols-3">
        {cards.map((card) => (
          <MetricCard key={card.label} {...card} />
        ))}
      </div>

      <div className="grid gap-6 xl:grid-cols-[0.95fr_1.05fr]">
        <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
            Billing Plans
          </p>
          <div className="mt-5 space-y-3">
            {plans.map((plan) => (
              <article key={plan._id || plan.key} className="rounded-2xl border border-slate-200 p-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="font-semibold text-slate-900">{plan.name}</p>
                    <p className="mt-1 text-sm text-slate-500">{plan.description}</p>
                  </div>
                  <StatusPill tone="converted">{plan.key}</StatusPill>
                </div>
                <div className="mt-4 grid gap-3 md:grid-cols-2">
                  <div className="rounded-2xl bg-slate-50 p-4 text-sm text-slate-600">
                    Monthly {formatCurrency(plan.priceMonthly || 0)}
                  </div>
                  <div className="rounded-2xl bg-slate-50 p-4 text-sm text-slate-600">
                    Yearly {formatCurrency(plan.priceYearly || 0)}
                  </div>
                </div>
              </article>
            ))}
          </div>
        </section>

        <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
            Tenant Billing Status
          </p>
          <div className="mt-5 space-y-3">
            {(overview?.tenants || []).map((tenant: any) => (
              <article key={tenant.id} className="rounded-2xl border border-slate-200 p-4">
                <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                  <div>
                    <p className="font-semibold text-slate-900">{tenant.name}</p>
                    <p className="mt-1 text-sm text-slate-500">
                      {tenant.plan} / {tenant.usersCount} users / {tenant.branchCount} branches
                    </p>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <StatusPill tone={tenant.billingStatus === 'active' ? 'completed' : 'pending'}>
                      {tenant.billingStatus}
                    </StatusPill>
                    <StatusPill tone={tenant.status === 'suspended' ? 'overdue' : 'pending'}>
                      {tenant.status}
                    </StatusPill>
                  </div>
                </div>
              </article>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}
