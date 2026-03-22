import { Filter, RefreshCw, Search } from 'lucide-react';
import { FilterToolbar } from '@/components/app/design-system';
import { getSelectedBranchId } from '@/src/services/workspace';
import { buildLeadFilters, LEAD_SOURCES, LEAD_STATUSES } from '../constants/lead-filter-options';

export default function LeadFilters({ filters, setFilters, onApply, onReset }) {
  return (
    <FilterToolbar>
      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4 2xl:grid-cols-5">
        <div className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 shadow-sm md:col-span-2 xl:col-span-2 2xl:col-span-2">
          <Search className="h-4 w-4 text-slate-400" />
          <input
            className="w-full bg-transparent text-sm text-slate-900 outline-none placeholder:text-slate-400"
            onChange={(event) =>
              setFilters((current) => ({
                ...current,
                search: event.target.value,
              }))
            }
            onKeyDown={(event) => {
              if (event.key === 'Enter') {
                onApply(1);
              }
            }}
            placeholder="Search by name, email, or phone"
            value={filters.search}
          />
        </div>

        <select
          className="ds-field"
          onChange={(event) =>
            setFilters((current) => ({
              ...current,
              viewScope: event.target.value,
            }))
          }
          value={filters.viewScope}
        >
          <option value="">All accessible leads</option>
          <option value="my">My leads</option>
          <option value="team">Team leads</option>
          <option value="branch">Branch leads</option>
          <option value="transferred">Transferred leads</option>
        </select>

        <select
          className="ds-field"
          onChange={(event) =>
            setFilters((current) => ({
              ...current,
              status: event.target.value,
            }))
          }
          value={filters.status}
        >
          <option value="">All stages</option>
          {LEAD_STATUSES.map((status) => (
            <option key={status} value={status}>
              {status.replace(/_/g, ' ')}
            </option>
          ))}
        </select>

        <select
          className="ds-field"
          onChange={(event) =>
            setFilters((current) => ({
              ...current,
              source: event.target.value,
            }))
          }
          value={filters.source}
        >
          <option value="">All sources</option>
          {LEAD_SOURCES.map((source) => (
            <option key={source} value={source}>
              {source}
            </option>
          ))}
        </select>

        <select
          className="ds-field"
          onChange={(event) =>
            setFilters((current) => ({
              ...current,
              category: event.target.value,
            }))
          }
          value={filters.category}
        >
          <option value="">All categories</option>
          <option value="hot">Hot</option>
          <option value="warm">Warm</option>
          <option value="cold">Cold</option>
        </select>

        <label className="flex items-center gap-2 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-medium text-slate-700 shadow-sm">
          <input
            type="checkbox"
            checked={filters.transferredOnly}
            onChange={(event) =>
              setFilters((current) => ({
                ...current,
                transferredOnly: event.target.checked,
              }))
            }
          />
          <span>Transfers only</span>
        </label>

        <input
          className="ds-field"
          placeholder="Branch name"
          value={filters.branch}
          onChange={(event) =>
            setFilters((current) => ({
              ...current,
              branch: event.target.value,
            }))
          }
        />

        <input
          className="ds-field"
          placeholder="Course"
          value={filters.course}
          onChange={(event) =>
            setFilters((current) => ({
              ...current,
              course: event.target.value,
            }))
          }
        />

        <input
          type="date"
          className="ds-field"
          value={filters.fromDate}
          onChange={(event) =>
            setFilters((current) => ({
              ...current,
              fromDate: event.target.value,
            }))
          }
        />

        <input
          type="date"
          className="ds-field"
          value={filters.toDate}
          onChange={(event) =>
            setFilters((current) => ({
              ...current,
              toDate: event.target.value,
            }))
          }
        />

        <button
          className="ds-button-secondary"
          onClick={() => {
            const resetFilters = buildLeadFilters(getSelectedBranchId() || '');
            onReset(resetFilters);
          }}
          type="button"
        >
          <RefreshCw className="h-4 w-4" />
          Reset
        </button>

        <button className="ds-button-primary" onClick={() => onApply(1)} type="button">
          <Filter className="h-4 w-4" />
          Apply
        </button>
      </div>
    </FilterToolbar>
  );
}
