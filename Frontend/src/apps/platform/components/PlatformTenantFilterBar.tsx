'use client';

import { RotateCcw, Search } from 'lucide-react';
import type {
  PlatformBillingStatus,
  PlatformPlanKey,
  PlatformTenantStatus,
  TenantFilterState,
} from '../platform.types';

type PlatformTenantFilterBarProps = {
  filters: TenantFilterState;
  countries: string[];
  onChange: (field: keyof TenantFilterState, value: string) => void;
  onReset: () => void;
};

const fieldClassName =
  'h-11 rounded-2xl border border-slate-200 bg-white px-4 text-sm text-slate-900 outline-none transition focus:border-sky-500 focus:ring-4 focus:ring-sky-500/10 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-100';

export default function PlatformTenantFilterBar({
  filters,
  countries,
  onChange,
  onReset,
}: PlatformTenantFilterBarProps) {
  return (
    <div className="rounded-[28px] border border-slate-200/80 bg-white/96 p-4 shadow-[0_20px_50px_rgba(15,23,42,0.08)] dark:border-slate-800 dark:bg-slate-950/92">
      <div className="grid gap-3 xl:grid-cols-[minmax(0,1.6fr)_repeat(5,minmax(0,0.8fr))_auto]">
        <label className="relative block">
          <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input
            value={filters.search}
            onChange={(event) => onChange('search', event.target.value)}
            className={`${fieldClassName} w-full pl-11`}
            placeholder="Search tenant, code, domain, or owner email"
          />
        </label>

        <select
          value={filters.status}
          onChange={(event) => onChange('status', event.target.value as PlatformTenantStatus | 'all')}
          className={fieldClassName}
        >
          <option value="all">All status</option>
          <option value="active">Active</option>
          <option value="trial">Trial</option>
          <option value="onboarding">Onboarding</option>
          <option value="past_due">Past Due</option>
          <option value="suspended">Suspended</option>
        </select>

        <select
          value={filters.plan}
          onChange={(event) => onChange('plan', event.target.value as PlatformPlanKey | 'all')}
          className={fieldClassName}
        >
          <option value="all">All plan</option>
          <option value="starter">Starter</option>
          <option value="growth">Growth</option>
          <option value="enterprise">Enterprise</option>
        </select>

        <select
          value={filters.onboarding}
          onChange={(event) => onChange('onboarding', event.target.value)}
          className={fieldClassName}
        >
          <option value="all">All onboarding</option>
          <option value="complete">Complete</option>
          <option value="progress">In progress</option>
          <option value="blocked">Blocked</option>
        </select>

        <select
          value={filters.country}
          onChange={(event) => onChange('country', event.target.value)}
          className={fieldClassName}
        >
          <option value="">All country</option>
          {countries.map((country) => (
            <option key={country} value={country}>
              {country}
            </option>
          ))}
        </select>

        <select
          value={filters.billing}
          onChange={(event) =>
            onChange('billing', event.target.value as PlatformBillingStatus | 'all')
          }
          className={fieldClassName}
        >
          <option value="all">All billing</option>
          <option value="active">Active</option>
          <option value="trial">Trial</option>
          <option value="past_due">Past Due</option>
          <option value="inactive">Inactive</option>
          <option value="cancelled">Cancelled</option>
        </select>

        <select
          value={filters.dateRange}
          onChange={(event) => onChange('dateRange', event.target.value)}
          className={fieldClassName}
        >
          <option value="all">All time</option>
          <option value="30d">Last 30d</option>
          <option value="90d">Last 90d</option>
          <option value="180d">Last 180d</option>
          <option value="365d">Last 365d</option>
        </select>

        <button
          type="button"
          onClick={onReset}
          className="inline-flex h-11 items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-200 dark:hover:bg-slate-900"
        >
          <RotateCcw className="h-4 w-4" />
          Reset
        </button>
      </div>
    </div>
  );
}
