// @ts-nocheck
'use client';

import { useEffect, useState } from 'react';
import AppShell from '@/components/app/app-shell';
import {
  EmptyState,
  ErrorState,
  LoadingState,
  StatusPill,
  formatDate,
} from '@/components/app/shared';
import { visaAPI } from '@/services/api';

export default function VisaPage() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [applications, setApplications] = useState([]);

  const loadApplications = async () => {
    setLoading(true);
    setError('');

    try {
      const response = await visaAPI.getAll({ page: 1, limit: 20 });
      setApplications(response.data?.data?.applications || []);
    } catch (requestError: any) {
      setError(
        requestError?.response?.data?.message ||
          requestError?.message ||
          'Failed to load visa applications.'
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadApplications();
  }, []);

  return (
    <AppShell
      title="Visa Applications"
      description="Monitor visa application progress against the deployed backend workflow and risk assessment data."
      actions={
        <button
          className="rounded-xl border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
          onClick={loadApplications}
          type="button"
        >
          Refresh
        </button>
      }
    >
      {loading ? <LoadingState label="Loading visa applications..." /> : null}
      {!loading && error ? (
        <ErrorState message={error} onRetry={loadApplications} />
      ) : null}

      {!loading && !error ? (
        <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          {applications.length === 0 ? (
            <EmptyState
              description="Visa applications created through the backend workflow will show up here."
              title="No visa applications found"
            />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[1040px] text-left">
                <thead className="border-b border-slate-200 text-xs uppercase tracking-[0.2em] text-slate-500">
                  <tr>
                    <th className="pb-3">Visa ID</th>
                    <th className="pb-3">Destination</th>
                    <th className="pb-3">Student</th>
                    <th className="pb-3">Stage</th>
                    <th className="pb-3">Risk</th>
                    <th className="pb-3">Created</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {applications.map((application) => (
                    <tr key={application._id}>
                      <td className="py-4 font-semibold text-slate-900">
                        {application.visaId}
                      </td>
                      <td className="py-4 text-sm text-slate-600">
                        {application.flagEmoji ? `${application.flagEmoji} ` : ''}
                        {application.destinationCountry}
                      </td>
                      <td className="py-4 text-sm text-slate-600">
                        {application.student?.name ||
                          `${application.lead?.firstName || ''} ${application.lead?.lastName || ''}`.trim() ||
                          'Unlinked'}
                      </td>
                      <td className="py-4">
                        <StatusPill tone={application.currentStage}>
                          {application.currentStage?.replace(/_/g, ' ')}
                        </StatusPill>
                      </td>
                      <td className="py-4">
                        {application.riskAssessment?.riskCategory ? (
                          <StatusPill tone={application.riskAssessment.riskCategory}>
                            {application.riskAssessment.riskCategory}
                          </StatusPill>
                        ) : (
                          <span className="text-sm text-slate-500">Not assessed</span>
                        )}
                      </td>
                      <td className="py-4 text-sm text-slate-600">
                        {formatDate(application.createdAt)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      ) : null}
    </AppShell>
  );
}
