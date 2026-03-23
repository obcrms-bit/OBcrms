'use client';

import Link from 'next/link';
import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Activity,
  AlertTriangle,
  Building2,
  CreditCard,
  Download,
  FileClock,
  FileUp,
  Layers3,
  ShieldCheck,
  Sparkles,
  Users,
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
import { superAdminAPI } from '@/src/services/api';
import { useTenantStore } from '@/src/stores/AppDataStore';
import PlatformTenantDrawer from '../components/PlatformTenantDrawer';
import PlatformTenantFilterBar from '../components/PlatformTenantFilterBar';
import PlatformTenantTable from '../components/PlatformTenantTable';
import {
  ActivityList,
  AttentionPanel,
  ChartCard,
  EmptyResultsState,
  HeroCommandPanel,
  InsightCard,
  KpiCard,
  LoadingPanel,
  ProgressBar,
  QuickActionCard,
  StatusBadge,
} from '../components/platform-ui';
import type {
  PlatformImportBatchRecord,
  PlatformTenantRecord,
  SortDirection,
  TenantFilterState,
  TenantSortField,
} from '../platform.types';
import {
  DEFAULT_TENANT_FILTERS,
  buildDashboardModel,
  buildPlatformCapabilities,
  buildPlatformTenantDataset,
  exportTenantRecords,
  filterTenants,
  mapImportBatchToRecord,
  paginateTenants,
  sortTenants,
} from '../platform.utils';

const chartPalette = ['#0f172a', '#2563eb', '#14b8a6', '#f59e0b', '#ef4444'];
const PAGE_SIZE = 8;

