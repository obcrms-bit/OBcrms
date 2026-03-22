'use client';

import { useEffect, useState } from 'react';
import AppShell from '@/components/app/app-shell';
import { ErrorState, LoadingState, StatusPill } from '@/components/app/shared';
import { branchAPI } from '@/src/services/api';

export default function TenantBranchesPage() {
  const [branches, setBranches] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const loadBranches = async () => {
    setLoading(true);
    setError('');
    try {
      const response = await branchAPI.getBranches();
      setBranches(response.data?.data || []);
    } catch (requestError: any) {
      setError(
        requestError?.response?.data?.message ||
          requestError?.message ||
          'Failed to load tenant branches.'
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadBranches();
  }, []);

  return (
    <AppShell
      title="Branches"
      description="Branch list, head-office hierarchy, location coverage, and branch activation status."
    >
      {loading ? <LoadingState label="Loading branches..." /> : null}
      {!loading ? (
        <div className="space-y-6">
          {error ? <ErrorState message={error} onRetry={loadBranches} /> : null}
          <section className="overflow-x-auto rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
            <table className="w-full min-w-[820px] text-left">
              <thead className="border-b border-slate-200 text-xs uppercase tracking-[0.2em] text-slate-500">
                <tr>
                  <th className="pb-3">Branch</th>
                  <th className="pb-3">Code</th>
                  <th className="pb-3">Location</th>
                  <th className="pb-3">Visibility</th>
                  <th className="pb-3">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {branches.map((branch) => (
                  <tr key={branch._id}>
                    <td className="py-4 font-semibold text-slate-900">{branch.name}</td>
                    <td className="py-4 text-sm text-slate-600">{branch.code || '-'}</td>
                    <td className="py-4 text-sm text-slate-600">
                      {[branch.city, branch.country].filter(Boolean).join(', ') ||
                        branch.location ||
                        '-'}
                    </td>
                    <td className="py-4">
                      <StatusPill tone={branch.isHeadOffice ? 'converted' : 'pending'}>
                        {branch.isHeadOffice ? 'Head Office' : branch.visibility || 'branch'}
                      </StatusPill>
                    </td>
                    <td className="py-4">
                      <StatusPill tone={branch.isActive ? 'completed' : 'overdue'}>
                        {branch.isActive ? 'Active' : 'Inactive'}
                      </StatusPill>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </section>
        </div>
      ) : null}
    </AppShell>
  );
}
