'use client';

import { ChevronDown, ChevronLeft, ChevronRight, MoreHorizontal } from 'lucide-react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import type {
  PlatformTenantRecord,
  SortDirection,
  TenantSortField,
} from '../platform.types';
import { formatRelativeDate, getStatusTone } from '../platform.utils';
import { ProgressBar, StatusBadge } from './platform-ui';

type PlatformBulkActionBarProps = {
  selectedCount: number;
  busy?: boolean;
  onActivate: () => void;
  onSuspend: () => void;
  onExport: () => void;
  onClear: () => void;
};

export function PlatformBulkActionBar({
  selectedCount,
  busy = false,
  onActivate,
  onSuspend,
  onExport,
  onClear,
}: PlatformBulkActionBarProps) {
  if (!selectedCount) {
    return null;
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: -8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8 }}
      className="rounded-[24px] border border-slate-200/80 bg-white/95 px-4 py-3 shadow-[0_18px_40px_rgba(15,23,42,0.08)] backdrop-blur dark:border-slate-800 dark:bg-slate-950/90"
    >
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div className="text-sm font-semibold text-slate-900 dark:text-slate-100">
          {selectedCount} tenants selected
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={onActivate}
            disabled={busy}
            className="rounded-2xl border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm font-semibold text-emerald-700 transition hover:bg-emerald-100 disabled:opacity-60 dark:border-emerald-500/20 dark:bg-emerald-500/10 dark:text-emerald-300"
          >
            Activate selected
          </button>
          <button
            type="button"
            onClick={onSuspend}
            disabled={busy}
            className="rounded-2xl border border-amber-200 bg-amber-50 px-3 py-2 text-sm font-semibold text-amber-700 transition hover:bg-amber-100 disabled:opacity-60 dark:border-amber-500/20 dark:bg-amber-500/10 dark:text-amber-300"
          >
            Suspend selected
          </button>
          <button
            type="button"
            onClick={onExport}
            disabled={busy}
            className="rounded-2xl border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:opacity-60 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-200 dark:hover:bg-slate-900"
          >
            Export selected
          </button>
          <button
            type="button"
            onClick={onClear}
            className="rounded-2xl border border-transparent px-3 py-2 text-sm font-semibold text-slate-500 transition hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-900"
          >
            Clear
          </button>
        </div>
      </div>
    </motion.div>
  );
}

type PlatformTenantTableProps = {
  items: PlatformTenantRecord[];
  selectedIds: string[];
  sortField: TenantSortField;
  sortDirection: SortDirection;
  page: number;
  pages: number;
  total: number;
  onToggleAllPage: (checked: boolean) => void;
  onToggleSelect: (tenantId: string) => void;
  onSortChange: (field: TenantSortField) => void;
  onView: (tenant: PlatformTenantRecord) => void;
  onEdit: (tenant: PlatformTenantRecord) => void;
  onOpenOnboarding: (tenant: PlatformTenantRecord) => void;
  onToggleStatus: (tenant: PlatformTenantRecord) => void;
  onPageChange: (page: number) => void;
};

const headerButtonClassName =
  'inline-flex items-center gap-1 text-[11px] font-semibold uppercase tracking-[0.22em] text-slate-500 transition hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-100';

