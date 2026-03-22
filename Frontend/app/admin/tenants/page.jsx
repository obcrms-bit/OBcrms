'use client';

import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { Building2, CheckSquare, Grid3X3, LayoutList, PauseCircle, PlayCircle } from 'lucide-react';
import {
  ErrorState,
  LoadingState,
  StatusPill,
} from '@/components/app/shared';
import { useAuth } from '@/context/AuthContext';
import { superAdminAPI } from '@/src/services/api';
import { useTenantStore } from '@/src/stores/AppDataStore';

const inputClassName =
  'w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-teal-500 focus:bg-white';

export default function SuperAdminTenantsPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { login } = useAuth();
  const initialFilters = useMemo(
    () => ({
      search: searchParams.get('search') || '',
      status: 'all',
      plan: 'all',
      billing: 'all',
      country: '',
    }),
    [searchParams]
  );
  const [filters, setFilters] = useState(initialFilters);
  const [viewMode, setViewMode] = useState('grid');
  const [selectedIds, setSelectedIds] = useState([]);
  const [busyId, setBusyId] = useState('');
  const [bulkBusy, setBulkBusy] = useState(false);
  const [actionError, setActionError] = useState('');
  const {
    tenants,
    loadingTenants,
    error: storeError,
    loadTenants: loadTenantsStore,
  } = useTenantStore();

  const loadTenants = useCallback(async (nextFilters) => {
    setActionError('');
    await loadTenantsStore(nextFilters);
  }, [loadTenantsStore]);

  useEffect(() => {
    loadTenants(initialFilters).catch(() => {});
  }, [initialFilters, loadTenants]);

  const error = actionError || storeError;

  const countryOptions = useMemo(
    () =>
      Array.from(
        new Set(tenants.flatMap((tenant) => tenant.countries || []).filter(Boolean))
      ).sort(),
    [tenants]
  );

  const selectedSet = useMemo(() => new Set(selectedIds), [selectedIds]);

  const handleFilterChange = (field, value) => {
    setFilters((current) => ({
      ...current,
      [field]: value,
    }));
  };

  const applyFilters = async (event) => {
    event.preventDefault();
    setSelectedIds([]);
    router.replace(
      filters.search
        ? `/platform/tenants?search=${encodeURIComponent(filters.search)}`
        : '/platform/tenants'
    );
    await loadTenants(filters);
  };

  const handleImpersonate = async (tenantId) => {
    setBusyId(tenantId);
    setActionError('');
    try {
      const response = await superAdminAPI.impersonateTenant(tenantId);
      await login(response.data?.data);
      router.push('/tenant/dashboard');
    } catch (requestError) {
      setActionError(
        requestError?.response?.data?.message ||
          requestError?.message ||
          'Failed to impersonate tenant.'
      );
    } finally {
      setBusyId('');
    }
  };

  const updateStatus = async (tenantId, status) => {
    setBusyId(tenantId);
    setActionError('');
    try {
      await superAdminAPI.updateTenantStatus(tenantId, { status });
      await loadTenants(filters);
    } catch (requestError) {
      setActionError(
        requestError?.response?.data?.message ||
          requestError?.message ||
          'Failed to update tenant status.'
      );
    } finally {
      setBusyId('');
    }
  };

  const handleBulkStatus = async (status) => {
    if (!selectedIds.length) {
      return;
    }

    setBulkBusy(true);
    setActionError('');
    try {
      await Promise.all(selectedIds.map((tenantId) => superAdminAPI.updateTenantStatus(tenantId, { status })));
      setSelectedIds([]);
      await loadTenants(filters);
    } catch (requestError) {
      setActionError(
        requestError?.response?.data?.message ||
          requestError?.message ||
          'Failed to apply bulk tenant update.'
      );
    } finally {
      setBulkBusy(false);
    }
  };

  const toggleSelected = (tenantId) => {
    setSelectedIds((current) =>
      current.includes(tenantId)
        ? current.filter((value) => value !== tenantId)
        : [...current, tenantId]
    );
  };

  if (loadingTenants) {
    return <LoadingState label="Loading tenants..." />;
  }

  return (
    <div className="space-y-8">
      {error ? <ErrorState message={error} onRetry={() => loadTenants(filters)} /> : null}

      <div className="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.25em] text-teal-700">
            Tenant List
          </p>
          <h1 className="mt-2 text-3xl font-semibold tracking-tight text-slate-950">
            Commercial tenant management
          </h1>
          <p className="mt-2 max-w-4xl text-sm leading-6 text-slate-600">
            Filter by subscription, billing, geography, and operating health, then take owner
            actions like impersonation, suspension, and plan review.
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => setViewMode('grid')}
            className={`inline-flex items-center gap-2 rounded-xl px-4 py-3 text-sm font-semibold transition ${
              viewMode === 'grid'
                ? 'bg-slate-900 text-white'
                : 'border border-slate-200 bg-white text-slate-700 hover:bg-slate-100'
            }`}
          >
            <Grid3X3 className="h-4 w-4" />
            Grid
          </button>
          <button
            type="button"
            onClick={() => setViewMode('table')}
            className={`inline-flex items-center gap-2 rounded-xl px-4 py-3 text-sm font-semibold transition ${
              viewMode === 'table'
                ? 'bg-slate-900 text-white'
                : 'border border-slate-200 bg-white text-slate-700 hover:bg-slate-100'
            }`}
          >
            <LayoutList className="h-4 w-4" />
            Table
          </button>
        </div>
      </div>

      <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
        <form className="grid gap-4 xl:grid-cols-[2fr_1fr_1fr_1fr_1fr_auto]" onSubmit={applyFilters}>
          <input
            className={inputClassName}
            placeholder="Search by tenant name, email, or company ID"
            value={filters.search}
            onChange={(event) => handleFilterChange('search', event.target.value)}
          />
          <select
            className={inputClassName}
            value={filters.status}
            onChange={(event) => handleFilterChange('status', event.target.value)}
          >
            <option value="all">All statuses</option>
            <option value="active">Active</option>
            <option value="trial">Trial</option>
            <option value="suspended">Suspended</option>
            <option value="past_due">Past due</option>
          </select>
          <select
            className={inputClassName}
            value={filters.plan}
            onChange={(event) => handleFilterChange('plan', event.target.value)}
          >
            <option value="all">All plans</option>
            <option value="starter">Starter</option>
            <option value="growth">Growth</option>
            <option value="enterprise">Enterprise</option>
          </select>
          <select
            className={inputClassName}
            value={filters.billing}
            onChange={(event) => handleFilterChange('billing', event.target.value)}
          >
            <option value="all">All billing states</option>
            <option value="trial">Trial</option>
            <option value="active">Active</option>
            <option value="past_due">Past Due</option>
            <option value="inactive">Inactive</option>
            <option value="cancelled">Cancelled</option>
          </select>
          <select
            className={inputClassName}
            value={filters.country}
            onChange={(event) => handleFilterChange('country', event.target.value)}
          >
            <option value="">All countries</option>
            {countryOptions.map((country) => (
              <option key={country} value={country}>
                {country}
              </option>
            ))}
          </select>
          <button
            type="submit"
            className="rounded-2xl bg-slate-900 px-4 py-3 text-sm font-semibold text-white transition hover:bg-slate-800"
          >
            Apply
          </button>
        </form>

        <div className="mt-5 flex flex-wrap items-center gap-3 rounded-2xl bg-slate-50 px-4 py-3 text-sm text-slate-600">
          <div className="inline-flex items-center gap-2 font-semibold text-slate-900">
            <CheckSquare className="h-4 w-4" />
            {selectedIds.length} selected
          </div>
          <button
            type="button"
            onClick={() => handleBulkStatus('suspended')}
            disabled={!selectedIds.length || bulkBusy}
            className="inline-flex items-center gap-2 rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 font-semibold text-amber-700 transition hover:bg-amber-100 disabled:opacity-50"
          >
            <PauseCircle className="h-4 w-4" />
            Suspend selected
          </button>
          <button
            type="button"
            onClick={() => handleBulkStatus('active')}
            disabled={!selectedIds.length || bulkBusy}
            className="inline-flex items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2 font-semibold text-emerald-700 transition hover:bg-emerald-100 disabled:opacity-50"
          >
            <PlayCircle className="h-4 w-4" />
            Activate selected
          </button>
        </div>
      </section>

      {viewMode === 'grid' ? (
        <section className="grid gap-4 xl:grid-cols-2 2xl:grid-cols-3">
          {tenants.map((tenant) => (
            <article key={tenant.id} className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
              <div className="flex items-start justify-between gap-4">
                <label className="flex items-center gap-3">
                  <input
                    type="checkbox"
                    checked={selectedSet.has(tenant.id)}
                    onChange={() => toggleSelected(tenant.id)}
                  />
                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-900 text-white">
                    <Building2 className="h-5 w-5" />
                  </div>
                </label>
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
              <div className="mt-4">
                <p className="font-semibold text-slate-900">{tenant.name}</p>
                <p className="mt-1 text-sm text-slate-500">
                  {tenant.plan} / {tenant.billingStatus}
                </p>
              </div>
              <div className="mt-4 grid gap-3 sm:grid-cols-2">
                <div className="rounded-2xl bg-slate-50 p-4">
                  <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
                    Users
                  </p>
                  <p className="mt-2 text-2xl font-semibold text-slate-900">{tenant.usersCount}</p>
                </div>
                <div className="rounded-2xl bg-slate-50 p-4">
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
              <div className="mt-5 flex flex-wrap gap-2">
                <Link
                  href={`/platform/tenants/${tenant.id}`}
                  className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-100"
                >
                  View
                </Link>
                <button
                  type="button"
                  onClick={() => handleImpersonate(tenant.id)}
                  disabled={busyId === tenant.id}
                  className="rounded-xl bg-slate-900 px-4 py-2 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:opacity-60"
                >
                  {busyId === tenant.id ? 'Opening...' : 'Impersonate'}
                </button>
                <button
                  type="button"
                  onClick={() =>
                    updateStatus(tenant.id, tenant.status === 'suspended' ? 'active' : 'suspended')
                  }
                  disabled={busyId === tenant.id}
                  className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-100 disabled:opacity-60"
                >
                  {tenant.status === 'suspended' ? 'Activate' : 'Suspend'}
                </button>
              </div>
            </article>
          ))}
        </section>
      ) : (
        <section className="overflow-x-auto rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <table className="w-full min-w-[980px] text-left">
            <thead className="border-b border-slate-200 text-xs uppercase tracking-[0.2em] text-slate-500">
              <tr>
                <th className="pb-3">Select</th>
                <th className="pb-3">Tenant</th>
                <th className="pb-3">Plan</th>
                <th className="pb-3">Billing</th>
                <th className="pb-3">Users</th>
                <th className="pb-3">Branches</th>
                <th className="pb-3">Health</th>
                <th className="pb-3">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {tenants.map((tenant) => (
                <tr key={tenant.id}>
                  <td className="py-4">
                    <input
                      type="checkbox"
                      checked={selectedSet.has(tenant.id)}
                      onChange={() => toggleSelected(tenant.id)}
                    />
                  </td>
                  <td className="py-4">
                    <p className="font-semibold text-slate-900">{tenant.name}</p>
                    <p className="text-sm text-slate-500">{(tenant.countries || []).join(', ')}</p>
                  </td>
                  <td className="py-4 text-sm text-slate-600">{tenant.plan}</td>
                  <td className="py-4">
                    <StatusPill tone={tenant.billingStatus === 'active' ? 'completed' : 'pending'}>
                      {tenant.billingStatus}
                    </StatusPill>
                  </td>
                  <td className="py-4 text-sm text-slate-600">{tenant.usersCount}</td>
                  <td className="py-4 text-sm text-slate-600">{tenant.branchCount}</td>
                  <td className="py-4 text-sm text-slate-600">{tenant.healthScore}/100</td>
                  <td className="py-4">
                    <div className="flex flex-wrap gap-2">
                      <Link
                        href={`/platform/tenants/${tenant.id}`}
                        className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-100"
                      >
                        View
                      </Link>
                      <button
                        type="button"
                        onClick={() => handleImpersonate(tenant.id)}
                        disabled={busyId === tenant.id}
                        className="rounded-xl bg-slate-900 px-3 py-2 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:opacity-60"
                      >
                        {busyId === tenant.id ? 'Opening...' : 'Impersonate'}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>
      )}
    </div>
  );
}
