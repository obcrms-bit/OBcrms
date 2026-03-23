'use client';

import { AnimatePresence, motion } from 'framer-motion';
import {
  ArrowUpRight,
  BadgeAlert,
  Building2,
  CreditCard,
  Globe2,
  Layers3,
  ShieldCheck,
  Sparkles,
  Users,
  X,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import type { PlatformImportBatchRecord, PlatformTenantRecord } from '../platform.types';
import { formatRelativeDate, getStatusTone } from '../platform.utils';
import { EmptyResultsState, ProgressBar, StatusBadge } from './platform-ui';

type PlatformTenantDrawerProps = {
  open: boolean;
  tenant: PlatformTenantRecord | null;
  detail?: any;
  loading?: boolean;
  recentImport?: PlatformImportBatchRecord | null;
  onClose: () => void;
  onOpenTenant: () => void;
  onEditTenant: () => void;
  onResumeOnboarding: () => void;
  onOpenBilling?: () => void;
  onOpenAudit?: () => void;
};

const infoCardClassName =
  'rounded-[22px] border border-slate-200/80 bg-slate-50/85 p-4 dark:border-slate-800 dark:bg-slate-900/70';

const buildInsightSummary = (tenant: PlatformTenantRecord) => {
  const insights = [];

  if (tenant.setupCompletion < 70) {
    insights.push(`Onboarding is only ${tenant.setupCompletion}% complete.`);
  }
  if (['past_due', 'inactive', 'cancelled'].includes(tenant.billingStatus)) {
    insights.push(`Billing posture is ${tenant.billingStatus}.`);
  }
  if (tenant.users === 0 || tenant.inactiveUsers > 0) {
    insights.push(
      tenant.users === 0
        ? 'No active users detected yet.'
        : `${tenant.inactiveUsers} users look inactive from the platform lens.`
    );
  }
  if (!insights.length && tenant.healthScore >= 85) {
    insights.push('Workspace looks healthy and is approaching launch-ready posture.');
  }

  return insights.slice(0, 3);
};

export default function PlatformTenantDrawer({
  open,
  tenant,
  detail,
  loading = false,
  recentImport = null,
  onClose,
  onOpenTenant,
  onEditTenant,
  onResumeOnboarding,
  onOpenBilling,
  onOpenAudit,
}: PlatformTenantDrawerProps) {
  const detailTenant = detail?.tenant || tenant?.raw?.company || null;
  const branches = detail?.branches || [];
  const workflows = detail?.workflows || [];
  const usageAlerts = detail?.usageAlerts || [];
  const insightSummary = tenant ? buildInsightSummary(tenant) : [];

  return (
    <AnimatePresence>
      {open ? (
        <>
          <motion.button
            aria-label="Close drawer"
            className="fixed inset-0 z-40 bg-slate-950/45 backdrop-blur-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            type="button"
          />
          <motion.aside
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ duration: 0.28, ease: 'easeOut' }}
            className={cn(
              'fixed right-0 top-0 z-50 h-screen w-full max-w-[540px] overflow-y-auto border-l border-slate-200/80 bg-white/97 px-5 py-5 shadow-[0_40px_120px_rgba(15,23,42,0.24)] backdrop-blur dark:border-slate-800 dark:bg-slate-950/95'
            )}
          >
            <div className="flex items-start justify-between gap-4">
              <div className="min-w-0">
                <p className="text-[11px] font-semibold uppercase tracking-[0.3em] text-sky-700 dark:text-sky-300">
                  Tenant Supervision
                </p>
                <h2 className="mt-3 truncate text-2xl font-semibold tracking-[-0.04em] text-slate-950 dark:text-slate-50">
                  {tenant?.name || 'Tenant'}
                </h2>
                <p className="mt-2 text-sm leading-6 text-slate-500 dark:text-slate-400">
                  Platform-level visibility into billing, readiness, activity posture, import health,
                  and next supervision actions.
                </p>
              </div>
              <button
                type="button"
                onClick={onClose}
                className="inline-flex h-11 w-11 items-center justify-center rounded-2xl border border-slate-200 bg-white text-slate-600 transition hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-300 dark:hover:bg-slate-900"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {loading ? (
              <div className="mt-8 space-y-3">
                {Array.from({ length: 6 }).map((_, index) => (
                  <div
                    key={`tenant-drawer-skeleton-${index}`}
                    className="h-20 animate-pulse rounded-[22px] bg-slate-100 dark:bg-slate-900"
                  />
                ))}
              </div>
            ) : tenant ? (
              <div className="mt-8 space-y-5">
                <div className="grid gap-3 sm:grid-cols-2">
                  <div className={infoCardClassName}>
                    <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500 dark:text-slate-400">
                      Plan
                    </p>
                    <div className="mt-3 flex flex-wrap items-center gap-2">
                      <StatusBadge label={tenant.planLabel} tone="info" />
                      <StatusBadge label={tenant.status} tone={getStatusTone(tenant.status)} />
                    </div>
                  </div>
                  <div className={infoCardClassName}>
                    <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500 dark:text-slate-400">
                      Billing
                    </p>
                    <div className="mt-3 flex flex-wrap items-center gap-2">
                      <StatusBadge
                        label={tenant.billingStatus}
                        tone={getStatusTone(tenant.billingStatus)}
                      />
                    </div>
                  </div>
                </div>

                <div className="rounded-[28px] border border-slate-200/80 bg-[linear-gradient(180deg,#ffffff,rgba(248,250,252,0.9))] p-5 dark:border-slate-800 dark:bg-[linear-gradient(180deg,rgba(15,23,42,0.92),rgba(2,6,23,0.88))]">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-slate-500 dark:text-slate-400">
                        Setup readiness
                      </p>
                      <p className="mt-3 text-3xl font-semibold tracking-[-0.04em] text-slate-950 dark:text-slate-50">
                        {tenant.setupCompletion}%
                      </p>
                    </div>
                    <StatusBadge
                      label={tenant.attentionLevel}
                      tone={
                        tenant.attentionLevel === 'critical'
                          ? 'danger'
                          : tenant.attentionLevel === 'watch'
                            ? 'warning'
                            : 'success'
                      }
                    />
                  </div>
                  <ProgressBar
                    className="mt-5"
                    value={tenant.setupCompletion}
                    tone={
                      tenant.setupCompletion >= 85
                        ? 'success'
                        : tenant.setupCompletion >= 55
                          ? 'warning'
                          : 'danger'
                    }
                  />
                  <div className="mt-5 grid gap-3 sm:grid-cols-3">
                    <div className={infoCardClassName}>
                      <div className="flex items-center gap-2 text-slate-500 dark:text-slate-400">
                        <Users className="h-4 w-4" />
                        <span className="text-xs font-semibold uppercase tracking-[0.16em]">
                          Users
                        </span>
                      </div>
                      <p className="mt-3 text-xl font-semibold text-slate-950 dark:text-slate-50">
                        {detail?.subscription?.usage?.activeUsers || tenant.users}
                      </p>
                    </div>
                    <div className={infoCardClassName}>
                      <div className="flex items-center gap-2 text-slate-500 dark:text-slate-400">
                        <Building2 className="h-4 w-4" />
                        <span className="text-xs font-semibold uppercase tracking-[0.16em]">
                          Branches
                        </span>
                      </div>
                      <p className="mt-3 text-xl font-semibold text-slate-950 dark:text-slate-50">
                        {detail?.subscription?.usage?.branches || tenant.branches}
                      </p>
                    </div>
                    <div className={infoCardClassName}>
                      <div className="flex items-center gap-2 text-slate-500 dark:text-slate-400">
                        <ShieldCheck className="h-4 w-4" />
                        <span className="text-xs font-semibold uppercase tracking-[0.16em]">
                          Health
                        </span>
                      </div>
                      <p className="mt-3 text-xl font-semibold text-slate-950 dark:text-slate-50">
                        {tenant.healthScore}/100
                      </p>
                    </div>
                  </div>
                </div>

                <div className={infoCardClassName}>
                  <div className="flex items-center gap-2 text-slate-500 dark:text-slate-400">
                    <Globe2 className="h-4 w-4" />
                    <span className="text-xs font-semibold uppercase tracking-[0.18em]">
                      Account summary
                    </span>
                  </div>
                  <dl className="mt-4 grid gap-3 text-sm">
                    <div className="flex items-center justify-between gap-4">
                      <dt className="text-slate-500 dark:text-slate-400">Owner / Admin Email</dt>
                      <dd className="font-semibold text-slate-950 dark:text-slate-100">
                        {detailTenant?.adminContact?.email || tenant.ownerEmail}
                      </dd>
                    </div>
                    <div className="flex items-center justify-between gap-4">
                      <dt className="text-slate-500 dark:text-slate-400">Country</dt>
                      <dd className="font-semibold text-slate-950 dark:text-slate-100">
                        {tenant.country}
                      </dd>
                    </div>
                    <div className="flex items-center justify-between gap-4">
                      <dt className="text-slate-500 dark:text-slate-400">Last Activity</dt>
                      <dd className="font-semibold text-slate-950 dark:text-slate-100">
                        {formatRelativeDate(tenant.lastActivityAt)}
                      </dd>
                    </div>
                    <div className="flex items-center justify-between gap-4">
                      <dt className="text-slate-500 dark:text-slate-400">Created</dt>
                      <dd className="font-semibold text-slate-950 dark:text-slate-100">
                        {new Intl.DateTimeFormat('en-US', {
                          month: 'short',
                          day: 'numeric',
                          year: 'numeric',
                        }).format(new Date(tenant.createdAt))}
                      </dd>
                    </div>
                  </dl>
                </div>

                <div className={infoCardClassName}>
                  <div className="flex items-center gap-2 text-slate-500 dark:text-slate-400">
                    <Layers3 className="h-4 w-4" />
                    <span className="text-xs font-semibold uppercase tracking-[0.18em]">
                      Operational footprint
                    </span>
                  </div>
                  <div className="mt-4 grid gap-3 sm:grid-cols-2">
                    <div className="rounded-[18px] bg-white px-4 py-3 dark:bg-slate-950">
                      <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500 dark:text-slate-400">
                        Branch records
                      </p>
                      <p className="mt-2 text-base font-semibold text-slate-950 dark:text-slate-100">
                        {branches.length || tenant.branches}
                      </p>
                    </div>
                    <div className="rounded-[18px] bg-white px-4 py-3 dark:bg-slate-950">
                      <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500 dark:text-slate-400">
                        Workflow configs
                      </p>
                      <p className="mt-2 text-base font-semibold text-slate-950 dark:text-slate-100">
                        {workflows.length || tenant.importIssues}
                      </p>
                    </div>
                  </div>
                  {usageAlerts.length ? (
                    <div className="mt-4 space-y-2">
                      {usageAlerts.map((alert: string) => (
                        <div
                          key={alert}
                          className="rounded-[16px] border border-slate-200/80 bg-white px-4 py-3 text-sm text-slate-600 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-300"
                        >
                          {alert}
                        </div>
                      ))}
                    </div>
                  ) : null}
                </div>

                <div className={infoCardClassName}>
                  <div className="flex items-center gap-2 text-slate-500 dark:text-slate-400">
                    <Sparkles className="h-4 w-4" />
                    <span className="text-xs font-semibold uppercase tracking-[0.18em]">
                      AI insight summary
                    </span>
                  </div>
                  <div className="mt-4 space-y-2">
                    {insightSummary.map((item) => (
                      <div
                        key={item}
                        className="rounded-[16px] border border-sky-200/80 bg-sky-50 px-4 py-3 text-sm text-sky-700 dark:border-sky-500/20 dark:bg-sky-500/10 dark:text-sky-300"
                      >
                        {item}
                      </div>
                    ))}
                  </div>
                </div>

                <div className={infoCardClassName}>
                  <div className="flex items-center gap-2 text-slate-500 dark:text-slate-400">
                    <BadgeAlert className="h-4 w-4" />
                    <span className="text-xs font-semibold uppercase tracking-[0.18em]">
                      Import history
                    </span>
                  </div>
                  {recentImport ? (
                    <div className="mt-4 rounded-[18px] bg-white px-4 py-4 dark:bg-slate-950">
                      <div className="flex flex-wrap items-center justify-between gap-3">
                        <div>
                          <p className="font-semibold text-slate-950 dark:text-slate-100">
                            {recentImport.fileName}
                          </p>
                          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                            {recentImport.fileType} import by {recentImport.createdByName}
                          </p>
                        </div>
                        <StatusBadge
                          label={recentImport.status}
                          tone={
                            recentImport.status === 'imported'
                              ? 'success'
                              : recentImport.status === 'failed'
                                ? 'danger'
                                : 'info'
                          }
                        />
                      </div>
                      <ProgressBar
                        className="mt-4"
                        value={recentImport.completionPercentage}
                        tone={
                          recentImport.status === 'failed'
                            ? 'danger'
                            : recentImport.status === 'imported'
                              ? 'success'
                              : 'info'
                        }
                      />
                      <div className="mt-3 flex flex-wrap gap-2 text-xs font-semibold uppercase tracking-[0.16em] text-slate-500 dark:text-slate-400">
                        <span>{recentImport.totalRows} rows</span>
                        <span>/</span>
                        <span>{recentImport.validationErrors} errors</span>
                        <span>/</span>
                        <span>{recentImport.validationWarnings} warnings</span>
                      </div>
                    </div>
                  ) : (
                    <div className="mt-4">
                      <EmptyResultsState
                        compact
                        title="No import history found"
                        description="This tenant looks like it was created manually or no import batch is available yet."
                      />
                    </div>
                  )}
                </div>

                <div className={infoCardClassName}>
                  <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500 dark:text-slate-400">
                    Warnings
                  </p>
                  <div className="mt-4 space-y-2">
                    {tenant.warnings.length ? (
                      tenant.warnings.map((warning) => (
                        <div
                          key={warning}
                          className="rounded-[16px] border border-amber-200/80 bg-amber-50 px-4 py-3 text-sm text-amber-700 dark:border-amber-500/20 dark:bg-amber-500/10 dark:text-amber-300"
                        >
                          {warning}
                        </div>
                      ))
                    ) : (
                      <EmptyResultsState
                        compact
                        title="No open warnings"
                        description="This tenant currently looks healthy from the platform perspective."
                      />
                    )}
                  </div>
                </div>

                <div className="grid gap-3 sm:grid-cols-2">
                  <button
                    type="button"
                    onClick={onOpenTenant}
                    className="inline-flex items-center justify-center gap-2 rounded-2xl bg-slate-950 px-4 py-3 text-sm font-semibold text-white transition hover:bg-slate-800 dark:bg-slate-100 dark:text-slate-950 dark:hover:bg-white"
                  >
                    <ArrowUpRight className="h-4 w-4" />
                    Open Tenant
                  </button>
                  <button
                    type="button"
                    onClick={onEditTenant}
                    className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-200 dark:hover:bg-slate-900"
                  >
                    Edit Tenant
                  </button>
                  <button
                    type="button"
                    onClick={onResumeOnboarding}
                    className="rounded-2xl border border-sky-200 bg-sky-50 px-4 py-3 text-sm font-semibold text-sky-700 transition hover:bg-sky-100 dark:border-sky-500/20 dark:bg-sky-500/10 dark:text-sky-300 dark:hover:bg-sky-500/20"
                  >
                    Resume Onboarding
                  </button>
                  <button
                    type="button"
                    onClick={onOpenBilling}
                    disabled={!onOpenBilling}
                    className="inline-flex items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-200 dark:hover:bg-slate-900"
                  >
                    <CreditCard className="h-4 w-4" />
                    View Billing
                  </button>
                  <button
                    type="button"
                    onClick={onOpenAudit}
                    disabled={!onOpenAudit}
                    className="inline-flex items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-200 dark:hover:bg-slate-900"
                  >
                    <BadgeAlert className="h-4 w-4" />
                    View Audit
                  </button>
                </div>
              </div>
            ) : (
              <div className="mt-8">
                <EmptyResultsState
                  title="No tenant selected"
                  description="Choose a tenant from the table to inspect plan, usage, setup readiness, and platform actions."
                />
              </div>
            )}
          </motion.aside>
        </>
      ) : null}
    </AnimatePresence>
  );
}
