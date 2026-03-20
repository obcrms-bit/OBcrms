// @ts-nocheck
'use client';
/* eslint-disable react-hooks/exhaustive-deps */

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Filter, RefreshCw, Search, Trash2, UserPlus } from 'lucide-react';
import AppShell from '@/components/app/app-shell';
import {
  CATEGORY_STYLES,
  EmptyState,
  ErrorState,
  LoadingState,
  StatusPill,
  formatDate,
} from '@/components/app/shared';
import { leadAPI } from '@/services/api';

const LEAD_SOURCES = [
  'website',
  'facebook',
  'instagram',
  'walk-in',
  'referral',
  'tiktok',
  'youtube',
  'event',
  'other',
];

const LEAD_STATUSES = [
  'new',
  'contacted',
  'qualified',
  'counselling_scheduled',
  'counselling_done',
  'application_started',
  'documents_pending',
  'application_submitted',
  'offer_received',
  'visa_applied',
  'enrolled',
  'lost',
];

export default function LeadsPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [leads, setLeads] = useState([]);
  const [pagination, setPagination] = useState({
    total: 0,
    page: 1,
    pages: 1,
  });
  const [filters, setFilters] = useState({
    search: '',
    status: '',
    source: '',
    category: '',
    branch: '',
    course: '',
    fromDate: '',
    toDate: '',
  });

  const loadLeads = async (page = 1) => {
    setLoading(true);
    setError('');

    try {
      const response = await leadAPI.getLeads({
        page,
        limit: 20,
        ...(filters.search ? { search: filters.search } : {}),
        ...(filters.status ? { status: filters.status } : {}),
        ...(filters.source ? { source: filters.source } : {}),
        ...(filters.category ? { category: filters.category } : {}),
        ...(filters.branch ? { branch: filters.branch } : {}),
        ...(filters.course ? { course: filters.course } : {}),
        ...(filters.fromDate ? { fromDate: filters.fromDate } : {}),
        ...(filters.toDate ? { toDate: filters.toDate } : {}),
      });

      setLeads(response.data?.data?.leads || []);
      setPagination(
        response.data?.data?.pagination || {
          total: 0,
          page: 1,
          pages: 1,
        }
      );
    } catch (requestError: any) {
      setError(
        requestError?.response?.data?.message ||
          requestError?.message ||
          'Failed to fetch leads.'
      );
    } finally {
      setLoading(false);
    }
  };

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => {
    loadLeads();
  }, []);

  const handleDelete = async (leadId) => {
    const shouldDelete = window.confirm(
      'Soft-delete this lead from the production pipeline?'
    );

    if (!shouldDelete) {
      return;
    }

    try {
      await leadAPI.deleteLead(leadId);
      await loadLeads(pagination.page);
    } catch (requestError: any) {
      setError(
        requestError?.response?.data?.message ||
          requestError?.message ||
          'Failed to delete the lead.'
      );
    }
  };

  return (
    <AppShell
      title="Lead Management"
      description="Connected to the deployed backend for search, filtering, deletion, and direct entry into the production lead pipeline."
      actions={
        <>
          <Link
            className="rounded-xl border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
            href="/leads/pipeline"
          >
            Open pipeline
          </Link>
          <Link
            className="rounded-xl bg-slate-900 px-4 py-2 text-sm font-semibold text-white transition hover:bg-slate-800"
            href="/leads/create"
          >
            Create lead
          </Link>
        </>
      }
    >
      <div className="space-y-6">
        <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="grid gap-3 lg:grid-cols-[minmax(0,1fr)_180px_180px_180px_180px_180px_160px_160px_auto_auto]">
            <div className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
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
                    loadLeads(1);
                  }
                }}
                placeholder="Search by name, email, or phone"
                value={filters.search}
              />
            </div>

            <select
              className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700 outline-none"
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
              className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700 outline-none"
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
              className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700 outline-none"
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

            <input
              className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700 outline-none"
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
              className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700 outline-none"
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
              className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700 outline-none"
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
              className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700 outline-none"
              value={filters.toDate}
              onChange={(event) =>
                setFilters((current) => ({
                  ...current,
                  toDate: event.target.value,
                }))
              }
            />

            <button
              className="inline-flex items-center justify-center gap-2 rounded-2xl border border-slate-200 px-4 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
              onClick={() => {
                setFilters({
                  search: '',
                  status: '',
                  source: '',
                  category: '',
                  branch: '',
                  course: '',
                  fromDate: '',
                  toDate: '',
                });
                setTimeout(() => loadLeads(1), 0);
              }}
              type="button"
            >
              <RefreshCw className="h-4 w-4" />
              Reset
            </button>

            <button
              className="inline-flex items-center justify-center gap-2 rounded-2xl bg-slate-900 px-4 py-3 text-sm font-semibold text-white transition hover:bg-slate-800"
              onClick={() => loadLeads(1)}
              type="button"
            >
              <Filter className="h-4 w-4" />
              Apply
            </button>
          </div>
        </section>

        {loading ? <LoadingState label="Loading lead records..." /> : null}

        {!loading && error ? <ErrorState message={error} onRetry={loadLeads} /> : null}

        {!loading && !error ? (
          <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
                  Lead Directory
                </p>
                <h3 className="mt-2 text-xl font-semibold text-slate-900">
                  {pagination.total} lead records
                </h3>
              </div>
              <p className="text-sm text-slate-500">
                Page {pagination.page} of {pagination.pages}
              </p>
            </div>

            {leads.length === 0 ? (
              <div className="mt-6">
                <EmptyState
                  actionLabel="Create lead"
                  description="No lead matched the current filters. Clear the filters or create a new one to keep the pipeline moving."
                  icon={UserPlus}
                  onAction={() => router.push('/leads/create')}
                  title="No leads found"
                />
              </div>
            ) : (
              <>
                <div className="mt-6 overflow-x-auto">
                  <table className="w-full min-w-[1120px] text-left">
                    <thead className="border-b border-slate-200 text-xs uppercase tracking-[0.2em] text-slate-500">
                      <tr>
                        <th className="pb-3">Lead</th>
                        <th className="pb-3">Source</th>
                        <th className="pb-3">Branch</th>
                        <th className="pb-3">Course</th>
                        <th className="pb-3">Stage</th>
                        <th className="pb-3">Score</th>
                        <th className="pb-3">Counsellor</th>
                        <th className="pb-3">Next Follow-up</th>
                        <th className="pb-3 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {leads.map((lead) => (
                        <tr className="align-top" key={lead._id}>
                          <td className="py-4">
                            <button
                              className="text-left"
                              onClick={() => router.push(`/leads/${lead._id}`)}
                              type="button"
                            >
                              <div className="font-semibold text-slate-900">
                                {lead.firstName} {lead.lastName}
                              </div>
                              <div className="text-sm text-slate-500">{lead.email}</div>
                              <div className="text-sm text-slate-500">{lead.phone}</div>
                            </button>
                          </td>
                          <td className="py-4 text-sm text-slate-600">
                            {lead.source || 'Unknown'}
                          </td>
                          <td className="py-4 text-sm text-slate-600">
                            {lead.branchName || lead.branchId?.name || 'Not set'}
                          </td>
                          <td className="py-4 text-sm text-slate-600">
                            {lead.interestedCourse || 'Not set'}
                          </td>
                          <td className="py-4">
                            <StatusPill tone={lead.status}>
                              {lead.status?.replace(/_/g, ' ')}
                            </StatusPill>
                          </td>
                          <td className="py-4">
                            <div className="flex items-center gap-2">
                              <span className="font-semibold text-slate-900">
                                {lead.leadScore || 0}
                              </span>
                              <span
                                className={`inline-flex rounded-full px-2 py-1 text-xs font-semibold ${
                                  CATEGORY_STYLES[lead.leadCategory] ||
                                  'bg-slate-100 text-slate-700'
                                }`}
                              >
                                {lead.leadCategory || 'cold'}
                              </span>
                            </div>
                          </td>
                          <td className="py-4 text-sm text-slate-600">
                            {lead.assignedCounsellor?.name || 'Unassigned'}
                          </td>
                          <td className="py-4 text-sm text-slate-600">
                            {lead.nextFollowUp ? formatDate(lead.nextFollowUp) : 'Not scheduled'}
                          </td>
                          <td className="py-4">
                            <div className="flex justify-end gap-2">
                              <button
                                className="rounded-xl border border-slate-200 px-3 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
                                onClick={() => router.push(`/leads/${lead._id}`)}
                                type="button"
                              >
                                View
                              </button>
                              <button
                                className="rounded-xl border border-slate-200 px-3 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
                                onClick={() => router.push(`/leads/${lead._id}/edit`)}
                                type="button"
                              >
                                Edit
                              </button>
                              <button
                                className="rounded-xl border border-rose-200 px-3 py-2 text-sm font-semibold text-rose-600 transition hover:bg-rose-50"
                                onClick={() => handleDelete(lead._id)}
                                type="button"
                              >
                                <Trash2 className="h-4 w-4" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                <div className="mt-6 flex items-center justify-between gap-4 border-t border-slate-200 pt-5">
                  <p className="text-sm text-slate-500">
                    Showing {leads.length} results on this page
                  </p>
                  <div className="flex items-center gap-2">
                    <button
                      className="rounded-xl border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
                      disabled={pagination.page <= 1}
                      onClick={() => loadLeads(pagination.page - 1)}
                      type="button"
                    >
                      Previous
                    </button>
                    <button
                      className="rounded-xl border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
                      disabled={pagination.page >= pagination.pages}
                      onClick={() => loadLeads(pagination.page + 1)}
                      type="button"
                    >
                      Next
                    </button>
                  </div>
                </div>
              </>
            )}
          </section>
        ) : null}
      </div>
    </AppShell>
  );
}
