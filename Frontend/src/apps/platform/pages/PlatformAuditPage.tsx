'use client';

import { useEffect, useState } from 'react';
import { ErrorState, LoadingState, StatusPill } from '@/components/app/shared';
import { superAdminAPI } from '@/src/services/api';

export default function PlatformAuditPage() {
  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const loadLogs = async () => {
    setLoading(true);
    setError('');
    try {
      const response = await superAdminAPI.getAuditLogs({ limit: 150 });
      setLogs(response.data?.data?.logs || []);
    } catch (requestError: any) {
      setError(
        requestError?.response?.data?.message ||
          requestError?.message ||
          'Failed to load platform audit logs.'
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadLogs();
  }, []);

  if (loading) {
    return <LoadingState label="Loading audit timeline..." />;
  }

  return (
    <div className="space-y-8">
      {error ? <ErrorState message={error} onRetry={loadLogs} /> : null}

      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.25em] text-teal-700">
          Platform Audit
        </p>
        <h1 className="mt-2 text-3xl font-semibold tracking-tight text-slate-950">
          Sensitive control-plane activity
        </h1>
        <p className="mt-2 max-w-4xl text-sm leading-6 text-slate-600">
          Review super-admin actions, impersonation events, platform-to-tenant provisioning, and
          critical configuration changes.
        </p>
      </div>

      <div className="space-y-3 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
        {logs.map((log) => (
          <article key={log._id} className="rounded-2xl border border-slate-200 p-4">
            <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
              <div>
                <p className="font-semibold text-slate-900">
                  {log.action} on {log.resource}
                </p>
                <p className="mt-1 text-sm text-slate-500">
                  {log.userName || 'System'} / {new Date(log.createdAt).toLocaleString()}
                </p>
              </div>
              <div className="flex flex-wrap gap-2">
                {log.module ? <StatusPill tone="pending">{log.module}</StatusPill> : null}
                <StatusPill tone={log.status === 'failure' ? 'overdue' : 'completed'}>
                  {log.status || 'success'}
                </StatusPill>
              </div>
            </div>
          </article>
        ))}
      </div>
    </div>
  );
}
