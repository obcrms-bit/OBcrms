'use client';

import { useEffect, useState } from 'react';
import AppShell from '@/components/app/app-shell';
import {
  EmptyState,
  ErrorState,
  LoadingState,
  StatusPill,
} from '@/components/app/shared';
import { applicantAPI } from '@/services/api';

export default function ApplicationsPage() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [applications, setApplications] = useState([]);

  const loadApplications = async () => {
    setLoading(true);
    setError('');

    try {
      const response = await applicantAPI.getApplications();
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
  };

  useEffect(() => {
    loadApplications();
  }, []);

  const updateStatus = async (applicationId, status) => {
    try {
      await applicantAPI.updateStatus(applicationId, status);
      await loadApplications();
    } catch (requestError) {
      setError(
        requestError?.response?.data?.message ||
          requestError?.message ||
          'Failed to update application status.'
      );
    }
  };

  return (
    <AppShell
      title="Applications"
      description="View and progress university applications from the deployed applicant workflow."
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
      {loading ? <LoadingState label="Loading applications..." /> : null}
      {!loading && error ? (
        <ErrorState message={error} onRetry={loadApplications} />
      ) : null}

      {!loading && !error ? (
        <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          {applications.length === 0 ? (
            <EmptyState
              description="Applications created from the backend workflow will appear here."
              title="No applications found"
            />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[960px] text-left">
                <thead className="border-b border-slate-200 text-xs uppercase tracking-[0.2em] text-slate-500">
                  <tr>
                    <th className="pb-3">Student</th>
                    <th className="pb-3">University</th>
                    <th className="pb-3">Course</th>
                    <th className="pb-3">Status</th>
                    <th className="pb-3">Update</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {applications.map((application) => (
                    <tr key={application._id}>
                      <td className="py-4">
                        <div className="font-semibold text-slate-900">
                          {application.studentId?.fullName || 'Unknown student'}
                        </div>
                        <div className="text-sm text-slate-500">
                          {application.country || 'Country not set'}
                        </div>
                      </td>
                      <td className="py-4 text-sm text-slate-600">
                        {application.universityName || 'Not set'}
                      </td>
                      <td className="py-4 text-sm text-slate-600">
                        {application.courseName || 'Not set'}
                      </td>
                      <td className="py-4">
                        <StatusPill tone={application.status}>
                          {application.status}
                        </StatusPill>
                      </td>
                      <td className="py-4">
                        <select
                          className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-700 outline-none"
                          onChange={(event) =>
                            updateStatus(application._id, event.target.value)
                          }
                          value={application.status}
                        >
                          {['draft', 'submitted', 'offer-received', 'visa-applied', 'enrolled', 'rejected'].map((status) => (
                            <option key={status} value={status}>
                              {status}
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
        </section>
      ) : null}
    </AppShell>
  );
}