export default function PlatformTenantTable({
  items,
  selectedIds,
  sortField,
  sortDirection,
  page,
  pages,
  total,
  onToggleAllPage,
  onToggleSelect,
  onSortChange,
  onView,
  onEdit,
  onOpenOnboarding,
  onToggleStatus,
  onPageChange,
}: PlatformTenantTableProps) {
  const allPageSelected = items.length > 0 && items.every((item) => selectedIds.includes(item.id));

  return (
    <div className="overflow-hidden rounded-[28px] border border-slate-200/80 bg-white/96 shadow-[0_24px_60px_rgba(15,23,42,0.08)] dark:border-slate-800 dark:bg-slate-950/92">
      <div className="overflow-x-auto">
        <table className="min-w-[1500px] w-full">
          <thead className="sticky top-0 z-10 bg-white/95 backdrop-blur dark:bg-slate-950/95">
            <tr className="border-b border-slate-200/80 dark:border-slate-800">
              <th className="w-[54px] px-4 py-4 text-left">
                <input
                  type="checkbox"
                  checked={allPageSelected}
                  onChange={(event) => onToggleAllPage(event.target.checked)}
                  className="h-4 w-4 rounded border-slate-300 text-slate-900 focus:ring-sky-500"
                />
              </th>
              {[
                ['name', 'Tenant Name'],
                ['code', 'Code'],
                ['plan', 'Plan'],
                ['status', 'Status'],
                ['country', 'Country'],
                ['branches', 'Branches'],
                ['users', 'Users'],
                ['setupCompletion', 'Setup Completion'],
                ['billingStatus', 'Billing Status'],
                ['lastActivityAt', 'Last Activity'],
                ['createdAt', 'Created Date'],
              ].map(([field, label]) => (
                <th key={field} className="px-4 py-4 text-left">
                  <button
                    type="button"
                    onClick={() => onSortChange(field as TenantSortField)}
                    className={headerButtonClassName}
                  >
                    {label}
                    <ChevronDown
                      className={cn(
                        'h-3.5 w-3.5 transition',
                        sortField === field && sortDirection === 'asc' && 'rotate-180 text-slate-900 dark:text-slate-100',
                        sortField === field && sortDirection === 'desc' && 'text-slate-900 dark:text-slate-100'
                      )}
                    />
                  </button>
                </th>
              ))}
              <th className="px-4 py-4 text-left text-[11px] font-semibold uppercase tracking-[0.22em] text-slate-500 dark:text-slate-400">
                Actions
              </th>
            </tr>
          </thead>
          <tbody>
            {items.map((tenant) => (
              <tr
                key={tenant.id}
                className="group border-b border-slate-100 transition hover:bg-slate-50/80 dark:border-slate-900 dark:hover:bg-slate-900/70"
              >
                <td className="px-4 py-4 align-top">
                  <input
                    type="checkbox"
                    checked={selectedIds.includes(tenant.id)}
                    onChange={() => onToggleSelect(tenant.id)}
                    className="mt-1 h-4 w-4 rounded border-slate-300 text-slate-900 focus:ring-sky-500"
                  />
                </td>
                <td className="px-4 py-4 align-top">
                  <button
                    type="button"
                    onClick={() => onView(tenant)}
                    className="text-left"
                  >
                    <div className="font-semibold text-slate-950 dark:text-slate-100">
                      {tenant.name}
                    </div>
                    <div className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                      {tenant.ownerEmail}
                    </div>
                  </button>
                </td>
                <td className="px-4 py-4 text-sm font-medium text-slate-600 dark:text-slate-300">
                  {tenant.code}
                </td>
                <td className="px-4 py-4 align-top">
                  <StatusBadge label={tenant.planLabel} tone="info" />
                </td>
                <td className="px-4 py-4 align-top">
                  <StatusBadge label={tenant.status} tone={getStatusTone(tenant.status)} />
                </td>
                <td className="px-4 py-4 text-sm text-slate-600 dark:text-slate-300">
                  {tenant.country}
                </td>
                <td className="px-4 py-4 text-sm text-slate-600 dark:text-slate-300">
                  {tenant.branches}
                </td>
                <td className="px-4 py-4 text-sm text-slate-600 dark:text-slate-300">
                  {tenant.users}
                </td>
                <td className="min-w-[170px] px-4 py-4 align-top">
                  <div className="space-y-2">
                    <div className="flex items-center justify-between gap-3 text-sm">
                      <span className="font-semibold text-slate-950 dark:text-slate-100">
                        {tenant.setupCompletion}%
                      </span>
                      <span className="text-slate-500 dark:text-slate-400">
                        {tenant.healthScore}/100 health
                      </span>
                    </div>
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
                </td>
                <td className="px-4 py-4 align-top">
                  <StatusBadge
                    label={tenant.billingStatus}
                    tone={getStatusTone(tenant.billingStatus)}
                  />
                </td>
                <td className="px-4 py-4 text-sm text-slate-600 dark:text-slate-300">
                  {formatRelativeDate(tenant.lastActivityAt)}
                </td>
                <td className="px-4 py-4 text-sm text-slate-600 dark:text-slate-300">
                  {new Intl.DateTimeFormat('en-US', {
                    month: 'short',
                    day: 'numeric',
                    year: 'numeric',
                  }).format(new Date(tenant.createdAt))}
                </td>
                <td className="px-4 py-4 align-top">
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => onView(tenant)}
                      className="rounded-2xl border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-200 dark:hover:bg-slate-900"
                    >
                      View
                    </button>
                    <button
                      type="button"
                      onClick={() => onEdit(tenant)}
                      className="rounded-2xl border border-transparent px-3 py-2 text-sm font-semibold text-slate-500 transition hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-900"
                    >
                      Edit
                    </button>
                    <button
                      type="button"
                      onClick={() => onOpenOnboarding(tenant)}
                      className="rounded-2xl border border-sky-200 bg-sky-50 px-3 py-2 text-sm font-semibold text-sky-700 transition hover:bg-sky-100 dark:border-sky-500/20 dark:bg-sky-500/10 dark:text-sky-300 dark:hover:bg-sky-500/20"
                    >
                      Onboarding
                    </button>
                    <button
                      type="button"
                      onClick={() => onToggleStatus(tenant)}
                      className="rounded-2xl border border-amber-200 bg-amber-50 px-3 py-2 text-sm font-semibold text-amber-700 transition hover:bg-amber-100 dark:border-amber-500/20 dark:bg-amber-500/10 dark:text-amber-300 dark:hover:bg-amber-500/20"
                    >
                      {tenant.status === 'suspended' ? 'Activate' : 'Suspend'}
                    </button>
                    <button
                      type="button"
                      className="inline-flex h-10 w-10 items-center justify-center rounded-2xl border border-slate-200 bg-white text-slate-500 transition hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-300 dark:hover:bg-slate-900"
                    >
                      <MoreHorizontal className="h-4 w-4" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="flex flex-col gap-4 border-t border-slate-200/80 px-5 py-4 md:flex-row md:items-center md:justify-between dark:border-slate-800">
        <p className="text-sm text-slate-500 dark:text-slate-400">
          Showing {(page - 1) * 10 + 1} to {Math.min(page * 10, total)} of {total} tenants
        </p>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => onPageChange(page - 1)}
            disabled={page <= 1}
            className="inline-flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:opacity-50 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-200 dark:hover:bg-slate-900"
          >
            <ChevronLeft className="h-4 w-4" />
            Previous
          </button>
          <div className="rounded-2xl bg-slate-100 px-4 py-2 text-sm font-semibold text-slate-700 dark:bg-slate-900 dark:text-slate-200">
            Page {page} of {pages}
          </div>
          <button
            type="button"
            onClick={() => onPageChange(page + 1)}
            disabled={page >= pages}
            className="inline-flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:opacity-50 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-200 dark:hover:bg-slate-900"
          >
            Next
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
