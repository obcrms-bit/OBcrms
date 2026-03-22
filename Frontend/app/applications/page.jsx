'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import AppShell from '@/components/app/app-shell';
import {
  DataTableSurface,
  InlineStats,
  SectionCard,
  SectionHeader,
} from '@/components/app/design-system';
import {
  EmptyState,
  ErrorState,
  LoadingState,
  StatusPill,
} from '@/components/app/shared';
import { applicationAPI } from '@/services/api';

const DEFAULT_APPLICATION_STAGES = [
  'draft',
  'submitted',
  'offer_received',
  'visa_applied',
  'enrolled',
  'rejected',
];

const getStageOptions = (application) => {
  const workflowStages = Array.isArray(application?.countryWorkflowId?.applicationStages)
    ? application.countryWorkflowId.applicationStages
    : [];

  if (!workflowStages.length) {
    return DEFAULT_APPLICATION_STAGES.map((stage) => ({
      value: stage,
      label: stage.replace(/_/g, ' '),
    }));
  }

  return workflowStages.map((stage) => ({
    value: stage?.key || stage?.value || '',
    label: stage?.label || String(stage?.key || stage?.value || '').replace(/_/g, ' '),
  }));
};

export default function ApplicationsPage() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [applications, setApplications] = useState([]);

  const loadApplications = useCallback(async () => {
    setLoading(true);
    setError('');

    try {
      const response = await applicationAPI.list();
      setApplications(response.data?.data || []);
    } catch (requestError) {
      setError(
        requestError?.response?.data?.message ||
          requestError?.message ||
          'Failed to load applications.'
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadApplications();
  }, [loadApplications]);

  const updateStatus = async (applicationId, status) => {
    try {
      await applicationAPI.changeStage(applicationId, status);
      await loadApplications();
    } catch (requestError) {
      setError(
        requestError?.response?.data?.message ||
          requestError?.message ||
          'Failed to update application status.'
      );
    }
  };

  const applicationStats = useMemo(() => {
    const grouped = applications.reduce(
      (accumulator, application) => {
        const statusKey = application.status || 'draft';
        accumulator.total += 1;
        accumulator.byStatus[statusKey] = (accumulator.byStatus[statusKey] || 0) + 1;
        return accumulator;
      },
      { total: 0, byStatus: {} }
    );

    return [
      {
        label: 'Total Applications',
        value: grouped.total,
        helper: 'Records in the current admissions workspace',
      },
      {
        label: 'Submitted',
        value: grouped.byStatus.submitted || 0,
        helper: 'Applications already submitted to institutions',
      },
      {
        label: 'Offer Stage',
        value:
          (grouped.byStatus.offer_received || 0) +
          (grouped.byStatus.conditional_offer || 0) +
          (grouped.byStatus.final_offer || 0),
        helper: 'Conditional or final offer handling',
      },
      {
        label: 'Visa / Enrolled',
        value: (grouped.byStatus.visa_applied || 0) + (grouped.byStatus.enrolled || 0),
        helper: 'Later-stage conversion records',
      },
    ];
  }, [applications]);

  return (
    <AppShell
      title="Applications"
      description="View and progress university applications from the deployed applicant workflow."
      actions={
        <button
          className="ds-button-secondary"
          onClick={loadApplications}
          type="button"
        >
          Refresh
        </button>
      }
    >
      {loading ? <LoadingState label="Loading applications..." /> : null}
      {!loading && error ? (
        <ErrorState message={error} onRetry={loadApplications} />
      ) : null}

      {!loading && !error ? (
        <div className="space-y-6">
          <SectionCard tone="muted">
            <SectionHeader
              eyebrow="Admissions Pulse"
              title="Application workflow visibility"
              description="Track where every applicant sits, then move them through the country-specific stage model without leaving the queue."
            />
            <InlineStats className="mt-6" items={applicationStats} />
          </SectionCard>

          <DataTableSurface>
            <SectionHeader
              eyebrow="Application Queue"
              title={`${applications.length} applications loaded`}
              description="All application records shown here are coming directly from the deployed backend workflow."
            />

            {applications.length === 0 ? (
              <div className="mt-6">
                <EmptyState
                  description="Applications created from the backend workflow will appear here."
                  title="No applications found"
                />
              </div>
            ) : (
              <div className="ds-table-wrap mt-6">
                <table className="ds-table min-w-[960px]">
                  <thead>
                    <tr>
                      <th>Student</th>
                      <th>University</th>
                      <th>Course</th>
                      <th>Status</th>
                      <th>Update</th>
                    </tr>
                  </thead>
                  <tbody>
                    {applications.map((application) => (
                      <tr key={application._id}>
                        <td>
                          <div className="font-semibold text-slate-900">
                            {application.studentId?.fullName ||
                              application.studentId?.name ||
                              'Unknown student'}
                          </div>
                          <div className="text-sm text-slate-500">
                            {application.country || 'Country not set'}
                          </div>
                        </td>
                        <td className="text-sm text-slate-600">
                          {application.universityName || 'Not set'}
                        </td>
                        <td className="text-sm text-slate-600">
                          {application.courseName || 'Not set'}
                        </td>
                        <td>
                          <StatusPill tone={application.status}>
                            {String(application.status || 'draft').replace(/_/g, ' ')}
                          </StatusPill>
                        </td>
                        <td>
                          <select
                            className="ds-field min-w-[220px] py-2.5"
                            onChange={(event) =>
                              updateStatus(application._id, event.target.value)
                            }
                            value={application.status}
                          >
                            {getStageOptions(application).map((stage) => (
                              <option key={stage.value} value={stage.value}>
                                {stage.label}
                              </option>
                            ))}
                          </select>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </DataTableSurface>
        </div>
      ) : null}
    </AppShell>
  );
}
