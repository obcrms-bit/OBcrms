// @ts-nocheck
'use client';
/* eslint-disable react-hooks/exhaustive-deps */

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import AppShell from '@/components/app/app-shell';
import { ErrorState, LoadingState } from '@/components/app/shared';
import { leadAPI } from '@/services/api';
import { useLeadStore } from '@/src/stores/AppDataStore';
import {
  getSelectedBranchId,
  WORKSPACE_BRANCH_EVENT,
} from '@/src/services/workspace';
import LeadFilters from '../components/LeadFilters';
import LeadsTable from '../components/LeadsTable';
import { buildLeadFilters } from '../constants/lead-filter-options';

const buildInitialFilters = () => buildLeadFilters('');

export default function LeadsPage() {
  const router = useRouter();
  const [actionError, setActionError] = useState('');
  const [filters, setFilters] = useState(buildInitialFilters);
  const {
    list: leads,
    pagination,
    loadingLeads,
    error: storeError,
    loadLeads: loadLeadsStore,
  } = useLeadStore();

  const loadLeads = async (page = 1, overrideFilters = null) => {
    const effectiveFilters = overrideFilters || filters;

    try {
      setActionError('');
      await loadLeadsStore({
        page,
        limit: 20,
        ...(effectiveFilters.search ? { search: effectiveFilters.search } : {}),
        ...(effectiveFilters.status ? { status: effectiveFilters.status } : {}),
        ...(effectiveFilters.source ? { source: effectiveFilters.source } : {}),
        ...(effectiveFilters.category ? { category: effectiveFilters.category } : {}),
        ...(effectiveFilters.viewScope ? { viewScope: effectiveFilters.viewScope } : {}),
        ...(effectiveFilters.transferredOnly ? { transferredOnly: true } : {}),
        ...(effectiveFilters.branch ? { branch: effectiveFilters.branch } : {}),
        ...(effectiveFilters.course ? { course: effectiveFilters.course } : {}),
        ...(effectiveFilters.fromDate ? { fromDate: effectiveFilters.fromDate } : {}),
        ...(effectiveFilters.toDate ? { toDate: effectiveFilters.toDate } : {}),
      });
    } catch (requestError) {
      setActionError(
        requestError?.response?.data?.message ||
          requestError?.message ||
          'Failed to fetch leads.'
      );
    }
  };

  const error = actionError || storeError;

  useEffect(() => {
    const initialSearch =
      typeof window !== 'undefined'
        ? new URLSearchParams(window.location.search).get('search') || ''
        : '';
    const nextFilters = {
      ...buildLeadFilters(getSelectedBranchId() || ''),
      search: initialSearch,
    };

    setFilters(nextFilters);
    loadLeads(1, nextFilters);

    const handleBranchChange = (event) => {
      const branchId = event?.detail?.branchId || '';
      setFilters((current) => {
        const updatedFilters = {
          ...current,
          branch: branchId,
        };
        loadLeads(1, updatedFilters);
        return updatedFilters;
      });
    };

    window.addEventListener(WORKSPACE_BRANCH_EVENT, handleBranchChange);
    return () => {
      window.removeEventListener(WORKSPACE_BRANCH_EVENT, handleBranchChange);
    };
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
    } catch (requestError) {
      setActionError(
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
          <Link className="ds-button-secondary" href="/tenant/leads/pipeline">
            Open pipeline
          </Link>
          <Link className="ds-button-primary" href="/tenant/leads/create">
            Create lead
          </Link>
        </>
      }
    >
      <div className="space-y-6">
        <LeadFilters
          filters={filters}
          setFilters={setFilters}
          onApply={loadLeads}
          onReset={(nextFilters) => {
            setFilters(nextFilters);
            loadLeads(1, nextFilters);
          }}
        />

        {loadingLeads ? <LoadingState label="Loading lead records..." /> : null}

        {!loadingLeads && error ? <ErrorState message={error} onRetry={loadLeads} /> : null}

        {!loadingLeads && !error ? (
          <LeadsTable
            leads={leads}
            pagination={pagination}
            router={router}
            onDelete={handleDelete}
            onPageChange={loadLeads}
          />
        ) : null}
      </div>
    </AppShell>
  );
}
