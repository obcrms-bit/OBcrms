'use client';

import { useEffect, useState } from 'react';
import AppShell from '@/components/app/app-shell';
import {
  EmptyState,
  ErrorState,
  LoadingState,
  StatusPill,
} from '@/components/app/shared';
import {
  agentAPI,
  commissionAPI,
  leadAPI,
  studentAPI,
} from '@/src/services/api';
import { hasPermission } from '@/src/services/access';
import { useAuth } from '@/context/AuthContext';

const inputClassName =
  'w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-teal-500 focus:bg-white';

const emptyForm = {
  agentId: '',
  leadId: '',
  studentId: '',
  commissionType: 'conversion',
  commissionAmount: '',
  notes: '',
};

export default function CommissionsPage() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [commissions, setCommissions] = useState([]);
  const [agents, setAgents] = useState([]);
  const [leads, setLeads] = useState([]);
  const [students, setStudents] = useState([]);
  const [form, setForm] = useState(emptyForm);

  const loadData = async () => {
    setLoading(true);
    setError('');
    try {
      const [commissionsResponse, agentsResponse, leadsResponse, studentsResponse] = await Promise.all([
        commissionAPI.getCommissions(),
        agentAPI.getAgents(),
        leadAPI.getLeads({ limit: 100 }),
        studentAPI.getAllStudents(1, 100, ''),
      ]);
      setCommissions(commissionsResponse.data?.data?.commissions || []);
      setAgents(agentsResponse.data?.data || []);
      setLeads(leadsResponse.data?.data?.leads || []);
      setStudents(studentsResponse.data?.data?.students || []);
    } catch (requestError) {
      setError(
        requestError?.response?.data?.message ||
          requestError?.message ||
          'Failed to load commission workspace.'
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleCreateCommission = async (event) => {
    event.preventDefault();
    setSaving(true);
    setError('');
    try {
      await commissionAPI.createCommission({
        ...form,
        commissionAmount: Number(form.commissionAmount || 0),
      });
      setForm(emptyForm);
      await loadData();
    } catch (requestError) {
      setError(
        requestError?.response?.data?.message ||
          requestError?.message ||
          'Failed to create commission.'
      );
    } finally {
      setSaving(false);
    }
  };

  const handleStatusUpdate = async (commissionId, status) => {
    try {
      await commissionAPI.updateCommissionStatus(commissionId, { status });
      await loadData();
    } catch (requestError) {
      setError(
        requestError?.response?.data?.message ||
          requestError?.message ||
          'Failed to update commission status.'
      );
    }
  };

  return (
    <AppShell
      title="Commissions"
      description="Agent payout foundation with branch-aware records, approval states, and future-ready finance visibility."
    >
      {loading ? <LoadingState label="Loading commissions..." /> : null}

      {!loading ? (
        <div className="space-y-8">
          {error ? <ErrorState message={error} onRetry={loadData} /> : null}

          {hasPermission(user, 'commissions', 'create') ? (
            <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
              <h3 className="text-xl font-semibold text-slate-900">Create Commission</h3>
              <form className="mt-6 grid gap-4 md:grid-cols-2" onSubmit={handleCreateCommission}>
                <label className="block space-y-2">
                  <span className="text-sm font-semibold text-slate-700">Agent</span>
                  <select
                    className={inputClassName}
                    value={form.agentId}
                    onChange={(event) =>
                      setForm((current) => ({
                        ...current,
                        agentId: event.target.value,
                      }))
                    }
                  >
                    <option value="">Select agent</option>
                    {agents.map((agent) => (
                      <option key={agent._id} value={agent._id}>
                        {agent.name}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="block space-y-2">
                  <span className="text-sm font-semibold text-slate-700">Lead (optional)</span>
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
                    <option value="">Select lead</option>
                    {leads.map((lead) => (
                      <option key={lead._id} value={lead._id}>
                        {lead.name || lead.fullName}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="block space-y-2">
                  <span className="text-sm font-semibold text-slate-700">Student / Client (optional)</span>
                  <select
                    className={inputClassName}
                    value={form.studentId}
                    onChange={(event) =>
                      setForm((current) => ({
                        ...current,
                        studentId: event.target.value,
                      }))
                    }
                  >
                    <option value="">Select student or client</option>
                    {students.map((student) => (
                      <option key={student._id} value={student._id}>
                        {student.fullName}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="block space-y-2">
                  <span className="text-sm font-semibold text-slate-700">Commission Type</span>
                  <select
                    className={inputClassName}
                    value={form.commissionType}
                    onChange={(event) =>
                      setForm((current) => ({
                        ...current,
                        commissionType: event.target.value,
                      }))
                    }
                  >
                    <option value="conversion">Conversion</option>
                    <option value="lead_submission">Lead submission</option>
                    <option value="application">Application</option>
                    <option value="custom">Custom</option>
                  </select>
                </label>
                <label className="block space-y-2">
                  <span className="text-sm font-semibold text-slate-700">Amount</span>
                  <input
                    className={inputClassName}
                    value={form.commissionAmount}
                    onChange={(event) =>
                      setForm((current) => ({
                        ...current,
                        commissionAmount: event.target.value,
                      }))
                    }
                  />
                </label>
                <label className="block space-y-2 md:col-span-2">
                  <span className="text-sm font-semibold text-slate-700">Notes</span>
                  <textarea
                    rows={4}
                    className={inputClassName}
                    value={form.notes}
                    onChange={(event) =>
                      setForm((current) => ({
                        ...current,
                        notes: event.target.value,
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
                    {saving ? 'Saving...' : 'Create Commission'}
                  </button>
                </div>
              </form>
            </section>
          ) : null}

          <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
            <h3 className="text-xl font-semibold text-slate-900">Commission Queue</h3>
            <div className="mt-6 space-y-4">
              {commissions.length ? (
                commissions.map((commission) => (
                  <div key={commission._id} className="rounded-2xl border border-slate-200 p-4">
                    <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                      <div>
                        <p className="font-semibold text-slate-900">
                          {commission.agentId?.name || 'Agent'} / {commission.commissionType}
                        </p>
                        <p className="mt-1 text-sm text-slate-500">
                          Amount: {commission.amount} / Status: {commission.status}
                        </p>
                        <p className="mt-2 text-sm text-slate-600">{commission.notes || 'No notes'}</p>
                      </div>
                      <div className="flex flex-wrap gap-2 lg:justify-end">
                        <StatusPill
                          tone={
                            commission.status === 'paid'
                              ? 'completed'
                              : commission.status === 'approved'
                                ? 'due_today'
                                : 'pending'
                          }
                        >
                          {commission.status}
                        </StatusPill>
                        {commission.status === 'pending' && hasPermission(user, 'commissions', 'approve') ? (
                          <button
                            type="button"
                            onClick={() => handleStatusUpdate(commission._id, 'approved')}
                            className="rounded-xl bg-slate-900 px-3 py-2 text-sm font-semibold text-white transition hover:bg-slate-800"
                          >
                            Approve
                          </button>
                        ) : null}
                        {commission.status === 'approved' && hasPermission(user, 'commissions', 'mark_paid') ? (
                          <button
                            type="button"
                            onClick={() => handleStatusUpdate(commission._id, 'paid')}
                            className="rounded-xl border border-emerald-200 px-3 py-2 text-sm font-semibold text-emerald-700 transition hover:bg-emerald-50"
                          >
                            Mark Paid
                          </button>
                        ) : null}
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <EmptyState
                  title="No commissions yet"
                  description="Commission records will appear here once agents start submitting or converting business."
                />
              )}
            </div>
          </section>
        </div>
      ) : null}
    </AppShell>
  );
}
