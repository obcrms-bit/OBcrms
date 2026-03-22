'use client';

import Link from 'next/link';
import { Filter, RefreshCw, Search } from 'lucide-react';
import { FilterToolbar } from '@/components/app/design-system';

type FunnelFiltersBarProps = {
  filters: any;
  stages: any[];
  onChange: (updater: (current: any) => any) => void;
  onApply: () => void;
  onReset: () => void;
};

export default function FunnelFiltersBar({
  filters,
  stages,
  onChange,
  onApply,
  onReset,
}: FunnelFiltersBarProps) {
  return (
    <FilterToolbar>
      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-7">
        <div className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 shadow-sm md:col-span-2 xl:col-span-2">
          <Search className="h-4 w-4 text-slate-400" />
          <input
            className="w-full bg-transparent text-sm text-slate-900 outline-none placeholder:text-slate-400"
            placeholder="Search by lead, email, or phone"
            value={filters.search}
            onChange={(event) =>
              onChange((current) => ({
                ...current,
                search: event.target.value,
              }))
            }
            onKeyDown={(event) => {
              if (event.key === 'Enter') {
                onApply();
              }
            }}
          />
        </div>

        <select
          className="ds-field"
          value={filters.stageKey}
          onChange={(event) =>
            onChange((current) => ({
              ...current,
              stageKey: event.target.value,
            }))
          }
        >
          <option value="">All Funnel stages</option>
          {stages.map((stage) => (
            <option key={stage._id || stage.key} value={stage.key}>
              {stage.name}
            </option>
          ))}
        </select>

        <select
          className="ds-field"
          value={filters.assigneeScope}
          onChange={(event) =>
            onChange((current) => ({
              ...current,
              assigneeScope: event.target.value,
            }))
          }
        >
          <option value="">All visible leads</option>
          <option value="my">Assigned to me</option>
          <option value="primary">I am primary</option>
          <option value="team">Assigned to my team</option>
          <option value="branch">Assigned in my branch</option>
        </select>

        <select
          className="ds-field"
          value={filters.priority}
          onChange={(event) =>
            onChange((current) => ({
              ...current,
              priority: event.target.value,
            }))
          }
        >
          <option value="">All priorities</option>
          {['urgent', 'high', 'medium', 'low', 'stale', 'reactivation_candidate'].map((value) => (
            <option key={value} value={value}>
              {value.replace(/_/g, ' ')}
            </option>
          ))}
        </select>

        <select
          className="ds-field"
          value={filters.temperature}
          onChange={(event) =>
            onChange((current) => ({
              ...current,
              temperature: event.target.value,
            }))
          }
        >
          <option value="">All temperatures</option>
          {['high_intent', 'hot', 'warm', 'warming', 'cooling', 'cold', 'stale'].map((value) => (
            <option key={value} value={value}>
              {value.replace(/_/g, ' ')}
            </option>
          ))}
        </select>

        <label className="flex items-center gap-2 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-medium text-slate-700 shadow-sm">
          <input
            type="checkbox"
            checked={filters.overdueOnly}
            onChange={(event) =>
              onChange((current) => ({
                ...current,
                overdueOnly: event.target.checked,
              }))
            }
          />
          Overdue only
        </label>

        <button className="ds-button-secondary" onClick={onReset} type="button">
          <RefreshCw className="h-4 w-4" />
          Reset
        </button>

        <button className="ds-button-primary" onClick={onApply} type="button">
          <Filter className="h-4 w-4" />
          Apply
        </button>

        <div className="flex items-center gap-3 xl:col-span-2">
          <Link className="ds-button-secondary" href="/tenant/funnel/analytics">
            Funnel Analytics
          </Link>
          <Link className="ds-button-secondary" href="/tenant/funnel/settings">
            Funnel Settings
          </Link>
          <Link className="ds-button-secondary" href="/tenant/funnel/intelligence">
            AI Lead System
          </Link>
        </div>
      </div>
    </FilterToolbar>
  );
}
