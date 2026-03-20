'use client';

import { useEffect, useState } from 'react';
import AppShell from '@/components/app/app-shell';
import {
  EmptyState,
  ErrorState,
  LoadingState,
  StatusPill,
} from '@/components/app/shared';
import { authAPI, branchAPI, leadAPI, transferAPI } from '@/src/services/api';
import { hasPermission } from '@/src/services/access';
import { useAuth } from '@/context/AuthContext';

const inputClassName =
  'w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-teal-500 focus:bg-white';

const emptyForm = {
  leadId: '',
  toBranchId: '',
  toAssigneeId: '',
  reason: '',
};

export default function TransfersPage() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [transfers, setTransfers] = useState([]);
  const [leads, setLeads] = useState([]);
  const [branches, setBranches] = useState([]);
  const [users, setUsers] = useState([]);
  const [form, setForm] = useState(emptyForm);

  const loadData = async () => {
    setLoading(true);
    setError('');
    try {
      const [transfersResponse, leadsResponse, branchesResponse, usersResponse] = await Promise.all([
        transferAPI.getTransfers(),
        leadAPI.getLeads({ limit: 200 }),
        branchAPI.getBranches(),
        authAPI.getUsers(),
      ]);
      setTransfers(transfersResponse.data?.data?.transfers || []);
      setLeads(leadsResponse.data?.data?.leads || []);
      setBranches(branchesResponse.data?.data || []);
      setUsers(usersResponse.data?.data?.users || []);
    } catch (requestError) {
      setError(
        requestError?.response?.data?.message ||
          requestError?.message ||
          'Failed to load transfers workspace.'
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleCreateTransfer = async (event) => {
    event.preventDefault();
    setSaving(true);
    setError('');
    try {
      await transferAPI.createTransfer(form);
      setForm(emptyForm);
      await loadData();
    } catch (requestError) {
      setError(
        requestError?.response?.data?.message ||
          requestError?.message ||
          'Failed to submit transfer request.'
      );
    } finally {
      setSaving(false);
    }
  };

  const handleTransferAction = async (transferId, action) => {
    const reason =
      action === 'reject'
        ? window.prompt('Enter rejection reason') || ''
        : action === 'cancel'
          ? window.prompt('Optional cancellation note') || ''
          : window.prompt('Optional approval note') || '';

    try {
      if (action === 'approve') {
        await transferAPI.approveTransfer(transferId, { notes: reason });
      }
      if (action === 'reject') {
        await transferAPI.rejectTransfer(transferId, { rejectionReason: reason });
      }
      if (action === 'cancel') {
        await transferAPI.cancelTransfer(transferId, { notes: reason });
      }
      await loadData();
    } catch (requestError) {
      setError(
        requestError?.response?.data?.message ||
          requestError?.message ||
          'Failed to update transfer request.'
      );
    }
  };

  return (
    <AppShell
      title="Transfers"
      description="Inter-branch client transfer workflow with approval support, auditability, and ownership continuity."
    >
      {loading ? <LoadingState label="Loading transfer workspace..." /> : null}

      {!loading ? (
        <div className="space-y-8">
          {error ? <ErrorState message={error} onRetry={loadData} /> : null}

          {hasPermission(user, 'transfers', 'create') ? (
            <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
              <h3 className="text-xl font-semibold text-slate-900">Request Transfer</h3>
              <form className="mt-6 grid gap-4 md:grid-cols-2" onSubmit={handleCreateTransfer}>
                <label className="block space-y-2">
                  <span className="text-sm font-semibold text-slate-700">Lead / Client</span>
                  <select
                    className={inputClassName}
                    value={form.leadId}
                    onChange={(event) =>
                      setForm((current) => ({
                        ...current,
                        leadId: event.target.value,
                      }))
                    }
                  >
                    <option value="">Select a record</option>
                    {leads.map((lead) => (
                      <option key={lead._id} value={lead._id}>
                        {(lead.name || lead.fullName || 'Lead').trim()} / {lead.branchName || 'Unassigned'}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="block space-y-2">
                  <span className="text-sm font-semibold text-slate-700">Target Branch</span>
                  <select
                    className={inputClassName}
                    value={form.toBranchId}
                    onChange={(event) =>
                      setForm((current) => ({
                        ...current,
                        toBranchId: event.target.value,
                      }))
                    }
                  >
                    <option value="">Select branch</option>
                    {branches.map((branch) => (
                      <option key={branch._id} value={branch._id}>
                        {branch.name}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="block space-y-2">
                  <span className="text-sm font-semibold text-slate-700">Target Assignee</span>
                  <select
                    className={inputClassName}
                    value={form.toAssigneeId}
                    onChange={(event) =>
                      setForm((current) => ({
                        ...current,
                        toAssigneeId: event.target.value,
                      }))
                    }
                  >
                    <option value="">Select staff</option>
                    {users.map((staff) => (
                      <option key={staff.id || staff._id} value={staff.id || staff._id}>
                        {staff.name}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="block space-y-2 md:col-span-2">
                  <span className="text-sm font-semibold text-slate-700">Transfer Reason</span>
                  <textarea
                    rows={4}
                    className={inputClassName}
                    value={form.reason}
                    onChange={(event) =>
                      setForm((current) => ({
                        ...current,
                        reason: event.target.value,
                      }))
                    }
                  />
                </label>
                <div className="md:col-span-2">
                  <button
                    type="submit"
                    disabled={saving}
                    className="rounded-xl bg-slate-900 px-4 py-3 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:opacity-60"
                  >
                    {saving ? 'Submitting...' : 'Submit Transfer Request'}
                  </button>
                </div>
              </form>
            </section>
          ) : null}

          <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
            <h3 className="text-xl font-semibold text-slate-900">Transfer Queue</h3>
            <div className="mt-6 space-y-4">
              {transfers.length ? (
                transfers.map((transfer) => (
                  <div key={transfer._id} className="rounded-2xl border border-slate-200 p-4">
                    <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                      <div>
                        <p className="font-semibold text-slate-900">
                          {transfer.leadId?.name ||
                            [transfer.leadId?.firstName, transfer.leadId?.lastName]
                              .filter(Boolean)
                              .join(' ') ||
                            'Lead'}
                        </p>
                        <p className="mt-1 text-sm text-slate-500">
                          {transfer.fromBranchId?.name} -&gt; {transfer.toBranchId?.name}
                        </p>
                        <p className="mt-2 text-sm text-slate-600">{transfer.reason}</p>
                        <p className="mt-2 text-sm text-slate-500">
                          Requested by {transfer.requestedBy?.name || 'Unknown'} on{' '}
                          {new Date(transfer.createdAt).toLocaleString()}
                        </p>
                      </div>
                      <div className="flex flex-wrap gap-2 lg:justify-end">
                        <StatusPill
                          tone={
                            transfer.status === 'completed'
                              ? 'completed'
                              : transfer.status === 'rejected'
                                ? 'lost'
                                : 'pending'
                          }
                        >
                          {transfer.status}
                        </StatusPill>
                        {transfer.requiresApproval ? (
                          <StatusPill tone="due_today">Approval required</StatusPill>
                        ) : null}
                        {transfer.status === 'pending' && hasPermission(user, 'transfers', 'approve') ? (
                          <button
                            type="button"
                            onClick={() => handleTransferAction(transfer._id, 'approve')}
                            className="rounded-xl bg-slate-900 px-3 py-2 text-sm font-semibold text-white transition hover:bg-slate-800"
                          >
                            Approve
                          </button>
                        ) : null}
                        {transfer.status === 'pending' && hasPermission(user, 'transfers', 'reject') ? (
                          <button
                            type="button"
                            onClick={() => handleTransferAction(transfer._id, 'reject')}
                            className="rounded-xl border border-rose-200 px-3 py-2 text-sm font-semibold text-rose-600 transition hover:bg-rose-50"
                          >
                            Reject
                          </button>
                        ) : null}
                        {transfer.status === 'pending' ? (
                          <button
                            type="button"
                            onClick={() => handleTransferAction(transfer._id, 'cancel')}
                            className="rounded-xl border border-slate-200 px-3 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
                          >
                            Cancel
                          </button>
                        ) : null}
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <EmptyState
                  title="No transfer requests"
                  description="Branch transfers will appear here once staff start moving records between branch teams."
                />
              )}
            </div>
          </section>
        </div>
      ) : null}
    </AppShell>
  );
}