export default function PlatformDashboardPage() {
  const router = useRouter();
  const { login, user } = useAuth();
  const {
    overview,
    tenants,
    loadingOverview,
    loadingTenants,
    loadOverview,
    loadTenants,
    loadTenantDetail,
  } = useTenantStore();
  const [importBatches, setImportBatches] = useState<PlatformImportBatchRecord[]>([]);
  const [loadingImports, setLoadingImports] = useState(false);
  const [selectedTenant, setSelectedTenant] = useState<PlatformTenantRecord | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [drawerLoading, setDrawerLoading] = useState(false);
  const [tenantDetail, setTenantDetail] = useState<any>(null);
  const [filters, setFilters] = useState<TenantFilterState>({ ...DEFAULT_TENANT_FILTERS });
  const [sortField, setSortField] = useState<TenantSortField>('lastActivityAt');
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc');
  const [page, setPage] = useState(1);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  const loadCommandCenter = useCallback(async () => {
    setLoadingImports(true);
    await Promise.all([
      loadOverview().catch(() => null),
      loadTenants({}).catch(() => null),
      superAdminAPI
        .getImportLogs({ limit: 24 })
        .then((response) => {
          const batches = response?.data?.data?.batches || [];
          setImportBatches(batches.map(mapImportBatchToRecord));
        })
        .catch(() => {
          setImportBatches([]);
        }),
    ]);
    setLoadingImports(false);
  }, [loadOverview, loadTenants]);

  useEffect(() => {
    void loadCommandCenter();
  }, [loadCommandCenter]);

  const capabilities = useMemo(() => buildPlatformCapabilities(user), [user]);

  const tenantRecords = useMemo(
    () =>
      buildPlatformTenantDataset(
        tenants?.length ? tenants : overview?.tenants || [],
        overview?.billingPlans || []
      ),
    [overview, tenants]
  );

  const dashboardModel = useMemo(
    () =>
      buildDashboardModel({
        overview,
        tenants: tenantRecords,
        importBatches,
      }),
    [overview, tenantRecords, importBatches]
  );

  const countries = useMemo(
    () => Array.from(new Set(tenantRecords.map((tenant) => tenant.country))).sort(),
    [tenantRecords]
  );

  const filteredTenants = useMemo(
    () => filterTenants(tenantRecords, filters),
    [filters, tenantRecords]
  );

  const sortedTenants = useMemo(
    () => sortTenants(filteredTenants, sortField, sortDirection),
    [filteredTenants, sortDirection, sortField]
  );

  const pagination = useMemo(
    () => paginateTenants(sortedTenants, page, PAGE_SIZE),
    [page, sortedTenants]
  );

  const selectedImport = useMemo(
    () =>
      selectedTenant
        ? importBatches.find(
            (batch) =>
              batch.importedTenantId === selectedTenant.id ||
              batch.importedTenantName === selectedTenant.name
          ) || null
        : null,
    [importBatches, selectedTenant]
  );

  useEffect(() => {
    setPage(1);
  }, [filters, sortDirection, sortField]);

  const handleViewTenant = useCallback(
    async (tenant: PlatformTenantRecord) => {
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
      } catch {
        setTenantDetail(null);
      } finally {
        setDrawerLoading(false);
      }
    },
    [loadTenantDetail]
  );

  const openTenantWorkspace = useCallback(
    async (tenant: PlatformTenantRecord) => {
      if (tenant.source !== 'api' || !capabilities.canImpersonate) {
        return;
      }

      const response = await superAdminAPI.impersonateTenant(tenant.id);
      await login(response.data?.data);
      router.push('/tenant/dashboard');
    },
    [capabilities.canImpersonate, login, router]
  );

  if ((loadingOverview || loadingTenants || loadingImports) && !tenantRecords.length) {
    return <LoadingPanel label="Loading super admin command center..." />;
  }

  const kpis = [
    {
      label: 'Total Tenants',
      value: tenantRecords.length,
      helper: 'All consultancies under platform ownership',
      icon: Building2,
      tone: 'neutral' as const,
      trend: `${dashboardModel.launchReadyTenants} launch ready`,
      href: '/platform/tenants',
    },
    {
      label: 'Active Tenants',
      value: dashboardModel.activeTenants,
      helper: 'Live platform workspaces in good standing',
      icon: ShieldCheck,
      tone: 'success' as const,
      trend: `${dashboardModel.platformHealthScore}/100 platform health`,
      href: '/platform/tenants',
    },
    {
      label: 'Suspended Tenants',
      value: dashboardModel.suspendedTenants,
      helper: 'Currently blocked from tenant access',
      icon: AlertTriangle,
      tone: dashboardModel.suspendedTenants ? ('warning' as const) : ('neutral' as const),
      trend: `${dashboardModel.billingIssues} billing-linked issues`,
      href: '/platform/alerts',
    },
    {
      label: 'Onboarding In Progress',
      value: dashboardModel.onboardingInProgress,
      helper: 'Tenants still moving through setup',
      icon: Sparkles,
      tone: 'info' as const,
      trend: `${dashboardModel.activeImports} active import jobs`,
      href: '/platform/onboarding',
    },
    {
      label: 'Total Branches',
      value: overview?.kpis?.totalBranches || 0,
      helper: 'Visible branch footprint across tenants',
      icon: Layers3,
      tone: 'neutral' as const,
      trend: `${Math.round(
        (overview?.kpis?.totalBranches || 0) / Math.max(tenantRecords.length, 1)
      )} avg per tenant`,
      href: '/platform/tenants',
    },
    {
      label: 'Total Platform Users',
      value: overview?.kpis?.totalUsers || 0,
      helper: 'Active users across the portfolio',
      icon: Users,
      tone: 'neutral' as const,
      trend: `${dashboardModel.averageHealthScore}/100 avg health`,
      href: '/platform/tenants',
    },
    {
      label: 'MRR Visibility',
      value: new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD',
        maximumFractionDigits: 0,
      }).format(dashboardModel.totalMrr),
      helper: 'Estimated recurring revenue by active plan mix',
      icon: CreditCard,
      tone: 'info' as const,
      trend: `${dashboardModel.activeTenants} revenue-contributing tenants`,
      href: '/platform/billing',
    },
    {
      label: 'Billing Issues',
      value: dashboardModel.billingIssues,
      helper: 'Past due, inactive, or cancelled billing states',
      icon: CreditCard,
      tone: dashboardModel.billingIssues ? ('danger' as const) : ('success' as const),
      trend: `${overview?.supportTools?.pastDueTenants || 0} past due`,
      href: '/platform/billing',
    },
    {
      label: 'Platform Alerts',
      value: dashboardModel.attentionItems.length,
      helper: 'Actionable issues surfaced across the platform',
      icon: AlertTriangle,
      tone: dashboardModel.criticalIssues ? ('danger' as const) : ('warning' as const),
      trend: `${dashboardModel.criticalIssues} critical`,
      href: '/platform/alerts',
    },
    {
      label: 'Active Imports / Jobs',
      value: dashboardModel.activeImports,
      helper: 'Tenant setup workbooks currently in flight',
      icon: FileClock,
      tone: dashboardModel.activeImports ? ('info' as const) : ('neutral' as const),
      trend: `${importBatches.filter((batch) => batch.status === 'failed').length} failed`,
      href: '/platform/import',
    },
  ];

  return (
    <div className="space-y-8">
      <HeroCommandPanel
        roleLabel={capabilities.roleLabel}
        title="Platform-wide tenant monitoring and control"
        subtitle="Investor-ready command center for platform ownership, onboarding supervision, billing visibility, SLA risk scanning, and explainable operational insight across every tenant."
        insights={dashboardModel.heroInsights}
        actions={
          <>
            {capabilities.canCreateTenant ? (
              <Link
                href="/platform/onboarding"
                className="inline-flex items-center gap-2 rounded-2xl bg-white px-4 py-3 text-sm font-semibold text-slate-950 transition hover:bg-slate-100"
              >
                <Sparkles className="h-4 w-4" />
                Add Tenant
              </Link>
            ) : null}
            <Link
              href="/platform/import"
              className="inline-flex items-center gap-2 rounded-2xl border border-white/10 bg-white/10 px-4 py-3 text-sm font-semibold text-white transition hover:bg-white/15"
            >
              <FileUp className="h-4 w-4" />
              Import Tenant File
            </Link>
            <button
              type="button"
              onClick={() => exportTenantRecords(sortedTenants.length ? sortedTenants : tenantRecords, 'platform-summary.csv')}
              className="inline-flex items-center gap-2 rounded-2xl border border-white/10 bg-white/10 px-4 py-3 text-sm font-semibold text-white transition hover:bg-white/15"
            >
              <Download className="h-4 w-4" />
              Generate Report
            </button>
            <Link
              href="/platform/audit"
              className="inline-flex items-center gap-2 rounded-2xl border border-white/10 bg-white/10 px-4 py-3 text-sm font-semibold text-white transition hover:bg-white/15"
            >
              <Activity className="h-4 w-4" />
              Open Audit Logs
            </Link>
            <Link
              href="/platform/alerts"
              className="inline-flex items-center gap-2 rounded-2xl border border-white/10 bg-white/10 px-4 py-3 text-sm font-semibold text-white transition hover:bg-white/15"
            >
              <AlertTriangle className="h-4 w-4" />
              Open Alerts
            </Link>
          </>
        }
      />

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
        {kpis.map((item) => (
          <KpiCard key={item.label} {...item} />
        ))}
      </section>

      <section className="grid gap-4 xl:grid-cols-4">
        <QuickActionCard href="/platform/onboarding" icon={Sparkles} label="Add Tenant" description="Launch a new consultancy workspace, assign a plan, and start onboarding from the platform layer." />
        <QuickActionCard href="/platform/import" icon={FileUp} label="Upload Setup Workbook" description="Preview workbook imports, catch validation errors, and push clean tenant provisioning batches." />
        <QuickActionCard href="/platform/tenants" icon={Building2} label="Open Tenant Management" description="Inspect every tenant, open the right drawer, and move quickly into billing, audit, or onboarding actions." />
        <QuickActionCard href="/platform/ai-insights" icon={Sparkles} label="Open AI Insights" description="See explainable platform signals around declining health, onboarding bottlenecks, and rollout readiness." />
      </section>

      <section className="grid gap-5 xl:grid-cols-2 2xl:grid-cols-4">
        <ChartCard eyebrow="Revenue Trend" title="Recurring revenue visibility" subtitle="Estimated MRR from current active plan mix across the portfolio.">
          <div className="h-[250px]">
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
                <YAxis tickFormatter={(value) => `$${Math.round(value / 1000)}k`} stroke="#94a3b8" tickLine={false} axisLine={false} />
                <Tooltip />
                <Area type="monotone" dataKey="value" stroke="#2563eb" strokeWidth={2.4} fill="url(#platformRevenueFill)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </ChartCard>

        <ChartCard eyebrow="Tenant Growth" title="Portfolio expansion" subtitle="Total tenants versus active operating base over time.">
          <div className="h-[250px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={dashboardModel.tenantGrowthTrend} barGap={12}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
                <XAxis dataKey="label" stroke="#94a3b8" tickLine={false} axisLine={false} />
                <YAxis stroke="#94a3b8" tickLine={false} axisLine={false} />
                <Tooltip />
                <Bar dataKey="secondaryValue" fill="#0f172a" radius={[8, 8, 0, 0]} />
                <Bar dataKey="value" fill="#93c5fd" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </ChartCard>

        <ChartCard eyebrow="Plan Distribution" title="Commercial mix" subtitle="How the portfolio is distributed across pricing tiers.">
          <div className="grid gap-4 xl:grid-cols-[0.9fr_1.1fr]">
            <div className="h-[220px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={dashboardModel.planDistribution} dataKey="value" nameKey="label" innerRadius={50} outerRadius={82} paddingAngle={4}>
                    {dashboardModel.planDistribution.map((entry, index) => (
                      <Cell key={entry.label} fill={chartPalette[index % chartPalette.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="space-y-3">
              {dashboardModel.planDistribution.map((item, index) => (
                <div key={item.label} className="rounded-[22px] border border-slate-200/80 bg-slate-50/80 p-4 dark:border-slate-800 dark:bg-slate-900/70">
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <span className="h-3 w-3 rounded-full" style={{ backgroundColor: chartPalette[index % chartPalette.length] }} />
                      <p className="font-semibold text-slate-950 dark:text-slate-50">{item.label}</p>
                    </div>
                    <p className="text-sm font-semibold text-slate-500 dark:text-slate-400">{item.value}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </ChartCard>

        <ChartCard eyebrow="Onboarding Completion" title="Readiness distribution" subtitle="Which tenants are complete, in progress, or blocked before launch.">
          <div className="space-y-4">
            {dashboardModel.onboardingDistribution.map((item, index) => (
              <div key={item.label}>
                <div className="flex items-center justify-between gap-3">
                  <p className="text-sm font-semibold text-slate-950 dark:text-slate-50">{item.label}</p>
                  <p className="text-sm font-semibold text-slate-500 dark:text-slate-400">{item.value}</p>
                </div>
                <ProgressBar className="mt-3" value={(item.value / Math.max(tenantRecords.length, 1)) * 100} tone={index === 0 ? 'success' : index === 1 ? 'warning' : 'danger'} />
              </div>
            ))}
          </div>
        </ChartCard>
      </section>

      <section className="grid gap-5 xl:grid-cols-2 2xl:grid-cols-4">
        <ChartCard eyebrow="Health Distribution" title="Tenant health posture" subtitle="How the portfolio is distributed by platform health score.">
          <div className="space-y-4">
            {dashboardModel.healthDistribution.map((item, index) => (
              <div key={item.label}>
                <div className="flex items-center justify-between gap-3">
                  <p className="text-sm font-semibold text-slate-950 dark:text-slate-50">{item.label}</p>
                  <p className="text-sm font-semibold text-slate-500 dark:text-slate-400">{item.value}</p>
                </div>
                <ProgressBar className="mt-3" value={(item.value / Math.max(tenantRecords.length, 1)) * 100} tone={index === 0 ? 'success' : index === 1 ? 'warning' : 'danger'} />
              </div>
            ))}
          </div>
        </ChartCard>

        <ChartCard eyebrow="Branch Distribution" title="Operational scale mix" subtitle="Branch footprint buckets across the visible tenant portfolio.">
          <div className="space-y-4">
            {dashboardModel.branchDistribution.map((item) => (
              <div key={item.label} className="rounded-[20px] border border-slate-200/80 bg-slate-50/80 px-4 py-4 dark:border-slate-800 dark:bg-slate-900/70">
                <div className="flex items-center justify-between gap-3">
                  <p className="font-semibold text-slate-950 dark:text-slate-50">{item.label}</p>
                  <p className="text-sm font-semibold text-slate-500 dark:text-slate-400">{item.value}</p>
                </div>
              </div>
            ))}
          </div>
        </ChartCard>

        <ChartCard eyebrow="Alert Severity" title="Issue concentration" subtitle="Critical versus watch-level issues across tenants and import workflows.">
          <div className="space-y-4">
            {dashboardModel.alertSeverityDistribution.map((item, index) => (
              <div key={item.label}>
                <div className="flex items-center justify-between gap-3">
                  <p className="text-sm font-semibold text-slate-950 dark:text-slate-50">{item.label}</p>
                  <p className="text-sm font-semibold text-slate-500 dark:text-slate-400">{item.value}</p>
                </div>
                <ProgressBar className="mt-3" value={(item.value / Math.max(tenantRecords.length, 1)) * 100} tone={index === 0 ? 'danger' : index === 1 ? 'warning' : 'success'} />
              </div>
            ))}
          </div>
        </ChartCard>

        <ChartCard eyebrow="Import Trend" title="Import success vs failure" subtitle="Workbook pipeline visibility across recent months.">
          <div className="h-[250px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={dashboardModel.importTrend} barGap={12}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
                <XAxis dataKey="label" stroke="#94a3b8" tickLine={false} axisLine={false} />
                <YAxis stroke="#94a3b8" tickLine={false} axisLine={false} allowDecimals={false} />
                <Tooltip />
                <Bar dataKey="value" name="Imported" fill="#14b8a6" radius={[8, 8, 0, 0]} />
                <Bar dataKey="secondaryValue" name="Failed" fill="#ef4444" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </ChartCard>
      </section>

      <section className="grid gap-5 xl:grid-cols-[minmax(0,1.15fr)_minmax(340px,0.85fr)]">
        <div className="space-y-5">
          <ChartCard eyebrow="Tenant Management Preview" title="Platform tenant supervision" subtitle="Search, sort, and scan tenants from the command center before moving into deeper management.">
            {tenantRecords.length ? (
              <div className="space-y-5">
                <PlatformTenantFilterBar filters={filters} countries={countries} onChange={(field, value) => setFilters((current) => ({ ...current, [field]: value }))} onReset={() => setFilters({ ...DEFAULT_TENANT_FILTERS })} />
                <PlatformTenantTable
                  items={pagination.items}
                  selectedIds={selectedIds}
                  sortField={sortField}
                  sortDirection={sortDirection}
                  page={pagination.page}
                  pages={pagination.pages}
                  total={pagination.total}
                  onToggleAllPage={(checked) =>
                    setSelectedIds((current) => {
                      const pageIds = pagination.items.map((item) => item.id);
                      return checked ? Array.from(new Set([...current, ...pageIds])) : current.filter((id) => !pageIds.includes(id));
                    })
                  }
                  onToggleSelect={(tenantId) =>
                    setSelectedIds((current) =>
                      current.includes(tenantId) ? current.filter((id) => id !== tenantId) : [...current, tenantId]
                    )
                  }
                  onSortChange={(field) => {
                    setSortField(field);
                    setSortDirection((current) =>
                      sortField === field ? (current === 'asc' ? 'desc' : 'asc') : 'desc'
                    );
                  }}
                  onView={handleViewTenant}
                  onEdit={(tenant) => router.push(`/platform/tenants/${tenant.id}`)}
                  onOpenOnboarding={(tenant) => router.push(`/platform/onboarding?tenant=${tenant.id}`)}
                  onOpenTenant={capabilities.canImpersonate ? openTenantWorkspace : undefined}
                  onOpenBilling={(tenant) => router.push(`/platform/tenants/${tenant.id}?tab=subscription`)}
                  onOpenAudit={(tenant) => router.push(`/platform/tenants/${tenant.id}?tab=audit`)}
                  onToggleStatus={(tenant) =>
                    superAdminAPI
                      .updateTenantStatus(tenant.id, { status: tenant.status === 'suspended' ? 'active' : 'suspended' })
                      .then(() => loadCommandCenter())
                  }
                  onPageChange={setPage}
                />
              </div>
            ) : (
              <EmptyResultsState title="No tenants yet" description="Create your first consultancy or import a setup workbook to populate the super admin command center." action={<Link href="/platform/onboarding" className="inline-flex items-center gap-2 rounded-2xl bg-slate-950 px-4 py-3 text-sm font-semibold text-white transition hover:bg-slate-800 dark:bg-slate-100 dark:text-slate-950 dark:hover:bg-white">Launch onboarding</Link>} />
            )}
          </ChartCard>

          <ChartCard eyebrow="AI Insights Panel" title="Explainable platform insight" subtitle="Operational insight driven by tenant health, import posture, adoption risk, and launch readiness.">
            {dashboardModel.aiInsights.length ? (
              <div className="grid gap-3 xl:grid-cols-2">
                {dashboardModel.aiInsights.map((insight) => (
                  <InsightCard key={insight.id} {...insight} />
                ))}
              </div>
            ) : (
              <EmptyResultsState title="No AI insights yet" description="Once tenants, imports, and platform activity begin accumulating, explainable insights will appear here." compact />
            )}
          </ChartCard>
        </div>

        <div className="space-y-5">
          <AttentionPanel items={dashboardModel.attentionItems.map((item) => ({ ...item, level: item.level === 'critical' ? 'critical' : item.level === 'watch' ? 'warning' : 'success' }))} title="Attention Required" subtitle="Incomplete onboarding, failed imports, billing issues, inactive tenants, and setup risks surfaced for fast action." />

          <ChartCard eyebrow="System Monitoring" title="Platform systems at a glance" subtitle="Import flow, billing posture, form coverage, and integration readiness from the platform lens.">
            <div className="grid gap-3">
              {dashboardModel.systemHealth.map((item) => (
                <div key={item.id} className="rounded-[22px] border border-slate-200/80 bg-slate-50/85 p-4 dark:border-slate-800 dark:bg-slate-900/70">
                  <div className="flex items-center justify-between gap-3">
                    <p className="font-semibold text-slate-950 dark:text-slate-50">{item.label}</p>
                    <StatusBadge label={item.value} tone={item.tone} />
                  </div>
                  <p className="mt-2 text-sm leading-6 text-slate-500 dark:text-slate-400">{item.helper}</p>
                </div>
              ))}
            </div>
          </ChartCard>

          <ChartCard eyebrow="Recent Platform Activity" title="Chronological owner-visible activity" subtitle="Tenant creation, import updates, billing changes, and audit-visible platform actions.">
            <ActivityList items={dashboardModel.activityFeed} />
          </ChartCard>
        </div>
      </section>

      <PlatformTenantDrawer
        open={drawerOpen}
        tenant={selectedTenant}
        detail={tenantDetail}
        recentImport={selectedImport}
        loading={drawerLoading}
        onClose={() => setDrawerOpen(false)}
        onOpenTenant={() => selectedTenant && openTenantWorkspace(selectedTenant)}
        onEditTenant={() => selectedTenant && router.push(`/platform/tenants/${selectedTenant.id}`)}
        onResumeOnboarding={() => selectedTenant && router.push(`/platform/onboarding?tenant=${selectedTenant.id}`)}
        onOpenBilling={() => selectedTenant && router.push(`/platform/tenants/${selectedTenant.id}?tab=subscription`)}
        onOpenAudit={() => selectedTenant && router.push(`/platform/tenants/${selectedTenant.id}?tab=audit`)}
      />
    </div>
  );
}
