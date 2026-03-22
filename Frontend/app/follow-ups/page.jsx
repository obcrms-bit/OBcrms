'use client';

import Link from 'next/link';
import { useCallback, useEffect, useMemo, useState } from 'react';
import AppShell from '@/components/app/app-shell';
import {
  DataTableSurface,
  FilterToolbar,
  SectionHeader,
} from '@/components/app/design-system';
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
import { useLeadStore } from '@/src/stores/AppDataStore';
import { CalendarCheck2, Clock3, RefreshCw, UserRoundCheck } from 'lucide-react';

export default function FollowUpsPage() {
  const { user } = useAuth();
  const [actionError, setActionError] = useState('');
  const [filters, setFilters] = useState({
    search: '',
    status: '',
  });
  const [selectedItem, setSelectedItem] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [runningReminderSweep, setRunningReminderSweep] = useState(false);
  const {
    followUps,
    followUpSummary: summary,
    loadingFollowUps,
    error: storeError,
    loadFollowUps,
  } = useLeadStore();

  const canTriggerReminderSweep = ['super_admin', 'admin', 'manager'].includes(user?.role);

  const loadPage = useCallback(async () => {
    try {
      setActionError('');
      await loadFollowUps({
        ...(filters.search ? { search: filters.search } : {}),
        ...(filters.status ? { status: filters.status } : {}),
        limit: 100,
      });
    } catch (requestError) {
      setActionError(
        requestError?.response?.data?.message ||
          requestError?.message ||
          'Failed to load follow-up data.'
      );
    }
  }, [filters.search, filters.status, loadFollowUps]);

  const error = actionError || storeError;

  useEffect(() => {
    if (user?.role) {
      loadPage();
    }
  }, [loadPage, user?.role]);

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
    setActionError('');

    try {
      await leadAPI.completeFollowUp(selectedItem.leadId, selectedItem._id, form);
      setSelectedItem(null);
      await loadPage();
    } catch (requestError) {
      setActionError(
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
    setActionError('');

    try {
      await leadAPI.triggerReminderSweep();
      await loadPage();
    } catch (requestError) {
      setActionError(
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
              className="ds-button-secondary"
            >
              {runningReminderSweep ? 'Running reminders...' : 'Run reminder sweep'}
            </button>
          ) : null}
          <button
            type="button"
            onClick={loadPage}
            className="ds-button-primary"
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

        <FilterToolbar>
          <div className="grid gap-3 md:grid-cols-[minmax(0,1fr)_220px_auto]">
            <input
              className="ds-field"
              placeholder="Search lead, email, phone, counsellor, or branch"
              value={filters.search}
              onChange={(event) =>
                setFilters((current) => ({ ...current, search: event.target.value }))
              }
            />
            <select
              className="ds-field"
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
              className="ds-button-secondary"
            >
              <RefreshCw className="h-4 w-4" />
              Apply
            </button>
          </div>
        </FilterToolbar>

        {loadingFollowUps ? <LoadingState label="Loading follow-up queue..." /> : null}
        {!loadingFollowUps ? (
          <>
          {error ? <ErrorState message={error} onRetry={loadPage} /> : null}
          <DataTableSurface>
            <SectionHeader
              eyebrow="Follow-up Queue"
              title={`${followUps.length} follow-ups loaded`}
              description="Track scheduled touchpoints, reminder status, and completion outcomes in one operational queue."
            />

            {followUps.length === 0 ? (
              <div className="mt-6">
                <EmptyState
                  title="No follow-ups found"
                  description="Try adjusting your filters or schedule the next follow-up from a lead detail page."
                />
              </div>
            ) : (
              <div className="ds-table-wrap mt-6">
                <table className="ds-table min-w-[1100px]">
                  <thead>
                    <tr>
                      <th>Lead</th>
                      <th>Counsellor</th>
                      <th>Scheduled</th>
                      <th>Method</th>
                      <th>Reminder</th>
                      <th>Status</th>
                      <th className="text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {followUps.map((item) => (
                      <tr key={item._id}>
                        <td>
                          <div className="font-semibold text-slate-900">{item.leadName}</div>
                          <div className="text-sm text-slate-500">
                            {item.mobile || item.phone || item.email || 'No contact info'}
                          </div>
                        </td>
                        <td>
                          {item.assignedCounsellor?.name || 'Unassigned'}
                        </td>
                        <td>
                          {formatDateTime(item.scheduledAt)}
                        </td>
                        <td className="capitalize">
                          {String(item.followUp?.completionMethod || item.followUp?.type || 'call').replace(/_/g, ' ')}
                        </td>
                        <td>
                          {item.reminderMeta?.reminderStatus || 'pending'}
                          {item.reminderMeta?.reminderCount
                            ? ` (${item.reminderMeta.reminderCount})`
                            : ''}
                        </td>
                        <td>
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
                              href={`/tenant/leads/${item.leadId}`}
                              className="ds-button-secondary px-3 py-2"
                            >
                              View Lead
                            </Link>
                            {item.status !== 'completed' ? (
                              <button
                                type="button"
                                onClick={() => setSelectedItem(item)}
                                className="ds-button-primary px-3 py-2"
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
          </DataTableSurface>
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
