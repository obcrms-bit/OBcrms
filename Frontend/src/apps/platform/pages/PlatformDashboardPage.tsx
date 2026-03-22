'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import {
  Activity,
  AlertTriangle,
  ArrowRight,
  Building2,
  CreditCard,
  FileUp,
  ShieldCheck,
  Sparkles,
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { useAuth } from '@/context/AuthContext';
import { useTenantStore } from '@/src/stores/AppDataStore';
import { getOwnerSnapshot } from '@/src/modules/owner-control-tower/services/owner-control.service';
import {
  buildDashboardModel,
  buildPlatformTenantDataset,
  formatRelativeDate,
  getStatusTone,
} from '../platform.utils';
import type { PlatformTenantRecord } from '../platform.types';
import PlatformTenantDrawer from '../components/PlatformTenantDrawer';
import {
  ActivityList,
  AttentionPanel,
  ChartCard,
  EmptyResultsState,
  KpiCard,
  LoadingPanel,
  PageHeading,
  QuickActionCard,
  ProgressBar,
  StatusBadge,
} from '../components/platform-ui';
import { superAdminAPI } from '@/src/services/api';

const chartPalette = ['#0f172a', '#2563eb', '#14b8a6', '#f59e0b', '#ef4444'];

export default function PlatformDashboardPage() {
  const router = useRouter();
  const { login } = useAuth();
  const {
    overview,
    tenants,
    loadingOverview,
    loadingTenants,
    loadOverview,
    loadTenants,
    loadTenantDetail,
  } = useTenantStore();
  const [ownerSnapshot, setOwnerSnapshot] = useState<any>(null);
  const [selectedTenant, setSelectedTenant] = useState<PlatformTenantRecord | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [drawerLoading, setDrawerLoading] = useState(false);
  const [tenantDetail, setTenantDetail] = useState<any>(null);

  useEffect(() => {
    Promise.all([loadOverview().catch(() => null), loadTenants({}).catch(() => null)]).catch(
      () => null
    );
    getOwnerSnapshot()
      .then(setOwnerSnapshot)
      .catch(() => {});
  }, [loadOverview, loadTenants]);

  const tenantRecords = useMemo(
    () =>
      buildPlatformTenantDataset(
        tenants?.length ? tenants : overview?.tenants || [],
        overview?.billingPlans || []
      ),
    [overview, tenants]
  );

  const dashboardModel = useMemo(
    () => buildDashboardModel(overview, tenantRecords, ownerSnapshot),
    [overview, ownerSnapshot, tenantRecords]
  );

  const kpis = useMemo(
    () => [
      {
        label: 'Total tenants',
        value: dashboardModel.tenants.length,
        helper: 'All consultancies under platform ownership',
        icon: Building2,
        tone: 'neutral' as const,
      },
      {
        label: 'Active tenants',
        value: dashboardModel.tenants.filter((tenant) => tenant.status === 'active').length,
        helper: 'Live consultancies in good standing',
        icon: ShieldCheck,
        tone: 'success' as const,
      },
      {
        label: 'Onboarding count',
        value: dashboardModel.tenants.filter((tenant) =>
          ['trial', 'onboarding'].includes(tenant.status)
        ).length,
        helper: 'Still moving through launch setup',
        icon: Sparkles,
        tone: 'info' as const,
      },
      {
        label: 'MRR',
        value: new Intl.NumberFormat('en-US', {
          style: 'currency',
          currency: 'USD',
          maximumFractionDigits: 0,
        }).format(dashboardModel.totalMrr),
        helper: 'Estimated recurring platform revenue',
        icon: CreditCard,
        tone: 'info' as const,
      },
      {
        label: 'Alerts',
        value: dashboardModel.attentionItems.length,
        helper: 'Cross-tenant issues surfaced right now',
        icon: AlertTriangle,
        tone: dashboardModel.criticalIssues ? ('danger' as const) : ('warning' as const),
      },
    ],
    [dashboardModel]
  );

  const priorityTenants = useMemo(
    () =>
      [...dashboardModel.tenants]
        .sort((left, right) => {
          const leftScore =
            left.attentionLevel === 'critical' ? 3 : left.attentionLevel === 'watch' ? 2 : 1;
          const rightScore =
            right.attentionLevel === 'critical' ? 3 : right.attentionLevel === 'watch' ? 2 : 1;
          if (leftScore !== rightScore) {
            return rightScore - leftScore;
          }
          return left.setupCompletion - right.setupCompletion;
        })
        .slice(0, 6),
    [dashboardModel.tenants]
  );

  const handleViewTenant = async (tenant: PlatformTenantRecord) => {
    setSelectedTenant(tenant);
    setDrawerOpen(true);
    setTenantDetail(null);

    if (tenant.source !== 'api') {
      return;
    }

    setDrawerLoading(true);
    try {
      const detail = await loadTenantDetail(tenant.id);
      setTenantDetail(detail);
    } catch (requestError) {
      setTenantDetail(null);
    } finally {
      setDrawerLoading(false);
    }
  };

  const handleImpersonateTenant = async () => {
    if (!selectedTenant || selectedTenant.source !== 'api') {
      return;
    }

    const response = await superAdminAPI.impersonateTenant(selectedTenant.id);
    await login(response.data?.data);
    router.push('/tenant/dashboard');
  };

  if ((loadingOverview || loadingTenants) && !ownerSnapshot && !tenantRecords.length) {
    return <LoadingPanel label="Loading owner command center..." />;
  }

  return (
    <div className="space-y-8">
      <PageHeading
        eyebrow="Owner Command Center"
        title="Platform control without operational noise"
        subtitle="Track tenant readiness, revenue posture, billing risk, and rollout confidence from one premium control surface designed for platform ownership."
        actions={
          <>
            <Link
              href="/platform/onboarding"
              className="inline-flex items-center gap-2 rounded-2xl bg-slate-950 px-4 py-3 text-sm font-semibold text-white transition hover:bg-slate-800 dark:bg-slate-100 dark:text-slate-950 dark:hover:bg-white"
            >
              <Sparkles className="h-4 w-4" />
              Add Tenant
            </Link>
            <Link
              href="/platform/import"
              className="inline-flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-200 dark:hover:bg-slate-900"
            >
              <FileUp className="h-4 w-4" />
              Import File
            </Link>
          </>
        }
      />

      <section className="grid gap-4 xl:grid-cols-[minmax(0,1.2fr)_minmax(320px,0.8fr)]">
        <div className="rounded-[28px] border border-slate-200/80 bg-[linear-gradient(135deg,#0f172a_0%,#1e293b_55%,#1d4ed8_100%)] px-6 py-6 text-white shadow-[0_30px_80px_rgba(15,23,42,0.26)]">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
            <div className="max-w-3xl">
              <p className="text-[11px] font-semibold uppercase tracking-[0.3em] text-sky-200/80">
                Executive Overview
              </p>
              <h2 className="mt-3 text-[clamp(1.8rem,1.2rem+1.4vw,2.8rem)] font-semibold tracking-[-0.04em]">
                See what is happening, what needs attention, and what to do next.
              </h2>
              <p className="mt-4 max-w-2xl text-sm leading-7 text-slate-200/80">
                Platform-level insight only. No branch queues, no visa ops, no lead clutter. Just
                tenant health, commercial readiness, onboarding progress, and owner-grade control.
              </p>
              <div className="mt-6 flex flex-wrap gap-3">
                <Link
                  href="/platform/tenants"
                  className="inline-flex items-center gap-2 rounded-2xl bg-white px-4 py-3 text-sm font-semibold text-slate-950 transition hover:bg-slate-100"
                >
                  Open Tenant Management
                  <ArrowRight className="h-4 w-4" />
                </Link>
                <Link
                  href="/platform/audit"
                  className="inline-flex items-center gap-2 rounded-2xl border border-white/10 bg-white/10 px-4 py-3 text-sm font-semibold text-white transition hover:bg-white/15"
                >
                  Review Audit
                </Link>
              </div>
            </div>
            <div className="grid w-full gap-3 sm:grid-cols-3 lg:max-w-[460px]">
              {dashboardModel.heroInsights.map((item) => (
                <div
                  key={item.id}
                  className="rounded-[24px] border border-white/10 bg-white/10 px-4 py-4 backdrop-blur"
                >
                  <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-300">
                    {item.label}
                  </p>
                  <p className="mt-3 text-2xl font-semibold tracking-[-0.04em]">{item.value}</p>
                  <p className="mt-2 text-sm leading-6 text-slate-300">{item.helper}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        <AttentionPanel
          items={dashboardModel.attentionItems.map((item) => ({
            ...item,
            level:
              item.level === 'critical'
                ? 'critical'
                : item.level === 'watch'
                  ? 'warning'
                  : 'success',
          }))}
          title="Platform watchlist"
          subtitle="The owner actions most likely to unblock revenue, rollout quality, or tenant confidence."
        />
      </section>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
        {kpis.map((item) => (
          <KpiCard key={item.label} {...item} />
        ))}
      </section>

      <section className="grid gap-4 xl:grid-cols-4">
        <QuickActionCard
          href="/platform/onboarding"
          icon={Sparkles}
          label="Launch a new tenant"
          description="Create a consultancy workspace, assign a plan, and start onboarding without touching tenant operations."
        />
        <QuickActionCard
          href="/platform/import"
          icon={FileUp}
          label="Bulk import consultancies"
          description="Use the guided import flow to validate CSV or JSON tenant files before any records are created."
        />
        <QuickActionCard
          href="/platform/billing"
          icon={CreditCard}
          label="Review billing posture"
          description="Open subscription health, plan mix, and billing risk with a commercial-first lens."
        />
        <QuickActionCard
          href="/platform/audit"
          icon={Activity}
          label="Open audit timeline"
          description="Inspect platform-level activity, impersonation, and rollout events in one clean owner view."
        />
      </section>

      <section className="grid gap-5 xl:grid-cols-2">
        <ChartCard
          eyebrow="Revenue Trend"
          title="Recurring revenue momentum"
          subtitle="Estimated monthly recurring revenue derived from active plan mix across the portfolio."
          badge={<StatusBadge label={`${dashboardModel.revenueTrend.length} months`} tone="info" />}
        >
          <div className="h-[280px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={dashboardModel.revenueTrend}>
                <defs>
                  <linearGradient id="platformRevenueFill" x1="0" x2="0" y1="0" y2="1">
                    <stop offset="0%" stopColor="#2563eb" stopOpacity={0.28} />
                    <stop offset="100%" stopColor="#2563eb" stopOpacity={0.02} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
                <XAxis dataKey="label" stroke="#94a3b8" tickLine={false} axisLine={false} />
                <YAxis
                  stroke="#94a3b8"
                  tickLine={false}
                  axisLine={false}
                  tickFormatter={(value) => `$${Math.round(value / 1000)}k`}
                />
                <Tooltip
                  contentStyle={{
                    borderRadius: 16,
                    border: '1px solid rgba(148,163,184,0.18)',
                    boxShadow: '0 18px 50px rgba(15,23,42,0.12)',
                  }}
                />
                <Area
                  type="monotone"
                  dataKey="value"
                  stroke="#2563eb"
                  strokeWidth={2.4}
                  fill="url(#platformRevenueFill)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </ChartCard>

        <ChartCard
          eyebrow="Tenant Growth"
          title="Portfolio expansion"
          subtitle="Cumulative tenancy footprint and active base over time."
          badge={<StatusBadge label="Active vs total" tone="success" />}
        >
          <div className="h-[280px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={dashboardModel.tenantGrowthTrend} barGap={12}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
                <XAxis dataKey="label" stroke="#94a3b8" tickLine={false} axisLine={false} />
                <YAxis stroke="#94a3b8" tickLine={false} axisLine={false} />
                <Tooltip
                  contentStyle={{
                    borderRadius: 16,
                    border: '1px solid rgba(148,163,184,0.18)',
                    boxShadow: '0 18px 50px rgba(15,23,42,0.12)',
                  }}
                />
                <Bar dataKey="secondaryValue" fill="#0f172a" radius={[8, 8, 0, 0]} />
                <Bar dataKey="value" fill="#93c5fd" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </ChartCard>

        <ChartCard
          eyebrow="Plan Distribution"
          title="Commercial mix by plan"
          subtitle="A clean view of how tenancy is distributed across platform pricing tiers."
          badge={<StatusBadge label="Portfolio mix" tone="neutral" />}
        >
          <div className="grid gap-4 xl:grid-cols-[0.9fr_1.1fr]">
            <div className="h-[240px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={dashboardModel.planDistribution}
                    dataKey="value"
                    nameKey="label"
                    innerRadius={58}
                    outerRadius={84}
                    paddingAngle={4}
                  >
                    {dashboardModel.planDistribution.map((entry, index) => (
                      <Cell
                        key={`${entry.label}-${index}`}
                        fill={chartPalette[index % chartPalette.length]}
                      />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      borderRadius: 16,
                      border: '1px solid rgba(148,163,184,0.18)',
                      boxShadow: '0 18px 50px rgba(15,23,42,0.12)',
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="space-y-3">
              {dashboardModel.planDistribution.map((item, index) => (
                <div
                  key={item.label}
                  className="rounded-[22px] border border-slate-200/80 bg-slate-50/80 p-4 dark:border-slate-800 dark:bg-slate-900/70"
                >
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <span
                        className="h-3 w-3 rounded-full"
                        style={{ backgroundColor: chartPalette[index % chartPalette.length] }}
                      />
                      <p className="font-semibold text-slate-950 dark:text-slate-50">{item.label}</p>
                    </div>
                    <p className="text-sm font-semibold text-slate-500 dark:text-slate-400">
                      {item.value}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </ChartCard>

        <ChartCard
          eyebrow="Onboarding Status"
          title="Readiness distribution"
          subtitle="Which tenants are complete, still in progress, or blocked before a clean launch."
          badge={<StatusBadge label={`${dashboardModel.averageSetupCompletion}% avg`} tone="warning" />}
        >
          <div className="space-y-4">
            {dashboardModel.onboardingDistribution.map((item, index) => (
              <div key={item.label}>
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <span
                      className="h-3 w-3 rounded-full"
                      style={{ backgroundColor: chartPalette[index + 1] }}
                    />
                    <p className="text-sm font-semibold text-slate-950 dark:text-slate-50">
                      {item.label}
                    </p>
                  </div>
                  <p className="text-sm font-semibold text-slate-500 dark:text-slate-400">
                    {item.value}
                  </p>
                </div>
                <ProgressBar
                  className="mt-3"
                  value={(item.value / Math.max(dashboardModel.tenants.length, 1)) * 100}
                  tone={index === 0 ? 'success' : index === 1 ? 'warning' : 'danger'}
                />
              </div>
            ))}
          </div>
        </ChartCard>
      </section>

      <section className="grid gap-5 xl:grid-cols-[minmax(0,1.3fr)_minmax(340px,0.7fr)]">
        <div className="rounded-[28px] border border-slate-200/80 bg-white/96 shadow-[0_24px_60px_rgba(15,23,42,0.08)] dark:border-slate-800 dark:bg-slate-950/92">
          <div className="flex flex-col gap-3 border-b border-slate-200/80 px-5 py-5 md:flex-row md:items-end md:justify-between dark:border-slate-800">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.28em] text-slate-500 dark:text-slate-400">
                Priority Tenants
              </p>
              <h3 className="mt-2 text-lg font-semibold text-slate-950 dark:text-slate-50">
                What deserves owner attention first
              </h3>
              <p className="mt-2 text-sm leading-6 text-slate-500 dark:text-slate-400">
                Tenants with the lowest readiness or strongest warning signals are elevated here.
              </p>
            </div>
            <Link
              href="/platform/tenants"
              className="inline-flex items-center gap-2 text-sm font-semibold text-sky-700 transition hover:text-sky-800 dark:text-sky-300 dark:hover:text-sky-200"
            >
              Open full management
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
          <div className="divide-y divide-slate-100 dark:divide-slate-900">
            {priorityTenants.length ? (
              priorityTenants.map((tenant) => (
                <button
                  key={tenant.id}
                  type="button"
                  onClick={() => handleViewTenant(tenant)}
                  className="grid w-full grid-cols-[minmax(0,1.2fr)_120px_140px_120px] gap-4 px-5 py-4 text-left transition hover:bg-slate-50/80 dark:hover:bg-slate-900/70"
                >
                  <div>
                    <p className="font-semibold text-slate-950 dark:text-slate-100">{tenant.name}</p>
                    <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                      {tenant.ownerEmail}
                    </p>
                  </div>
                  <div className="space-y-2">
                    <StatusBadge label={tenant.status} tone={getStatusTone(tenant.status)} />
                    <p className="text-xs text-slate-400 dark:text-slate-500">{tenant.planLabel}</p>
                  </div>
                  <div className="space-y-2">
                    <p className="text-sm font-semibold text-slate-950 dark:text-slate-100">
                      {tenant.setupCompletion}% ready
                    </p>
                    <ProgressBar
                      value={tenant.setupCompletion}
                      tone={
                        tenant.setupCompletion >= 85
                          ? 'success'
                          : tenant.setupCompletion >= 55
                            ? 'warning'
                            : 'danger'
                      }
                    />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-slate-950 dark:text-slate-100">
                      {formatRelativeDate(tenant.lastActivityAt)}
                    </p>
                    <p className="mt-1 text-xs text-slate-400 dark:text-slate-500">
                      {tenant.country}
                    </p>
                  </div>
                </button>
              ))
            ) : (
              <div className="px-5 py-5">
                <EmptyResultsState
                  title="No tenants available"
                  description="Seed or import your first consultancy to populate the owner command center."
                />
              </div>
            )}
          </div>
        </div>

        <div className="space-y-5">
          <ChartCard
            eyebrow="Activity Feed"
            title="Recent owner-visible activity"
            subtitle="Platform actions, rollouts, and events that changed tenancy state or launch posture."
            badge={<StatusBadge label={`${dashboardModel.activityFeed.length} recent`} tone="neutral" />}
          >
            <ActivityList items={dashboardModel.activityFeed} />
          </ChartCard>

          <ChartCard
            eyebrow="Platform Insight"
            title="What the portfolio is telling you"
            subtitle="A clean summary of usage depth, setup posture, and warning concentration."
            badge={<StatusBadge label="Owner lens" tone="info" />}
          >
            <div className="grid gap-3">
              {[
                {
                  label: 'Average health score',
                  value: `${Math.round(
                    dashboardModel.tenants.reduce((sum, tenant) => sum + tenant.healthScore, 0) /
                      Math.max(dashboardModel.tenants.length, 1)
                  )}/100`,
                },
                {
                  label: 'Tenants with billing risk',
                  value: String(
                    dashboardModel.tenants.filter((tenant) =>
                      ['past_due', 'inactive', 'cancelled'].includes(tenant.billingStatus)
                    ).length
                  ),
                },
                {
                  label: 'Tenants over 85% ready',
                  value: String(
                    dashboardModel.tenants.filter((tenant) => tenant.setupCompletion >= 85).length
                  ),
                },
              ].map((item) => (
                <div
                  key={item.label}
                  className="rounded-[22px] border border-slate-200/80 bg-slate-50/85 p-4 dark:border-slate-800 dark:bg-slate-900/70"
                >
                  <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-slate-500 dark:text-slate-400">
                    {item.label}
                  </p>
                  <p className="mt-3 text-2xl font-semibold tracking-[-0.04em] text-slate-950 dark:text-slate-50">
                    {item.value}
                  </p>
                </div>
              ))}
            </div>
          </ChartCard>
        </div>
      </section>

      <PlatformTenantDrawer
        open={drawerOpen}
        tenant={selectedTenant}
        detail={tenantDetail}
        loading={drawerLoading}
        onClose={() => setDrawerOpen(false)}
        onOpenTenant={handleImpersonateTenant}
        onEditTenant={() => selectedTenant && router.push(`/platform/tenants/${selectedTenant.id}`)}
        onResumeOnboarding={() =>
          selectedTenant && router.push(`/platform/onboarding?tenant=${selectedTenant.id}`)
        }
      />
    </div>
  );
}
