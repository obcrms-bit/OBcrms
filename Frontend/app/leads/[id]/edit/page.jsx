'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import AppShell from '@/components/app/app-shell';
import { ErrorState, LoadingState } from '@/components/app/shared';
import LeadForm from '@/components/leads/lead-form';
import { useAuth } from '@/context/AuthContext';
import { authAPI, branchAPI, leadAPI } from '@/services/api';

export default function EditLeadPage() {
  const params = useParams();
  const router = useRouter();
  const { user } = useAuth();
  const leadId = params?.id;

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [lead, setLead] = useState(null);
  const [branches, setBranches] = useState([]);
  const [counsellors, setCounsellors] = useState([]);

  useEffect(() => {
    let active = true;

    const loadPage = async () => {
      setLoading(true);
      setError('');

      try {
        const [leadResult, branchResult, userResult] = await Promise.allSettled([
          leadAPI.getLeadById(leadId),
          branchAPI.getBranches(),
          ['super_admin', 'admin', 'manager'].includes(user?.role)
            ? authAPI.getUsers('counselor')
            : Promise.resolve(null),
        ]);

        if (!active) {
          return;
        }

        if (leadResult.status === 'rejected') {
          throw leadResult.reason;
        }

        setLead(leadResult.value.data?.data?.lead || null);
        setBranches(
          branchResult.status === 'fulfilled' ? branchResult.value.data?.data || [] : []
        );
        setCounsellors(
          userResult.status === 'fulfilled' ? userResult.value?.data?.data?.users || [] : []
        );
      } catch (requestError) {
        if (!active) {
          return;
        }
        setError(
          requestError?.response?.data?.message ||
            requestError?.message ||
            'Failed to load the lead for editing.'
        );
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    };

    if (leadId && user?.role) {
      loadPage();
    }

    return () => {
      active = false;
    };
  }, [leadId, user?.role]);

  const handleSubmit = async (payload, form) => {
    setSubmitting(true);
    setError('');

    try {
      await leadAPI.updateLead(leadId, payload);
      if (form?.initialNote?.trim()) {
        await leadAPI.addNote(leadId, form.initialNote.trim());
      }
      router.push(`/leads/${leadId}`);
    } catch (requestError) {
      setError(
        requestError?.response?.data?.message ||
          requestError?.message ||
          'Failed to update the lead.'
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <AppShell
      title={lead ? `Edit ${lead.fullName || lead.name}` : 'Edit Lead'}
      description="Update the full lead profile without losing the existing activity trail, assignment history, or qualification records."
      actions={
        <button
          className="rounded-xl border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
          onClick={() => router.push(leadId ? `/leads/${leadId}` : '/leads')}
          type="button"
        >
          Back
        </button>
      }
    >
      {loading ? <LoadingState label="Loading lead editor..." /> : null}
      {!loading ? (
        <div className="space-y-6">
          {error ? <ErrorState message={error} /> : null}
          {lead ? (
            <LeadForm
              branches={branches}
              counsellors={counsellors}
              initialValue={lead}
              mode="edit"
              onSubmit={handleSubmit}
              submitLabel="Save changes"
              submitting={submitting}
            />
          ) : null}
        </div>
      ) : null}
    </AppShell>
  );
}
