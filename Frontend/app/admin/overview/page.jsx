'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import {
  Activity,
  BadgeHelp,
  BarChart3,
  Building2,
  CreditCard,
  Globe2,
  Layers3,
  ShieldCheck,
  Sparkles,
  Users,
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import {
  ErrorState,
  LoadingState,
  MetricCard,
  StatusPill,
} from '@/components/app/shared';
import { useAuth } from '@/context/AuthContext';
import { superAdminAPI } from '@/src/services/api';
import { useTenantStore } from '@/src/stores/AppDataStore';

const FILTERS = ['all', 'active', 'trial', 'suspended'];

export default function SuperAdminOverviewPage() {
  const router = useRouter();
  const { login } = useAuth();
  const [statusFilter, setStatusFilter] = useState('all');
  const [impersonatingId, setImpersonatingId] = useState('');
  const [actionError, setActionError] = useState('');
  const { overview, loadingOverview, error: storeError, loadOverview } = useTenantStore();

  const error = actionError || storeError;

  useEffect(() => {
    loadOverview().catch(() => {});
  }, [loadOverview]);

  const cards = useMemo(
    () => [
      {
        label: 'Total Tenants',
        value: overview?.kpis?.totalTenants || 0,
        helper: 'Consultancies onboarded',
        icon: Building2,
        accent: 'bg-slate-900',
      },
      {
        label: 'Active Subscriptions',
        value: overview?.kpis?.activeSubscriptions || 0,
        helper: 'Trial or active billing state',
        icon: CreditCard,
        accent: 'bg-emerald-600',
      },
      {
        label: 'Total Users',
        value: overview?.kpis?.totalUsers || 0,
        helper: 'Across every tenant',
        icon: Users,
        accent: 'bg-sky-600',
      },
      {
        label: 'Total Branches',
        value: overview?.kpis?.totalBranches || 0,
        helper: 'Head office + branch network',
        icon: Globe2,
        accent: 'bg-teal-600',
      },
    ],
    [overview]
  );

  const visibleTenants = useMemo(() => {
    const items = overview?.tenants || [];
    if (statusFilter === 'all') {
      return items;
    }
    return items.filter((tenant) => tenant.status === statusFilter);
  }, [overview, statusFilter]);

  const handleImpersonate = async (tenantId) => {
    setImpersonatingId(tenantId);
    setActionError('');
    try {
      const response = await superAdminAPI.impersonateTenant(tenantId);
      await login(response.data?.data);
      router.push('/dashboard');
    } catch (requestError) {
      setActionError(
        requestError?.response?.data?.message ||
          requestError?.message ||
          'Failed to impersonate tenant.'
      );
    } finally {
      setImpersonatingId('');
    }
  };

  if (loadingOverview) {
    return <LoadingState label="Loading owner overview..." />;
  }

  return (
    <div className="space-y-8">
      {error ? <ErrorState message={error} onRetry={loadOverview} /> : null}

      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.25em] text-teal-700">
          Super Admin Dashboard
        </p>
        <h1 className="mt-2 text-3xl font-semibold tracking-tight text-slate-950">
          Multi-tenant SaaS overview
        </h1>
        <p className="mt-2 max-w-4xl text-sm leading-6 text-slate-600">
          Monitor tenant onboarding, subscription health, template adoption, module usage, and
          owner-level support actions from one commercial control plane.
        </p>
      </div>

      <div className="grid gap-4 xl:grid-cols-4">
        {cards.map((card) => (
          <MetricCard key={card.label} {...card} />
        ))}
      </div>

      <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
              Tenant Grid
            </p>
            <h2 className="mt-2 text-xl font-semibold text-slate-900">
              Live tenancy health and commercial status
            </h2>
          </div>
          <div className="flex flex-wrap gap-2">
            {FILTERS.map((filter) => (
              <button
                key={filter}
                type="button"
                onClick={() => setStatusFilter(filter)}
                className={`rounded-full px-4 py-2 text-xs font-semibold uppercase tracking-[0.18em] transition ${
                  statusFilter === filter
                    ? 'bg-slate-900 text-white'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {filter}
              </button>
            ))}
          </div>
        </div>

        <div className="mt-6 grid gap-4 xl:grid-cols-2 2xl:grid-cols-3">
          {visibleTenants.map((tenant) => (
            <article
              key={tenant.id}
              className="rounded-3xl border border-slate-200 bg-slate-50/70 p-5"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-900 text-sm font-semibold text-white">
                    {tenant.name
                      .split(' ')
                      .filter(Boolean)
                      .slice(0, 2)
                      .map((item) => item[0])
                      .join('')}
                  </div>
                  <div>
                    <p className="font-semibold text-slate-900">{tenant.name}</p>
                    <p className="mt-1 text-sm text-slate-500">
                      {tenant.plan} plan / {tenant.billingStatus}
                    </p>
                  </div>
                </div>
                <StatusPill
                  tone={
                    tenant.status === 'active'
                      ? 'completed'
                      : tenant.status === 'trial'
                        ? 'due_today'
                        : 'overdue'
                  }
                >
                  {tenant.status}
                </StatusPill>
              </div>

              <div className="mt-5 grid gap-3 sm:grid-cols-2">
                <div className="rounded-2xl border border-slate-200 bg-white p-4">
                  <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
                    Users
                  </p>
                  <p className="mt-2 text-2xl font-semibold text-slate-900">{tenant.usersCount}</p>
                </div>
                <div className="rounded-2xl border border-slate-200 bg-white p-4">
                  <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
                    Branches
                  </p>
                  <p className="mt-2 text-2xl font-semibold text-slate-900">{tenant.branchCount}</p>
                </div>
              </div>

              <div className="mt-4 flex flex-wrap gap-2">
                {(tenant.countries || []).slice(0, 4).map((country) => (
                  <StatusPill key={country} tone="pending">
                    {country}
                  </StatusPill>
                ))}
              </div>

              <div className="mt-4 rounded-2xl bg-white p-4">
                <div className="flex items-center justify-between gap-3">
                  <p className="text-sm font-semibold text-slate-700">Health score</p>
                  <p className="text-lg font-semibold text-slate-950">{tenant.healthScore}/100</p>
                </div>
                {tenant.warnings?.length ? (
                  <ul className="mt-3 space-y-1 text-sm text-amber-700">
                    {tenant.warnings.slice(0, 2).map((warning) => (
                      <li key={warning}>- {warning}</li>
                    ))}
                  </ul>
                ) : (
                  <p className="mt-3 text-sm text-emerald-700">
                    Tenant is configured and operating cleanly.
                  </p>
                )}
              </div>

              <div className="mt-5 flex flex-wrap gap-2">
                <Link
                  href={`/admin/tenants/${tenant.id}`}
                  className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-100"
                >
                  View
                </Link>
                <button
                  type="button"
                  onClick={() => handleImpersonate(tenant.id)}
                  disabled={impersonatingId === tenant.id}
                  className="rounded-xl bg-slate-900 px-4 py-2 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:opacity-60"
                >
                  {impersonatingId === tenant.id ? 'Impersonating...' : 'Impersonate'}
                </button>
                <Link
                  href={`/admin/tenants/${tenant.id}?tab=subscription`}
                  className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-100"
                >
                  Billing
                </Link>
              </div>
            </article>
          ))}
        </div>
      </section>

      <div className="grid gap-6 xl:grid-cols-[1.05fr_0.95fr]">
        <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
                Onboarding Panel
              </p>
              <h2 className="mt-2 text-xl font-semibold text-slate-900">
                Launch new consultancies without code
              </h2>
            </div>
            <Sparkles className="h-5 w-5 text-teal-600" />
          </div>
          <p className="mt-4 text-sm leading-6 text-slate-600">
            Create tenants, attach a subscription plan, pick a regional template, seed branches,
            and activate the workspace from a guided onboarding wizard.
          </p>
          <div className="mt-5 grid gap-4 md:grid-cols-2">
            <div className="rounded-2xl bg-slate-50 p-4">
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
                Alerts
              </p>
              <p className="mt-2 text-3xl font-semibold text-slate-900">
                {overview?.supportTools?.onboardingAlerts || 0}
              </p>
              <p className="mt-2 text-sm text-slate-500">Tenants need setup follow-up</p>
            </div>
            <div className="rounded-2xl bg-slate-50 p-4">
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
                Low Health
              </p>
              <p className="mt-2 text-3xl font-semibold text-slate-900">
                {overview?.supportTools?.lowHealthTenants || 0}
              </p>
              <p className="mt-2 text-sm text-slate-500">Tenants below healthy threshold</p>
            </div>
          </div>
          <Link
            href="/admin/onboarding"
            className="mt-5 inline-flex items-center gap-2 rounded-xl bg-slate-900 px-4 py-3 text-sm font-semibold text-white transition hover:bg-slate-800"
          >
            <Sparkles className="h-4 w-4" />
            Open Onboarding Wizard
          </Link>
        </section>

        <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
                Template Library
              </p>
              <h2 className="mt-2 text-xl font-semibold text-slate-900">
                Reusable operating models
              </h2>
            </div>
            <Layers3 className="h-5 w-5 text-slate-600" />
          </div>
          <div className="mt-5 space-y-3">
            {(overview?.templates || []).map((template) => (
              <div key={template._id} className="rounded-2xl border border-slate-200 p-4">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="font-semibold text-slate-900">{template.name}</p>
                    <p className="mt-1 text-sm text-slate-500">{template.description}</p>
                  </div>
                  <StatusPill tone="converted">{template.usageCount || 0} uses</StatusPill>
                </div>
                <div className="mt-3 flex flex-wrap gap-2">
                  {(template.countries || []).slice(0, 4).map((country) => (
                    <StatusPill key={country} tone="pending">
                      {country}
                    </StatusPill>
                  ))}
                </div>
              </div>
            ))}
          </div>
          <Link
            href="/admin/templates"
            className="mt-5 inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-100"
          >
            <Layers3 className="h-4 w-4" />
            Manage Templates
          </Link>
        </section>
      </div>

      <div className="grid gap-6 xl:grid-cols-[1fr_1fr_0.9fr]">
        <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
                Recent Activity
              </p>
              <h2 className="mt-2 text-xl font-semibold text-slate-900">
                Latest owner-visible events
              </h2>
            </div>
            <Activity className="h-5 w-5 text-slate-600" />
          </div>
          <div className="mt-5 space-y-3">
            {(overview?.recentAuditLogs || []).map((log) => (
              <div key={log._id} className="rounded-2xl border border-slate-200 p-4">
                <p className="font-semibold text-slate-900">
                  {log.action} on {log.resource}
                </p>
                <p className="mt-1 text-sm text-slate-500">
                  {log.userName || 'System'} / {new Date(log.createdAt).toLocaleString()}
                </p>
                <div className="mt-3 flex flex-wrap gap-2">
                  {log.module ? <StatusPill tone="pending">{log.module}</StatusPill> : null}
                  <StatusPill tone={log.status === 'failure' ? 'overdue' : 'completed'}>
                    {log.status || 'success'}
                  </StatusPill>
                </div>
              </div>
            ))}
          </div>
        </section>

        <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
                Subscription Distribution
              </p>
              <h2 className="mt-2 text-xl font-semibold text-slate-900">
                Plan mix across the platform
              </h2>
            </div>
            <BarChart3 className="h-5 w-5 text-slate-600" />
          </div>
          <div className="mt-5 space-y-3">
            {Object.entries(overview?.subscriptionDistribution || {}).map(([plan, count]) => (
              <div key={plan} className="rounded-2xl border border-slate-200 p-4">
                <div className="flex items-center justify-between gap-3">
                  <p className="font-semibold text-slate-900">{plan}</p>
                  <StatusPill tone="converted">{count}</StatusPill>
                </div>
              </div>
            ))}
          </div>
        </section>

        <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
                Module Usage
              </p>
              <h2 className="mt-2 text-xl font-semibold text-slate-900">
                Feature adoption
              </h2>
            </div>
            <ShieldCheck className="h-5 w-5 text-slate-600" />
          </div>
          <div className="mt-5 space-y-3">
            {Object.entries(overview?.moduleUsage || {})
              .sort((a, b) => b[1] - a[1])
              .slice(0, 6)
              .map(([moduleKey, count]) => (
                <div key={moduleKey} className="rounded-2xl border border-slate-200 p-4">
                  <div className="flex items-center justify-between gap-3">
                    <p className="font-semibold text-slate-900">{moduleKey}</p>
                    <StatusPill tone="pending">{count} tenants</StatusPill>
                  </div>
                </div>
              ))}
          </div>
          <div className="mt-5 rounded-2xl bg-slate-50 p-4 text-sm text-slate-600">
            <p className="font-semibold text-slate-900">Support Tools</p>
            <div className="mt-3 space-y-2">
              <p>- Suspended tenants: {overview?.supportTools?.suspendedTenants || 0}</p>
              <p>- Past due tenants: {overview?.supportTools?.pastDueTenants || 0}</p>
              <p>- Low health tenants: {overview?.supportTools?.lowHealthTenants || 0}</p>
            </div>
            <div className="mt-4 flex items-center gap-2 text-slate-700">
              <BadgeHelp className="h-4 w-4" />
              Use tenant detail for impersonation, billing fixes, and template re-application.
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
