'use client';

import Link from 'next/link';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { AnimatePresence } from 'framer-motion';
import {
  AlertTriangle,
  Building2,
  CheckCircle2,
  CreditCard,
  Download,
  FileUp,
  PauseCircle,
  ShieldAlert,
  Sparkles,
} from 'lucide-react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { superAdminAPI } from '@/src/services/api';
import { useTenantStore } from '@/src/stores/AppDataStore';
import PlatformTenantDrawer from '../components/PlatformTenantDrawer';
import PlatformTenantFilterBar from '../components/PlatformTenantFilterBar';
import PlatformTenantTable, {
  PlatformBulkActionBar,
} from '../components/PlatformTenantTable';
import {
  AttentionPanel,
  EmptyResultsState,
  KpiCard,
  PageHeading,
  StatusBadge,
  TableSkeleton,
} from '../components/platform-ui';
import type {
  PlatformBillingStatus,
  PlatformTenantRecord,
  PlatformTenantStatus,
  SortDirection,
  TenantFilterState,
  TenantSortField,
} from '../platform.types';
import {
  DEFAULT_TENANT_FILTERS,
  buildPlatformTenantDataset,
  exportTenantRecords,
  filterTenants,
  formatRelativeDate,
  getStatusTone,
  paginateTenants,
  sortTenants,
} from '../platform.utils';

const PAGE_SIZE = 10;

const createLocalStatusPatch = (
  record: PlatformTenantRecord,
  status: PlatformTenantStatus
) => ({
  status,
  billingStatus: (
    status === 'suspended'
      ? 'inactive'
      : record.billingStatus === 'inactive'
        ? 'active'
        : record.billingStatus
  ) as PlatformBillingStatus,
});

