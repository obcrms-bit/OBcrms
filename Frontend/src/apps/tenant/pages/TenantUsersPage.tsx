'use client';

import { useEffect, useState } from 'react';
import AppShell from '@/components/app/app-shell';
import { ErrorState, LoadingState, StatusPill } from '@/components/app/shared';
import { authAPI } from '@/src/services/api';

export default function TenantUsersPage() {
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const loadUsers = async () => {
    setLoading(true);
    setError('');
    try {
      const response = await authAPI.getUsers();
      setUsers(response.data?.data?.users || []);
    } catch (requestError: any) {
      setError(
        requestError?.response?.data?.message ||
          requestError?.message ||
          'Failed to load tenant users.'
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadUsers();
  }, []);

  return (
    <AppShell
      title="Users"
      description="Tenant user roster with branch assignment, canonical role mapping, and active access state."
    >
      {loading ? <LoadingState label="Loading users..." /> : null}
      {!loading ? (
        <div className="space-y-6">
          {error ? <ErrorState message={error} onRetry={loadUsers} /> : null}
          <section className="overflow-x-auto rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
            <table className="w-full min-w-[860px] text-left">
              <thead className="border-b border-slate-200 text-xs uppercase tracking-[0.2em] text-slate-500">
                <tr>
                  <th className="pb-3">User</th>
                  <th className="pb-3">Role</th>
                  <th className="pb-3">Branch</th>
                  <th className="pb-3">Workspace</th>
                  <th className="pb-3">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {users.map((user) => (
                  <tr key={user.id || user._id}>
                    <td className="py-4">
                      <p className="font-semibold text-slate-900">{user.name}</p>
                      <p className="text-sm text-slate-500">{user.email}</p>
                    </td>
                    <td className="py-4 text-sm text-slate-600">
                      {user.canonicalRole || user.primaryRoleKey || user.role}
                    </td>
                    <td className="py-4 text-sm text-slate-600">
                      {user.branch?.name || user.branchId?.name || 'Unassigned'}
                    </td>
                    <td className="py-4">
                      <StatusPill tone={user.workspaceZone === 'platform' ? 'pending' : 'converted'}>
                        {user.workspaceZone || 'tenant'}
                      </StatusPill>
                    </td>
                    <td className="py-4">
                      <StatusPill tone={user.isActive ? 'completed' : 'overdue'}>
                        {user.isActive ? 'Active' : 'Inactive'}
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
