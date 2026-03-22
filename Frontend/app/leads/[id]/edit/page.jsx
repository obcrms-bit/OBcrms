'use client';

import { useEffect, useMemo, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import AppShell from '@/components/app/app-shell';
import {
  InlineStats,
  PageHero,
  SectionCard,
  SectionHeader,
} from '@/components/app/design-system';
import { ErrorState, LoadingState, StatusPill } from '@/components/app/shared';
import LeadForm from '@/components/leads/lead-form';
import { useAuth } from '@/context/AuthContext';
import { authAPI, branchAPI, leadAPI } from '@/services/api';
import { hasPermission } from '@/src/services/access';

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
  const [countryWorkflows, setCountryWorkflows] = useState([]);

  useEffect(() => {
    let active = true;

    const loadPage = async () => {
      if (!leadId || !(user?.id || user?._id)) {
        return;
      }

      setLoading(true);
      setError('');

      try {
        const [leadResult, branchResult, userResult, workflowResult] = await Promise.allSettled([
          leadAPI.getLeadById(leadId),
          branchAPI.getBranches(),
          hasPermission(user, 'leads', 'assign') ? authAPI.getUsers() : Promise.resolve(null),
          leadAPI.getWorkflows(),
        ]);

        if (!active) {
          return;
        }

        if (leadResult.status === 'rejected') {
          throw leadResult.reason;
        }

        setLead(leadResult.value.data?.data?.lead || null);
        setBranches(branchResult.status === 'fulfilled' ? branchResult.value.data?.data || [] : []);
        setCounsellors(
          userResult.status === 'fulfilled' ? userResult.value?.data?.data?.users || [] : []
        );
        setCountryWorkflows(
          workflowResult.status === 'fulfilled'
            ? workflowResult.value?.data?.data?.workflows || []
            : []
        );
      } catch (requestError) {
        if (active) {
          setError(
            requestError?.response?.data?.message ||
              requestError?.message ||
              'Failed to load the lead for editing.'
          );
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    };

    loadPage();

    return () => {
      active = false;
    };
  }, [leadId, user]);

  const handleSubmit = async (payload, form) => {
    setSubmitting(true);
    setError('');

    try {
      await leadAPI.updateLead(leadId, payload);
      if (form?.initialNote?.trim()) {
        await leadAPI.addNote(leadId, form.initialNote.trim());
      }
      router.push(`/tenant/leads/${leadId}`);
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

  const heroStats = useMemo(
    () => [
      { label: 'Service Type', value: lead?.serviceType || 'consultancy', helper: 'Current record type' },
      { label: 'Preferred Countries', value: lead?.preferredCountries?.length || 0, helper: 'Country routing tags' },
      { label: 'Qualifications', value: lead?.qualifications?.length || 0, helper: 'Education rows on record' },
      { label: 'Notes', value: lead?.notes?.length || 0, helper: 'Historical notes preserved' },
    ],
    [lead]
  );

  return (
    <AppShell
      title={lead ? `Edit ${lead.fullName || lead.name}` : 'Edit Lead'}
      description="Update the full lead profile without losing the existing activity trail, assignment history, or qualification records."
      actions={
        <button
          className="ds-button-secondary"
          onClick={() =>
            router.push(leadId ? `/tenant/leads/${leadId}` : '/tenant/leads')
          }
          type="button"
        >
          Back
        </button>
      }
    >
      {loading ? <LoadingState label="Loading lead editor..." /> : null}
      {!loading ? (
        <div className="ds-page-stack">
          {lead ? (
            <PageHero
              eyebrow="Lead Editor"
              title={`Preserve and update ${lead.fullName || lead.name}`}
              description="This edit screen keeps the same lead mapping and note submission flow, while improving readability and review context for admins and counsellors."
              aside={<InlineStats columns={2} items={heroStats} />}
            >
              <div className="flex flex-wrap gap-2">
                <StatusPill tone={lead.pipelineStage || lead.status}>
                  {String(lead.pipelineStage || lead.status || 'active').replace(/_/g, ' ')}
                </StatusPill>
                {lead.branchName ? <StatusPill tone="pending">{lead.branchName}</StatusPill> : null}
              </div>
            </PageHero>
          ) : null}

          {error ? <ErrorState message={error} /> : null}

          <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_320px]">
            <div className="min-w-0">
              {lead ? (
                <LeadForm
                  branches={branches}
                  counsellors={counsellors}
                  countryWorkflows={countryWorkflows}
                  initialValue={lead}
                  mode="edit"
                  onSubmit={handleSubmit}
                  onCancel={() =>
                    router.push(
                      leadId ? `/tenant/leads/${leadId}` : '/tenant/leads'
                    )
                  }
                  cancelLabel="Cancel"
                  submitLabel="Save changes"
                  submitting={submitting}
                />
              ) : null}
            </div>

            <div className="space-y-6">
              <SectionCard>
                <SectionHeader
                  eyebrow="Current Ownership"
                  title="Assignment snapshot"
                  description="These values come from the existing lead record and remain bound to the same backend fields."
                />
                <div className="mt-5 space-y-3 text-sm text-slate-600">
                  <p>Branch: {lead?.branchName || lead?.branchId?.name || 'Unassigned'}</p>
                  <p>Assignee: {lead?.assignedCounsellor?.name || 'Unassigned'}</p>
                  <p>Source: {lead?.source || 'Not set'}</p>
                </div>
              </SectionCard>

              <SectionCard tone="accent">
                <SectionHeader
                  eyebrow="Support Data"
                  title="Live dependencies"
                  description="All dropdown sources still come from the same APIs used before the refactor."
                />
                <div className="mt-5 space-y-3 text-sm text-slate-600">
                  <p>{branches.length || 0} branch options loaded.</p>
                  <p>{counsellors.length || 0} staff options loaded.</p>
                  <p>{countryWorkflows.length || 0} workflow definitions loaded.</p>
                </div>
              </SectionCard>
            </div>
          </div>
        </div>
      ) : null}
    </AppShell>
  );
}
