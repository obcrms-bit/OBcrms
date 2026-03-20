'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import AppShell from '@/components/app/app-shell';
import { ErrorState, LoadingState } from '@/components/app/shared';
import LeadForm from '@/components/leads/lead-form';
import { useAuth } from '@/context/AuthContext';
import { authAPI, branchAPI, leadAPI } from '@/services/api';

export default function LeadCreatePage() {
  const router = useRouter();
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [branches, setBranches] = useState([]);
  const [counsellors, setCounsellors] = useState([]);

  useEffect(() => {
    let active = true;

    const loadSupportData = async () => {
      setLoading(true);
      setError('');

      try {
        const [branchResult, userResult] = await Promise.allSettled([
          branchAPI.getBranches(),
          ['super_admin', 'admin', 'manager'].includes(user?.role)
            ? authAPI.getUsers('counselor')
            : Promise.resolve(null),
        ]);

        if (!active) {
          return;
        }

        setBranches(
          branchResult.status === 'fulfilled' ? branchResult.value.data?.data || [] : []
        );
        setCounsellors(
          userResult.status === 'fulfilled' ? userResult.value?.data?.data?.users || [] : []
        );

        if (
          branchResult.status === 'rejected' &&
          branchResult.reason?.response?.status !== 403
        ) {
          throw branchResult.reason;
        }
      } catch (requestError) {
        if (!active) {
          return;
        }
        setError(
          requestError?.response?.data?.message ||
            requestError?.message ||
            'Failed to load lead form data.'
        );
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    };

    if (user?.role) {
      loadSupportData();
    }

    return () => {
      active = false;
    };
  }, [user?.role]);

  const handleSubmit = async (payload) => {
    setSubmitting(true);
    setError('');

    try {
      const response = await leadAPI.createLead(payload);
      router.push(`/leads/${response.data?.data?.lead?._id}`);
    } catch (requestError) {
      const duplicateLead = requestError?.response?.data?.error?.duplicateLead;
      if (duplicateLead?._id) {
        setError(
          `${requestError?.response?.data?.message} Existing lead: ${duplicateLead.name || `${duplicateLead.firstName || ''} ${duplicateLead.lastName || ''}`.trim()}`
        );
      } else {
        setError(
          requestError?.response?.data?.message ||
            requestError?.message ||
            'Failed to create the lead.'
        );
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <AppShell
      title="Create Lead"
      description="Capture the full lead profile, qualification history, assignment, and preparation details in a production-ready lead record."
      actions={
        <button
          className="rounded-xl border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
          onClick={() => router.push('/leads')}
          type="button"
        >
          Back to leads
        </button>
      }
    >
      {loading ? <LoadingState label="Loading lead form..." /> : null}
      {!loading ? (
        <div className="space-y-6">
          {error ? <ErrorState message={error} /> : null}
          <LeadForm
            branches={branches}
            counsellors={counsellors}
            mode="create"
            onSubmit={handleSubmit}
            submitLabel="Create lead"
            submitting={submitting}
          />
        </div>
      ) : null}
    </AppShell>
  );
}