export default function PlatformTenantsPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { login } = useAuth();
  const {
    overview,
    tenants,
    loadingOverview,
    loadingTenants,
    error: storeError,
    loadOverview,
    loadTenants,
    loadTenantDetail,
  } = useTenantStore();
  const [filters, setFilters] = useState<TenantFilterState>({
    ...DEFAULT_TENANT_FILTERS,
    search: searchParams?.get('search') || '',
  });
  const [sortField, setSortField] = useState<TenantSortField>('lastActivityAt');
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc');
  const [page, setPage] = useState(1);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [selectedTenant, setSelectedTenant] = useState<PlatformTenantRecord | null>(null);
  const [drawerDetail, setDrawerDetail] = useState<any>(null);
  const [drawerLoading, setDrawerLoading] = useState(false);
  const [localOverrides, setLocalOverrides] = useState<Record<string, Partial<PlatformTenantRecord>>>(
    {}
  );
  const [actionError, setActionError] = useState('');
  const [bulkBusy, setBulkBusy] = useState(false);

  const refreshPlatformData = useCallback(async () => {
    await Promise.all([loadOverview().catch(() => null), loadTenants({}).catch(() => null)]);
  }, [loadOverview, loadTenants]);

  useEffect(() => {
    void refreshPlatformData();
  }, [refreshPlatformData]);

  useEffect(() => {
    setFilters((current) => ({
      ...current,
      search: searchParams?.get('search') || '',
    }));
  }, [searchParams]);

  const tenantDataset = useMemo(() => {
    const billingPlans = overview?.billingPlans || [];
    const mapped = buildPlatformTenantDataset(tenants || [], billingPlans);
    return mapped.map((record) =>
      localOverrides[record.id] ? { ...record, ...localOverrides[record.id] } : record
    );
  }, [localOverrides, overview?.billingPlans, tenants]);

  const selectedRecords = useMemo(
    () => tenantDataset.filter((record) => selectedIds.includes(record.id)),
    [selectedIds, tenantDataset]
  );

  const countries = useMemo(
    () => Array.from(new Set(tenantDataset.map((record) => record.country))).sort(),
    [tenantDataset]
  );

  const filteredTenants = useMemo(
    () => filterTenants(tenantDataset, filters),
    [filters, tenantDataset]
  );

  const sortedTenants = useMemo(
    () => sortTenants(filteredTenants, sortField, sortDirection),
    [filteredTenants, sortDirection, sortField]
  );

  const pagination = useMemo(
    () => paginateTenants(sortedTenants, page, PAGE_SIZE),
    [page, sortedTenants]
  );

  useEffect(() => {
    if (page !== pagination.page) {
      setPage(pagination.page);
    }
  }, [page, pagination.page]);

  useEffect(() => {
    setSelectedIds((current) =>
      current.filter((id) => tenantDataset.some((record) => record.id === id))
    );
  }, [tenantDataset]);

  useEffect(() => {
    setPage(1);
  }, [filters, sortDirection, sortField]);

  const summaryCards = useMemo(
    () => [
      {
        label: 'Total Tenants',
        value: tenantDataset.length,
        helper: 'All consultancies under platform ownership',
        icon: Building2,
        tone: 'neutral' as const,
      },
      {
        label: 'Active',
        value: tenantDataset.filter((record) => record.status === 'active').length,
        helper: 'Commercially healthy and accessible',
        icon: CheckCircle2,
        tone: 'success' as const,
      },
      {
        label: 'Onboarding',
        value: tenantDataset.filter((record) =>
          ['trial', 'onboarding'].includes(record.status)
        ).length,
        helper: 'Still moving through setup and launch',
        icon: Sparkles,
        tone: 'info' as const,
      },
      {
        label: 'Suspended',
        value: tenantDataset.filter((record) => record.status === 'suspended').length,
        helper: 'Not currently accessible to tenant users',
        icon: PauseCircle,
        tone: 'warning' as const,
      },
      {
        label: 'Billing Issues',
        value: tenantDataset.filter((record) =>
          ['past_due', 'inactive', 'cancelled'].includes(record.billingStatus)
        ).length,
        helper: 'Revenue or subscription follow-up needed',
        icon: CreditCard,
        tone: 'danger' as const,
      },
      {
        label: 'Needs Attention',
        value: tenantDataset.filter(
          (record) => record.attentionLevel !== 'healthy' || record.setupCompletion < 70
        ).length,
        helper: 'Setup, activity, or warning signals surfaced',
        icon: ShieldAlert,
        tone: 'warning' as const,
      },
    ],
    [tenantDataset]
  );

  const attentionItems = useMemo<
    Array<{
      id: string;
      tenantName: string;
      label: string;
      message: string;
      level: 'critical' | 'warning';
    }>
  >(() => {
    const items = tenantDataset.flatMap((record) => {
      const nextItems: Array<{
        id: string;
        tenantName: string;
        label: string;
        message: string;
        level: 'critical' | 'warning';
      }> = [];

      if (record.setupCompletion < 70) {
        nextItems.push({
          id: `${record.id}-setup`,
          tenantName: record.name,
          label: 'Incomplete setup',
          message: `${record.setupCompletion}% ready. Owner review is recommended before rollout confidence drops further.`,
          level: record.setupCompletion < 50 ? 'critical' : 'warning',
        });
      }

      if (record.importIssues > 0) {
        nextItems.push({
          id: `${record.id}-import`,
          tenantName: record.name,
          label: 'Failed imports',
          message: `${record.importIssues} onboarding or workflow import issue${record.importIssues > 1 ? 's' : ''} remain unresolved.`,
          level: 'warning',
        });
      }

      if (record.users === 0 || record.inactiveUsers >= Math.max(3, Math.round(record.users * 0.25))) {
        nextItems.push({
          id: `${record.id}-users`,
          tenantName: record.name,
          label: 'No active users',
          message: `${record.inactiveUsers || record.users} users look inactive from the platform lens. Adoption may be at risk.`,
          level: 'warning',
        });
      }

      if (['past_due', 'inactive', 'cancelled'].includes(record.billingStatus)) {
        nextItems.push({
          id: `${record.id}-billing`,
          tenantName: record.name,
          label: 'Billing issue',
          message: `Subscription status is ${record.billingStatus}. Revenue assurance needs owner follow-up.`,
          level: 'critical',
        });
      }

      if (record.status === 'suspended') {
        nextItems.push({
          id: `${record.id}-suspended`,
          tenantName: record.name,
          label: 'Inactive tenant',
          message: `Tenant access is suspended. Review recent activity and determine whether to reactivate or offboard.`,
          level: 'critical',
        });
      }

      return nextItems;
    });

    return items.slice(0, 8);
  }, [tenantDataset]);

  const showTableSkeleton = (loadingOverview || loadingTenants) && !tenants.length;
  const errorMessage = actionError || (!tenantDataset.length ? storeError : '');

  const applyLocalStatus = useCallback(
    (records: PlatformTenantRecord[], nextStatus: PlatformTenantStatus) => {
      setLocalOverrides((current) => {
        const next = { ...current };

        records.forEach((record) => {
          next[record.id] = {
            ...(current[record.id] || {}),
            ...createLocalStatusPatch(record, nextStatus),
          };
        });

        return next;
      });
    },
    []
  );

  const performStatusUpdate = useCallback(
    async (records: PlatformTenantRecord[], nextStatus: PlatformTenantStatus) => {
      if (!records.length) {
        return;
      }

      setActionError('');
      setBulkBusy(true);

      const apiRecords = records.filter((record) => record.source === 'api');
      const previewRecords = records.filter((record) => record.source !== 'api');

      try {
        if (apiRecords.length) {
          await Promise.all(
            apiRecords.map((record) =>
              superAdminAPI.updateTenantStatus(record.id, { status: nextStatus })
            )
          );
        }

        if (previewRecords.length) {
          applyLocalStatus(previewRecords, nextStatus);
        }

        if (apiRecords.length) {
          await refreshPlatformData();
        }

        setSelectedIds((current) =>
          current.filter((id) => !records.some((record) => record.id === id))
        );

        setSelectedTenant((current) =>
          current && records.some((record) => record.id === current.id)
            ? {
                ...current,
                ...createLocalStatusPatch(current, nextStatus),
              }
            : current
        );
      } catch (error: any) {
        setActionError(
          error?.response?.data?.message ||
            error?.message ||
            'Failed to update tenant status.'
        );
      } finally {
        setBulkBusy(false);
      }
    },
    [applyLocalStatus, refreshPlatformData]
  );

  const handleViewTenant = useCallback(
    async (tenant: PlatformTenantRecord) => {
      setSelectedTenant(tenant);
      setDrawerOpen(true);
      setDrawerDetail(null);

      if (tenant.source !== 'api') {
        return;
      }

      setDrawerLoading(true);
      try {
        const detail = await loadTenantDetail(tenant.id);
        setDrawerDetail(detail);
      } catch (error) {
        setDrawerDetail(null);
      } finally {
        setDrawerLoading(false);
      }
    },
    [loadTenantDetail]
  );

  const handleOpenTenant = useCallback(async () => {
    if (!selectedTenant) {
      return;
    }

    if (selectedTenant.source !== 'api') {
      router.push(`/platform/onboarding?tenant=${selectedTenant.id}`);
      return;
    }

    try {
      const response = await superAdminAPI.impersonateTenant(selectedTenant.id);
      await login(response.data?.data);
      router.push('/tenant/dashboard');
    } catch (error: any) {
      setActionError(
        error?.response?.data?.message ||
          error?.message ||
          'Failed to open tenant workspace.'
      );
    }
  }, [login, router, selectedTenant]);

  const handleExport = useCallback(
    (records: PlatformTenantRecord[]) => {
      exportTenantRecords(records, 'platform-tenants.csv');
    },
    []
  );

  return (
    <div className="space-y-6">
      <PageHeading
        eyebrow="Platform Tenant Control"
        title="Tenant Management"
        subtitle="Manage and monitor all consultancies from one platform view with clean separation from tenant operations, premium scanning clarity, and owner-grade control."
        actions={
          <>
            {!tenants.length ? (
              <StatusBadge label="Preview dataset" tone="neutral" />
            ) : (
              <StatusBadge label="Live platform data" tone="success" />
            )}
            <LinkAction href="/platform/onboarding" icon={Sparkles} label="Add Tenant" />
            <LinkAction href="/platform/import" icon={FileUp} label="Import Tenant File" muted />
            <button
              type="button"
              onClick={() => handleExport(filteredTenants.length ? filteredTenants : tenantDataset)}
              className="inline-flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-200 dark:hover:bg-slate-900"
            >
              <Download className="h-4 w-4" />
              Export List
            </button>
          </>
        }
      />

      {errorMessage ? (
        <div className="rounded-[26px] border border-rose-200/80 bg-rose-50/90 px-5 py-4 text-sm text-rose-700 shadow-[0_18px_40px_rgba(244,63,94,0.08)] dark:border-rose-500/20 dark:bg-rose-500/10 dark:text-rose-200">
          {errorMessage}
        </div>
      ) : null}

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-6">
        {summaryCards.map((item) => (
          <KpiCard key={item.label} {...item} />
        ))}
      </section>

      <PlatformTenantFilterBar
        filters={filters}
        countries={countries}
        onChange={(field, value) =>
          setFilters((current) => ({
            ...current,
            [field]: value,
          }))
        }
        onReset={() => setFilters({ ...DEFAULT_TENANT_FILTERS })}
      />

      <AnimatePresence>
        <PlatformBulkActionBar
          selectedCount={selectedIds.length}
          busy={bulkBusy}
          onActivate={() => performStatusUpdate(selectedRecords, 'active')}
          onSuspend={() => performStatusUpdate(selectedRecords, 'suspended')}
          onExport={() => handleExport(selectedRecords)}
          onClear={() => setSelectedIds([])}
        />
      </AnimatePresence>

      <section className="grid gap-5 xl:grid-cols-[minmax(0,1.34fr)_minmax(340px,0.66fr)]">
        <div className="space-y-5">
          {showTableSkeleton ? (
            <TableSkeleton rows={10} />
          ) : pagination.total ? (
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
                  if (checked) {
                    return Array.from(new Set([...current, ...pageIds]));
                  }
                  return current.filter((id) => !pageIds.includes(id));
                })
              }
              onToggleSelect={(tenantId) =>
                setSelectedIds((current) =>
                  current.includes(tenantId)
                    ? current.filter((id) => id !== tenantId)
                    : [...current, tenantId]
                )
              }
              onSortChange={(field) => {
                setSortField(field);
                setSortDirection((current) =>
                  sortField === field ? (current === 'asc' ? 'desc' : 'asc') : 'desc'
                );
              }}
              onView={handleViewTenant}
              onEdit={(tenant) =>
                router.push(
                  tenant.source === 'api'
                    ? `/platform/tenants/${tenant.id}`
                    : `/platform/onboarding?tenant=${tenant.id}`
                )
              }
              onOpenOnboarding={(tenant) =>
                router.push(`/platform/onboarding?tenant=${tenant.id}`)
              }
              onToggleStatus={(tenant) =>
                performStatusUpdate(
                  [tenant],
                  tenant.status === 'suspended' ? 'active' : 'suspended'
                )
              }
              onPageChange={setPage}
            />
          ) : (
            <EmptyResultsState
              title="No tenants found"
              description="Try adjusting the platform filters or import a new consultancy file to bring more tenants into view."
              action={
                <div className="flex justify-center gap-3">
                  <LinkAction href="/platform/onboarding" icon={Sparkles} label="Add Tenant" />
                  <LinkAction
                    href="/platform/import"
                    icon={FileUp}
                    label="Import File"
                    muted
                  />
                </div>
              }
            />
          )}
        </div>

        <div className="space-y-5">
          <AttentionPanel
            items={attentionItems}
            title="Attention Panel"
            subtitle="Incomplete setup, import failures, billing issues, inactive users, and suspended tenants surfaced for fast owner action."
          />

          <div className="rounded-[28px] border border-slate-200/80 bg-white/96 px-5 py-5 shadow-[0_24px_60px_rgba(15,23,42,0.08)] dark:border-slate-800 dark:bg-slate-950/92">
            <div className="flex items-start gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-950 text-white dark:bg-slate-100 dark:text-slate-950">
                <AlertTriangle className="h-5 w-5" />
              </div>
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-[0.28em] text-slate-500 dark:text-slate-400">
                  Platform Lens
                </p>
                <h3 className="mt-2 text-lg font-semibold text-slate-950 dark:text-slate-50">
                  Readiness snapshot
                </h3>
                <p className="mt-2 text-sm leading-6 text-slate-500 dark:text-slate-400">
                  A calm read on how the portfolio is behaving beyond raw counts.
                </p>
              </div>
            </div>

            <div className="mt-6 grid gap-3">
              {[
                {
                  label: 'Average readiness',
                  value: `${Math.round(
                    tenantDataset.reduce((sum, record) => sum + record.setupCompletion, 0) /
                      Math.max(tenantDataset.length, 1)
                  )}%`,
                  helper: 'Across the visible platform portfolio',
                },
                {
                  label: 'Last meaningful activity',
                  value: filteredTenants[0]
                    ? formatRelativeDate(filteredTenants[0].lastActivityAt)
                    : 'No activity',
                  helper: 'Based on the top visible tenant row',
                },
                {
                  label: 'Attention concentration',
                  value: `${tenantDataset.filter((record) => record.attentionLevel === 'critical').length} critical`,
                  helper: 'Tenants that need immediate intervention',
                },
              ].map((item) => (
                <div
                  key={item.label}
                  className="rounded-[22px] border border-slate-200/80 bg-slate-50/85 p-4 dark:border-slate-800 dark:bg-slate-900/70"
                >
                  <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500 dark:text-slate-400">
                    {item.label}
                  </p>
                  <p className="mt-3 text-2xl font-semibold tracking-[-0.04em] text-slate-950 dark:text-slate-50">
                    {item.value}
                  </p>
                  <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">{item.helper}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <PlatformTenantDrawer
        open={drawerOpen}
        tenant={selectedTenant}
        detail={drawerDetail}
        loading={drawerLoading}
        onClose={() => setDrawerOpen(false)}
        onOpenTenant={handleOpenTenant}
        onEditTenant={() =>
          selectedTenant &&
          router.push(
            selectedTenant.source === 'api'
              ? `/platform/tenants/${selectedTenant.id}`
              : `/platform/onboarding?tenant=${selectedTenant.id}`
          )
        }
        onResumeOnboarding={() =>
          selectedTenant && router.push(`/platform/onboarding?tenant=${selectedTenant.id}`)
        }
      />
    </div>
  );
}

function LinkAction({
  href,
  icon: Icon,
  label,
  muted = false,
}: {
  href: string;
  icon: any;
  label: string;
  muted?: boolean;
}) {
  return (
    <Link
      href={href}
      className={
        muted
          ? 'inline-flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-200 dark:hover:bg-slate-900'
          : 'inline-flex items-center gap-2 rounded-2xl bg-slate-950 px-4 py-3 text-sm font-semibold text-white transition hover:bg-slate-800 dark:bg-slate-100 dark:text-slate-950 dark:hover:bg-white'
      }
    >
      <Icon className="h-4 w-4" />
      {label}
    </Link>
  );
}
