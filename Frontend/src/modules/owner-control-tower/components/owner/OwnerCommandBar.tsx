'use client';

import { Bell, CalendarRange, Plus, Search, Upload } from 'lucide-react';
import Link from 'next/link';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import type { ConsultancyRecord, OwnerFilters } from '../../types/owner-control.types';
import { ownerDateFilters } from '../../utils/owner-control.utils';
import OwnerStatusBadge from './OwnerStatusBadge';

type OwnerCommandBarProps = {
  ownerName: string;
  ownerEmail: string;
  notifications: number;
  consultancies: ConsultancyRecord[];
  countries: string[];
  filters: OwnerFilters;
  onFiltersChange: (filters: OwnerFilters) => void;
};

export default function OwnerCommandBar({
  ownerName,
  ownerEmail,
  notifications,
  consultancies,
  countries,
  filters,
  onFiltersChange,
}: OwnerCommandBarProps) {
  return (
    <div className="rounded-[2rem] border border-white/70 bg-white/90 p-5 shadow-[var(--ds-shadow-soft)] backdrop-blur">
      <div className="flex flex-col gap-6 xl:flex-row xl:items-start xl:justify-between">
        <div>
          <p className="text-[0.72rem] font-semibold uppercase tracking-[0.28em] text-teal-700">
            Owner Master Control Tower
          </p>
          <h1 className="mt-3 text-[2.3rem] font-semibold tracking-tight text-slate-950">
            Operate every consultancy from one enterprise workspace
          </h1>
          <p className="mt-3 max-w-3xl text-sm leading-7 text-slate-600">
            Supervise onboarding, setup completion, portfolio health, and import validation across
            all consultancies without dropping into branch-level dashboards.
          </p>
          <div className="mt-4 flex flex-wrap items-center gap-3">
            <OwnerStatusBadge label="Owner session" tone="success" />
            <span className="text-sm text-slate-500">
              {ownerName} • {ownerEmail}
            </span>
          </div>
        </div>

        <div className="grid gap-3 md:grid-cols-3 xl:w-[540px]">
          <Link href="/owner-control-tower/consultancies/new" className="ds-button-primary">
            <Plus className="h-4 w-4" />
            Add Consultancy
          </Link>
          <Link href="/owner-control-tower/imports/new" className="ds-button-secondary">
            <Upload className="h-4 w-4" />
            Import File
          </Link>
          <div className="flex items-center justify-between rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700">
            <div className="flex items-center gap-2">
              <Bell className="h-4 w-4 text-slate-500" />
              Notifications
            </div>
            <span className="rounded-full bg-slate-900 px-2.5 py-1 text-xs font-semibold text-white">
              {notifications}
            </span>
          </div>
        </div>
      </div>

      <div className="mt-6 grid gap-3 lg:grid-cols-[2.1fr_1fr_1fr_1fr_1fr]">
        <div className="relative">
          <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <Input
            className="h-12 rounded-2xl border-slate-200 bg-slate-50 pl-11"
            placeholder="Search consultancy, tenant ID, country, or plan"
            value={filters.search}
            onChange={(event) =>
              onFiltersChange({
                ...filters,
                search: event.target.value,
              })
            }
          />
        </div>

        <Select
          value={filters.consultancyId}
          onValueChange={(value) =>
            onFiltersChange({
              ...filters,
              consultancyId: value,
            })
          }
        >
          <SelectTrigger className="h-12 rounded-2xl border-slate-200 bg-slate-50">
            <SelectValue placeholder="Consultancy" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All consultancies</SelectItem>
            {consultancies.map((consultancy) => (
              <SelectItem key={consultancy.id} value={consultancy.id}>
                {consultancy.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select
          value={filters.status}
          onValueChange={(value) =>
            onFiltersChange({
              ...filters,
              status: value,
            })
          }
        >
          <SelectTrigger className="h-12 rounded-2xl border-slate-200 bg-slate-50">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All statuses</SelectItem>
            <SelectItem value="active">Active</SelectItem>
            <SelectItem value="onboarding">Onboarding</SelectItem>
            <SelectItem value="trial">Trial</SelectItem>
            <SelectItem value="suspended">Suspended</SelectItem>
          </SelectContent>
        </Select>

        <Select
          value={filters.country}
          onValueChange={(value) =>
            onFiltersChange({
              ...filters,
              country: value,
            })
          }
        >
          <SelectTrigger className="h-12 rounded-2xl border-slate-200 bg-slate-50">
            <SelectValue placeholder="Country" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All countries</SelectItem>
            {countries.map((country) => (
              <SelectItem key={country} value={country}>
                {country}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select
          value={filters.dateRange}
          onValueChange={(value: OwnerFilters['dateRange']) =>
            onFiltersChange({
              ...filters,
              dateRange: value,
            })
          }
        >
          <SelectTrigger className="h-12 rounded-2xl border-slate-200 bg-slate-50">
            <div className="flex items-center gap-2">
              <CalendarRange className="h-4 w-4 text-slate-500" />
              <SelectValue placeholder="Date range" />
            </div>
          </SelectTrigger>
          <SelectContent>
            {ownerDateFilters.map((option) => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    </div>
  );
}
