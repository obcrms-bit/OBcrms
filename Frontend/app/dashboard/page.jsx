'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import {
  AlertCircle,
  CalendarClock,
  CheckCircle2,
  ClipboardList,
  RefreshCw,
  Users,
} from 'lucide-react';
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
import { dashboardAPI, leadAPI } from '@/services/api';

export default function DashboardPage() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [summary, setSummary] = useState(null);
  const [stats, setStats] = useState(null);
  const [selectedFollowUp, setSelectedFollowUp] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  const canViewTeamPanels = ['super_admin', 'admin', 'manager'].includes(user?.role);

  const loadDashboard = async () => {
    setLoading(true);
    setError('');

    try {
      const [summaryResponse, statsResponse] = await Promise.allSettled([
        leadAPI.getFollowUpSummary(),
        canViewTeamPanels ? dashboardAPI.getDashboardStats() : Promise.resolve(null),
      ]);

      if (summaryResponse.status === 'rejected') {
        throw summaryResponse.reason;
      }

      setSummary(summaryResponse.value.data?.data || null);
      setStats(
        statsResponse.status === 'fulfilled' ? statsResponse.value?.data?.data || null : null
      );
    } catch (requestError) {
      setError(
        requestError?.response?.data?.message ||
          requestError?.message ||
          'Failed to load the dashboard.'
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user?.role) {
      loadDashboard();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.role]);

  const cards = useMemo(
    () => [
      {
        label: 'Due Today',
        value: summary?.counts?.dueToday || 0,
        helper: 'Tasks scheduled for today',
        icon: CalendarClock,
        accent: 'bg-sky-500',
      },
      {
        label: 'Overdue',
        value: summary?.counts?.overdue || 0,
        helper: 'Needs action now',
        icon: AlertCircle,
        accent: 'bg-rose-500',
      },
      {
        label: 'Pending',
        value: summary?.counts?.pending || 0,
        helper: 'All open follow-up tasks',
        icon: ClipboardList,
        accent: 'bg-amber-500',
      },
      {
        label: 'Completed Today',
        value: summary?.counts?.completedToday || 0,
        helper: `${summary?.completionRate || 0}% completion rate`,
        icon: CheckCircle2,
        accent: 'bg-emerald-500',
      },
    ],
    [summary]
  );

  const handleCompleteFollowUp = async (form) => {
    if (!selectedFollowUp) {
      return;
    }

    setSubmitting(true);
    setError('');

    try {
      await leadAPI.completeFollowUp(selectedFollowUp.leadId, selectedFollowUp._id, form);
      setSelectedFollowUp(null);
      await loadDashboard();
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

  const renderFollowUpRows = (items, emptyText) => {
    if (!items?.length) {
      return <p className="text-sm text-slate-500">{emptyText}</p>;
    }

    return (
      <div className="space-y-3">
        {items.map((item) => (
          <div key={item._id} className="rounded-3xl border border-slate-200 p-4">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
              <div>
                <p className="font-semibold text-slate-900">{item.leadName}</p>
                <p className="mt-1 text-sm text-slate-500">
                  {item.mobile || item.phone || item.email || 'No contact info'}
                </p>
                <div className="mt-3 flex flex-wrap gap-2">
                  <StatusPill tone={item.urgency}>{item.urgency.replace(/_/g, ' ')}</StatusPill>
                  <StatusPill tone={item.status}>{item.status}</StatusPill>
                  {item.outcomeType ? (
                    <StatusPill tone={item.outcomeType}>
                      {item.outcomeType.replace(/_/g, ' ')}
                    </StatusPill>
                  ) : null}
                </div>
                <p className="mt-3 text-sm text-slate-600">
                  Scheduled for {formatDateTime(item.scheduledAt)}
                </p>
              </div>
              <div className="flex flex-wrap gap-2 lg:justify-end">
                <Link
                  href={`/leads/${item.leadId}`}
                  className="rounded-xl border border-slate-200 px-3 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
                >
                  View Lead
                </Link>
                {item.status !== 'completed' ? (
                  <>
                    <button
                      type="button"
                      onClick={() => setSelectedFollowUp(item)}
                      className="rounded-xl bg-slate-900 px-3 py-2 text-sm font-semibold text-white transition hover:bg-slate-800"
                    >
                      Mark Done
                    </button>
                    <Link
                      href={`/leads/${item.leadId}/edit`}
                      className="rounded-xl border border-slate-200 px-3 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
                    >
                      Add Note / Edit
                    </Link>
                  </>
                ) : null}
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  };

  return (
    <AppShell
      title="Dashboard"
      description="Today's follow-up workload, overdue reminders, team completion progress, and the active lead list that still needs structured follow-up coverage."
      actions={
        <button
          type="button"
          onClick={loadDashboard}
          className="rounded-xl border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
        >
          <RefreshCw className="mr-2 inline h-4 w-4" />
          Refresh
        </button>
      }
    >
      {loading ? <LoadingState label="Loading dashboard..." /> : null}

      {!loading ? (
        <div className="space-y-8">
          {error ? <ErrorState message={error} onRetry={loadDashboard} /> : null}

          {summary ? (
            <>
              <div className="grid gap-4 xl:grid-cols-4">
                {cards.map((card) => (
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

              <div className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
                <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
                  <div className="flex items-center justify-between gap-4">
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
                        Today&apos;s Tasks
                      </p>
                      <h3 className="mt-2 text-xl font-semibold text-slate-900">
                        Follow-ups due today
                      </h3>
                    </div>
                    <Link
                      href="/follow-ups"
                      className="rounded-xl border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
                    >
                      Open follow-up queue
                    </Link>
                  </div>
                  <div className="mt-6">
                    {renderFollowUpRows(
                      summary.todayFollowUps,
                      'No follow-ups are scheduled for today.'
                    )}
                  </div>
                </section>

                <section className="space-y-6">
                  <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
                    <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
                      Overdue
                    </p>
                    <h3 className="mt-2 text-xl font-semibold text-slate-900">
                      Follow-ups that missed schedule
                    </h3>
                    <div className="mt-6">
                      {renderFollowUpRows(
                        summary.overdueFollowUps,
                        'No overdue follow-ups right now.'
                      )}
                    </div>
                  </div>

                  <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
                    <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
                      Upcoming
                    </p>
                    <h3 className="mt-2 text-xl font-semibold text-slate-900">
                      Next scheduled follow-ups
                    </h3>
                    <div className="mt-6">
                      {renderFollowUpRows(
                        summary.upcomingFollowUps,
                        'No upcoming follow-ups are scheduled yet.'
                      )}
                    </div>
                  </div>
                </section>
              </div>

              {canViewTeamPanels ? (
                <div className="grid gap-6 xl:grid-cols-[1fr_1fr]">
                  <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
                    <div className="flex items-center justify-between gap-4">
                      <div>
                        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
                          Team Summary
                        </p>
                        <h3 className="mt-2 text-xl font-semibold text-slate-900">
                          Counsellor follow-up breakdown
                        </h3>
                      </div>
                      <div className="inline-flex items-center gap-2 rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700">
                        <Users className="h-4 w-4" />
                        CRM Overview
                      </div>
                    </div>

                    {summary.byCounsellor?.length ? (
                      <div className="mt-6 overflow-x-auto">
                        <table className="w-full min-w-[620px] text-left">
                          <thead className="border-b border-slate-200 text-xs uppercase tracking-[0.2em] text-slate-500">
                            <tr>
                              <th className="pb-3">Counsellor</th>
                              <th className="pb-3">Pending</th>
                              <th className="pb-3">Overdue</th>
                              <th className="pb-3">Due Today</th>
                              <th className="pb-3">Completed Today</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-100">
                            {summary.byCounsellor.map((row) => (
                              <tr key={row.counsellorId || row.counsellorName}>
                                <td className="py-4 font-semibold text-slate-900">
                                  {row.counsellorName}
                                </td>
                                <td className="py-4 text-sm text-slate-600">{row.pending}</td>
                                <td className="py-4 text-sm text-slate-600">{row.overdue}</td>
                                <td className="py-4 text-sm text-slate-600">{row.dueToday}</td>
                                <td className="py-4 text-sm text-slate-600">
                                  {row.completedToday}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    ) : (
                      <p className="mt-6 text-sm text-slate-500">
                        No counsellor summary available yet.
                      </p>
                    )}

                    {stats ? (
                      <div className="mt-6 grid gap-4 md:grid-cols-4">
                        <div className="rounded-2xl bg-slate-50 p-4">
                          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
                            Leads
                          </p>
                          <p className="mt-2 text-2xl font-semibold text-slate-900">
                            {stats.totalLeads || 0}
                          </p>
                        </div>
                        <div className="rounded-2xl bg-slate-50 p-4">
                          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
                            Students
                          </p>
                          <p className="mt-2 text-2xl font-semibold text-slate-900">
                            {stats.totalStudents || 0}
                          </p>
                        </div>
                        <div className="rounded-2xl bg-slate-50 p-4">
                          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
                            Applications
                          </p>
                          <p className="mt-2 text-2xl font-semibold text-slate-900">
                            {stats.totalApplications || 0}
                          </p>
                        </div>
                        <div className="rounded-2xl bg-slate-50 p-4">
                          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
                            Completion Rate
                          </p>
                          <p className="mt-2 text-2xl font-semibold text-slate-900">
                            {summary.completionRate || 0}%
                          </p>
                        </div>
                      </div>
                    ) : null}
                  </section>

                  <section className="space-y-6">
                    <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
                      <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
                        No Future Follow-up
                      </p>
                      <h3 className="mt-2 text-xl font-semibold text-slate-900">
                        Active leads without future scheduling
                      </h3>
                      <div className="mt-6">
                        {summary.leadsWithoutFutureFollowUp?.length ? (
                          <div className="space-y-3">
                            {summary.leadsWithoutFutureFollowUp.map((lead) => (
                              <div key={lead._id} className="rounded-3xl border border-slate-200 p-4">
                                <p className="font-semibold text-slate-900">{lead.leadName}</p>
                                <p className="mt-1 text-sm text-slate-500">
                                  {lead.phone || lead.email || 'No contact info'}
                                </p>
                                <div className="mt-3 flex items-center justify-between gap-3">
                                  <StatusPill tone={lead.pipelineStage}>
                                    {String(lead.pipelineStage || '').replace(/_/g, ' ')}
                                  </StatusPill>
                                  <Link
                                    href={`/leads/${lead._id}`}
                                    className="text-sm font-semibold text-teal-700 transition hover:text-teal-800"
                                  >
                                    Open lead
                                  </Link>
                                </div>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <EmptyState
                            title="All active leads are covered"
                            description="Every active lead currently has a future follow-up scheduled."
                          />
                        )}
                      </div>
                    </div>

                    <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
                      <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
                        Contact Risk
                      </p>
                      <h3 className="mt-2 text-xl font-semibold text-slate-900">
                        Leads overdue for contact
                      </h3>
                      <div className="mt-6">
                        {summary.leadsOverdueForContact?.length ? (
                          <div className="space-y-3">
                            {summary.leadsOverdueForContact.map((lead) => (
                              <div key={lead._id} className="rounded-3xl border border-slate-200 p-4">
                                <p className="font-semibold text-slate-900">{lead.leadName}</p>
                                <p className="mt-1 text-sm text-slate-500">
                                  Last contacted:{' '}
                                  {lead.lastContactedAt ? formatDateTime(lead.lastContactedAt) : 'Never'}
                                </p>
                                <div className="mt-3 flex items-center justify-between gap-3">
                                  <StatusPill tone="overdue">Overdue</StatusPill>
                                  <Link
                                    href={`/leads/${lead._id}`}
                                    className="text-sm font-semibold text-teal-700 transition hover:text-teal-800"
                                  >
                                    Review lead
                                  </Link>
                                </div>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <p className="text-sm text-slate-500">
                            No leads are overdue for contact.
                          </p>
                        )}
                      </div>
                    </div>
                  </section>
                </div>
              ) : null}
            </>
          ) : null}
        </div>
      ) : null}

      <CompleteFollowUpModal
        open={Boolean(selectedFollowUp)}
        followUp={selectedFollowUp?.followUp}
        leadName={selectedFollowUp?.leadName}
        counsellorName={user?.name}
        onClose={() => setSelectedFollowUp(null)}
        onSubmit={handleCompleteFollowUp}
        submitting={submitting}
      />
    </AppShell>
  );
}
