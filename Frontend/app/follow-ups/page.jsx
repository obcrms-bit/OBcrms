'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import AppShell from '@/components/app/app-shell';
import {
  EmptyState,
  ErrorState,
  LoadingState,
  MetricCard,
  StatusPill,
  formatDateTime,
} from '@/components/app/shared';
import { CompleteFollowUpModal } from '@/components/leads/follow-up-modals';
import { useAuth } from '@/context/AuthContext';
import { leadAPI } from '@/services/api';
import { CalendarCheck2, Clock3, RefreshCw, UserRoundCheck } from 'lucide-react';

export default function FollowUpsPage() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [followUps, setFollowUps] = useState([]);
  const [summary, setSummary] = useState(null);
  const [filters, setFilters] = useState({
    search: '',
    status: '',
  });
  const [selectedItem, setSelectedItem] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [runningReminderSweep, setRunningReminderSweep] = useState(false);

  const canTriggerReminderSweep = ['super_admin', 'admin', 'manager'].includes(user?.role);

  const loadPage = async () => {
    setLoading(true);
    setError('');

    try {
      const [listResponse, summaryResponse] = await Promise.all([
        leadAPI.getFollowUps({
          ...(filters.search ? { search: filters.search } : {}),
          ...(filters.status ? { status: filters.status } : {}),
          limit: 100,
        }),
        leadAPI.getFollowUpSummary(),
      ]);

      setFollowUps(listResponse.data?.data?.followUps || []);
      setSummary(summaryResponse.data?.data || null);
    } catch (requestError) {
      setError(
        requestError?.response?.data?.message ||
          requestError?.message ||
          'Failed to load follow-up data.'
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user?.role) {
      loadPage();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.role]);

  const summaryCards = useMemo(
    () => [
      {
        label: 'Pending',
        value: summary?.counts?.pending || 0,
        helper: 'Open follow-up tasks',
        icon: Clock3,
        accent: 'bg-amber-500',
      },
      {
        label: 'Overdue',
        value: summary?.counts?.overdue || 0,
        helper: 'Require immediate action',
        icon: CalendarCheck2,
        accent: 'bg-rose-500',
      },
      {
        label: 'Due Today',
        value: summary?.counts?.dueToday || 0,
        helper: 'Scheduled for today',
        icon: UserRoundCheck,
        accent: 'bg-sky-500',
      },
    ],
    [summary]
  );

  const handleCompleteFollowUp = async (form) => {
    if (!selectedItem) {
      return;
    }

    setSubmitting(true);
    setError('');

    try {
      await leadAPI.completeFollowUp(selectedItem.leadId, selectedItem._id, form);
      setSelectedItem(null);
      await loadPage();
    } catch (requestError) {
      setError(
        requestError?.response?.data?.message ||
          requestError?.message ||
          'Failed to complete the follow-up.'
      );
    } finally {
      setSubmitting(false);
    }
  };

  const handleTriggerReminderSweep = async () => {
    setRunningReminderSweep(true);
    setError('');

    try {
      await leadAPI.triggerReminderSweep();
      await loadPage();
    } catch (requestError) {
      setError(
        requestError?.response?.data?.message ||
          requestError?.message ||
          'Failed to trigger the reminder sweep.'
      );
    } finally {
      setRunningReminderSweep(false);
    }
  };

  return (
    <AppShell
      title="Follow-ups"
      description="Monitor upcoming, due-today, overdue, and completed counselling tasks, then complete them with the mandatory outcome workflow."
      actions={
        <>
          {canTriggerReminderSweep ? (
            <button
              type="button"
              onClick={handleTriggerReminderSweep}
              disabled={runningReminderSweep}
              className="rounded-xl border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {runningReminderSweep ? 'Running reminders...' : 'Run reminder sweep'}
            </button>
          ) : null}
          <button
            type="button"
            onClick={loadPage}
            className="rounded-xl bg-slate-900 px-4 py-2 text-sm font-semibold text-white transition hover:bg-slate-800"
          >
            Refresh
          </button>
        </>
      }
    >
      <div className="space-y-6">
        <div className="grid gap-4 xl:grid-cols-3">
          {summaryCards.map((card) => (
            <MetricCard
              key={card.label}
              label={card.label}
              value={card.value}
              helper={card.helper}
              icon={card.icon}
              accent={card.accent}
            />
          ))}
        </div>

        <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="grid gap-3 md:grid-cols-[minmax(0,1fr)_220px_auto]">
            <input
              className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-teal-500 focus:bg-white"
              placeholder="Search lead, email, phone, counsellor, or branch"
              value={filters.search}
              onChange={(event) =>
                setFilters((current) => ({ ...current, search: event.target.value }))
              }
            />
            <select
              className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-teal-500 focus:bg-white"
              value={filters.status}
              onChange={(event) =>
                setFilters((current) => ({ ...current, status: event.target.value }))
              }
            >
              <option value="">All statuses</option>
              <option value="pending">Pending</option>
              <option value="overdue">Overdue</option>
              <option value="completed">Completed</option>
            </select>
            <button
              type="button"
              onClick={loadPage}
              className="inline-flex items-center justify-center gap-2 rounded-2xl border border-slate-200 px-4 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
            >
              <RefreshCw className="h-4 w-4" />
              Apply
            </button>
          </div>
        </section>

        {loading ? <LoadingState label="Loading follow-up queue..." /> : null}
        {!loading ? (
          <>
          {error ? <ErrorState message={error} onRetry={loadPage} /> : null}
          <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
                  Follow-up Queue
                </p>
                <h3 className="mt-2 text-xl font-semibold text-slate-900">
                  {followUps.length} follow-ups loaded
                </h3>
              </div>
            </div>

            {followUps.length === 0 ? (
              <div className="mt-6">
                <EmptyState
                  title="No follow-ups found"
                  description="Try adjusting your filters or schedule the next follow-up from a lead detail page."
                />
              </div>
            ) : (
              <div className="mt-6 overflow-x-auto">
                <table className="w-full min-w-[1100px] text-left">
                  <thead className="border-b border-slate-200 text-xs uppercase tracking-[0.2em] text-slate-500">
                    <tr>
                      <th className="pb-3">Lead</th>
                      <th className="pb-3">Counsellor</th>
                      <th className="pb-3">Scheduled</th>
                      <th className="pb-3">Method</th>
                      <th className="pb-3">Reminder</th>
                      <th className="pb-3">Status</th>
                      <th className="pb-3 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {followUps.map((item) => (
                      <tr key={item._id}>
                        <td className="py-4">
                          <div className="font-semibold text-slate-900">{item.leadName}</div>
                          <div className="text-sm text-slate-500">
                            {item.mobile || item.phone || item.email || 'No contact info'}
                          </div>
                        </td>
                        <td className="py-4 text-sm text-slate-600">
                          {item.assignedCounsellor?.name || 'Unassigned'}
                        </td>
                        <td className="py-4 text-sm text-slate-600">
                          {formatDateTime(item.scheduledAt)}
                        </td>
                        <td className="py-4 text-sm text-slate-600 capitalize">
                          {String(item.followUp?.completionMethod || item.followUp?.type || 'call').replace(/_/g, ' ')}
                        </td>
                        <td className="py-4 text-sm text-slate-600">
                          {item.reminderMeta?.reminderStatus || 'pending'}
                          {item.reminderMeta?.reminderCount
                            ? ` (${item.reminderMeta.reminderCount})`
                            : ''}
                        </td>
                        <td className="py-4">
                          <div className="flex flex-wrap gap-2">
                            <StatusPill tone={item.urgency}>{item.urgency.replace(/_/g, ' ')}</StatusPill>
                            <StatusPill tone={item.status}>{item.status}</StatusPill>
                            {item.outcomeType ? (
                              <StatusPill tone={item.outcomeType}>
                                {item.outcomeType.replace(/_/g, ' ')}
                              </StatusPill>
                            ) : null}
                          </div>
                        </td>
                        <td className="py-4">
                          <div className="flex justify-end gap-2">
                            <Link
                              href={`/leads/${item.leadId}`}
                              className="rounded-xl border border-slate-200 px-3 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
                            >
                              View Lead
                            </Link>
                            {item.status !== 'completed' ? (
                              <button
                                type="button"
                                onClick={() => setSelectedItem(item)}
                                className="rounded-xl bg-slate-900 px-3 py-2 text-sm font-semibold text-white transition hover:bg-slate-800"
                              >
                                Mark Done
                              </button>
                            ) : null}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>
          </>
        ) : null}
      </div>

      <CompleteFollowUpModal
        open={Boolean(selectedItem)}
        followUp={selectedItem?.followUp}
        leadName={selectedItem?.leadName}
        counsellorName={user?.name}
        onClose={() => setSelectedItem(null)}
        onSubmit={handleCompleteFollowUp}
        submitting={submitting}
      />
    </AppShell>
  );
}
