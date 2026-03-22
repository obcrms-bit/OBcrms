'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import AppShell from '@/components/app/app-shell';
import {
  InlineStats,
  PageHero,
  SectionCard,
  SectionHeader,
} from '@/components/app/design-system';
import { ErrorState, LoadingState } from '@/components/app/shared';
import LeadForm from '@/components/leads/lead-form';
import { useAuth } from '@/context/AuthContext';
import { authAPI, branchAPI, leadAPI } from '@/services/api';
import { hasPermission } from '@/src/services/access';

export default function LeadCreatePage() {
  const router = useRouter();
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [branches, setBranches] = useState([]);
  const [counsellors, setCounsellors] = useState([]);
  const [countryWorkflows, setCountryWorkflows] = useState([]);

  useEffect(() => {
    let active = true;

    const loadSupportData = async () => {
      if (!(user?.id || user?._id)) {
        return;
      }

      setLoading(true);
      setError('');

      try {
        const [branchResult, userResult, workflowResult] = await Promise.allSettled([
          branchAPI.getBranches(),
          hasPermission(user, 'leads', 'assign') ? authAPI.getUsers() : Promise.resolve(null),
          leadAPI.getWorkflows(),
        ]);

        if (!active) {
          return;
        }

        setBranches(branchResult.status === 'fulfilled' ? branchResult.value.data?.data || [] : []);
        setCounsellors(
          userResult.status === 'fulfilled' ? userResult.value?.data?.data?.users || [] : []
        );
        setCountryWorkflows(
          workflowResult.status === 'fulfilled'
            ? workflowResult.value?.data?.data?.workflows || []
            : []
        );

        if (branchResult.status === 'rejected' && branchResult.reason?.response?.status !== 403) {
          throw branchResult.reason;
        }
      } catch (requestError) {
        if (active) {
          setError(
            requestError?.response?.data?.message ||
              requestError?.message ||
              'Failed to load lead form data.'
          );
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    };

    loadSupportData();

    return () => {
      active = false;
    };
  }, [user]);

  const handleSubmit = async (payload) => {
    setSubmitting(true);
    setError('');

    try {
      const response = await leadAPI.createLead(payload);
      router.push(`/tenant/leads/${response.data?.data?.lead?._id}`);
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

  const heroStats = useMemo(
    () => [
      { label: 'Branches', value: branches.length, helper: 'Available routing targets' },
      { label: 'Counsellors', value: counsellors.length, helper: 'Assignable follow-up owners' },
      {
        label: 'Country Workflows',
        value: countryWorkflows.length,
        helper: 'Workflow rules currently available',
      },
      { label: 'Required Sections', value: 6, helper: 'Personal to qualification intake' },
    ],
    [branches.length, counsellors.length, countryWorkflows.length]
  );

  return (
    <AppShell
      title="Create Lead"
      description="Capture the full lead profile, qualification history, assignment, and preparation details in a production-safe intake flow."
      actions={
        <button
          className="ds-button-secondary"
          onClick={() => router.push('/tenant/leads')}
          type="button"
        >
          Back to leads
        </button>
      }
    >
      {loading ? <LoadingState label="Loading lead form..." /> : null}
      {!loading ? (
        <div className="ds-page-stack">
          <PageHero
            eyebrow="Lead Intake"
            title="Create a complete CRM lead profile"
            description="This wrapper modernizes the experience while preserving the current payload, validation rules, duplicate checks, and repeatable education rows."
            aside={<InlineStats columns={2} items={heroStats} />}
          />

          {error ? <ErrorState message={error} /> : null}

          <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_320px]">
            <div className="min-w-0">
              <LeadForm
                branches={branches}
                counsellors={counsellors}
                countryWorkflows={countryWorkflows}
                mode="create"
                onSubmit={handleSubmit}
                onCancel={() => router.push('/tenant/leads')}
                cancelLabel="Cancel"
                submitLabel="Create lead"
                submitting={submitting}
              />
            </div>

            <div className="space-y-6">
              <SectionCard>
                <SectionHeader
                  eyebrow="Validation"
                  title="What stays enforced"
                  description="The refactor keeps the existing backend contract and required-field logic intact."
                />
                <ul className="mt-5 space-y-3 text-sm text-slate-600">
                  <li>Name, mobile, interested for, course level, branch, and stream remain required.</li>
                  <li>Duplicate detection still uses phone and email on the backend.</li>
                  <li>Qualification rows remain repeatable and preserve row order in submission.</li>
                </ul>
              </SectionCard>

              <SectionCard tone="accent">
                <SectionHeader
                  eyebrow="Assignment Inputs"
                  title="Routing data loaded live"
                  description="Branches, counsellors, and country workflows are loaded from the existing APIs."
                />
                <div className="mt-5 space-y-3 text-sm text-slate-600">
                  <p>{branches.length || 0} branches available for ownership and reporting.</p>
                  <p>{counsellors.length || 0} staff records available for assignment.</p>
                  <p>{countryWorkflows.length || 0} workflow definitions available for country-driven routing.</p>
                </div>
              </SectionCard>
            </div>
          </div>
        </div>
      ) : null}
    </AppShell>
  );
}
