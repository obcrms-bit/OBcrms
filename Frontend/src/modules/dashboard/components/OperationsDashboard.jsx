'use client';

import Link from 'next/link';
import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  BellRing,
  CalendarClock,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  ClipboardList,
  Clock3,
  GraduationCap,
  RefreshCw,
  ShieldAlert,
  Sparkles,
  Users,
} from 'lucide-react';
import AppShell from '@/components/app/app-shell';
import {
  DataTableSurface,
  InlineStats,
  PageHero,
  SectionCard,
  SectionHeader,
} from '@/components/app/design-system';
import {
  EmptyState,
  ErrorState,
  LoadingState,
  MetricCard,
  StatusPill,
  formatDate,
  formatDateTime,
} from '@/components/app/shared';
import { CompleteFollowUpModal } from '@/components/leads/follow-up-modals';
import { useAuth } from '@/context/AuthContext';
import { cn } from '@/lib/utils';
import { authAPI, leadAPI, studentAPI } from '@/services/api';
import { hasPermission, normalizeRoleKey } from '@/src/services/access';
import { useDashboardStore } from '@/src/stores/AppDataStore';
import {
  getSelectedBranchId,
  WORKSPACE_BRANCH_EVENT,
} from '@/src/services/workspace';
import {
  addDays,
  buildCalendarEvents,
  CALENDAR_VIEWS,
  deriveUpcomingBirthdays,
  FOLLOW_UP_TABS,
  formatCalendarHeading,
  formatClockDate,
  formatClockTime,
  formatWeekday,
  getFollowUpNote,
  getGreeting,
  isSameDay,
  moveCalendarCursor,
  normalizeDate,
  startOfDay,
  startOfMonthGrid,
  startOfWeek,
} from '../utils/dashboard-utils';
import {
  FollowUpTable,
  MiniTimelineList,
  SecondaryPanelLoader,
  SmallListEmpty,
} from './dashboard-supporting-ui';

export default function OperationsDashboard() {
  const { user } = useAuth();
  const [actionError, setActionError] = useState('');
  const [selectedFollowUp, setSelectedFollowUp] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [selectedBranchId, setSelectedBranchId] = useState('');
  const [pageLoading, setPageLoading] = useState(true);
  const [widgetLoading, setWidgetLoading] = useState(true);
  const [lastRefreshedAt, setLastRefreshedAt] = useState(null);
  const [now, setNow] = useState(() => new Date());
  const [followUpTab, setFollowUpTab] = useState('due_today');
  const [searchTerm, setSearchTerm] = useState('');
  const [scheduleDate, setScheduleDate] = useState('');
  const [calendarView, setCalendarView] = useState('month');
  const [calendarCursor, setCalendarCursor] = useState(() => startOfDay(new Date()));
  const [widgetData, setWidgetData] = useState({
    notifications: [],
    leadRecords: [],
    studentRecords: [],
    users: [],
  });
  const {
    summary,
    stats,
    loadingDashboard,
    error: storeError,
    loadDashboard: loadDashboardStore,
    loadNotifications,
  } = useDashboardStore();

  const roleKey = normalizeRoleKey(user);
  const canViewTeamPanels =
    user?.isHeadOffice ||
    ['head_office_admin', 'branch_manager', 'super_admin', 'admin', 'manager'].includes(roleKey) ||
    hasPermission(user, 'dashboards', 'manage');
  const canViewNotifications = hasPermission(user, 'notifications', 'view');
  const canViewUsers = hasPermission(user, 'users', 'view') || hasPermission(user, 'settings', 'view');
  const displayName = user?.name?.split(' ')?.[0] || user?.name || 'there';
  const timeZone = user?.company?.timezone || 'Asia/Kathmandu';
  const error = actionError || storeError;

  useEffect(() => {
    const timer = window.setInterval(() => setNow(new Date()), 60000);
    return () => window.clearInterval(timer);
  }, []);

  const hydrateDashboardWidgets = useCallback(
    async (branchId = selectedBranchId) => {
      setWidgetLoading(true);

      try {
        const requests = await Promise.allSettled([
          canViewNotifications ? loadNotifications({ limit: 8 }) : Promise.resolve({ notifications: [] }),
          leadAPI.getLeads(
            branchId ? { branchId, limit: 120, compact: 'dashboard' } : { limit: 120, compact: 'dashboard' }
          ),
          studentAPI.getAllStudents(1, 120, '', branchId ? { branchId, compact: 'dashboard' } : { compact: 'dashboard' }),
          canViewUsers
            ? authAPI.getUsers({ compact: 'dashboard' })
            : Promise.resolve({ data: { data: { users: [] } } }),
        ]);

        const [notificationsResult, leadsResult, studentsResult, usersResult] = requests;

        setWidgetData({
          notifications:
            notificationsResult.status === 'fulfilled'
              ? notificationsResult.value?.notifications || notificationsResult.value?.data?.data?.notifications || []
              : [],
          leadRecords:
            leadsResult.status === 'fulfilled' ? leadsResult.value?.data?.data?.leads || [] : [],
          studentRecords:
            studentsResult.status === 'fulfilled'
              ? studentsResult.value?.data?.data?.students || []
              : [],
          users:
            usersResult.status === 'fulfilled' ? usersResult.value?.data?.data?.users || [] : [],
        });
        setLastRefreshedAt(new Date());
      } finally {
        setWidgetLoading(false);
      }
    },
    [
      canViewNotifications,
      canViewUsers,
      loadNotifications,
      selectedBranchId,
    ]
  );

  const hydrateDashboard = useCallback(
    async (branchId = selectedBranchId) => {
      setPageLoading(true);
      setActionError('');

      try {
        await loadDashboardStore(branchId ? { branchId } : {}, canViewTeamPanels);
        setLastRefreshedAt(new Date());
        void hydrateDashboardWidgets(branchId);
      } catch (requestError) {
        setWidgetLoading(false);
        setActionError(
          requestError?.response?.data?.message ||
            requestError?.message ||
            'Failed to load the dashboard.'
        );
      } finally {
        setPageLoading(false);
      }
    },
    [canViewTeamPanels, hydrateDashboardWidgets, loadDashboardStore, selectedBranchId]
  );

  useEffect(() => {
    const initialBranchId = getSelectedBranchId();
    setSelectedBranchId(initialBranchId);
    if (user?.role) hydrateDashboard(initialBranchId);

    const handleBranchChange = (event) => {
      const branchId = event?.detail?.branchId || '';
      setSelectedBranchId(branchId);
      if (user?.role) hydrateDashboard(branchId);
    };

    window.addEventListener(WORKSPACE_BRANCH_EVENT, handleBranchChange);
    return () => window.removeEventListener(WORKSPACE_BRANCH_EVENT, handleBranchChange);
  }, [hydrateDashboard, user?.role]);

  const cards = useMemo(
    () => [
      { label: 'Total Leads', value: stats?.totalLeads || 0, helper: 'Tenant CRM records', icon: Users, accent: 'bg-sky-600' },
      { label: 'Students', value: stats?.totalStudents || 0, helper: 'Converted student journeys', icon: GraduationCap, accent: 'bg-violet-600' },
      { label: 'Applications', value: stats?.totalApplications || 0, helper: 'Active admission cases', icon: ClipboardList, accent: 'bg-fuchsia-600' },
      { label: 'Due Today', value: summary?.counts?.dueToday || 0, helper: 'Current-day follow-ups', icon: CalendarClock, accent: 'bg-blue-600' },
      { label: 'Overdue', value: summary?.counts?.overdue || 0, helper: 'Needs immediate action', icon: ShieldAlert, accent: 'bg-rose-600' },
      { label: 'Completed Today', value: summary?.counts?.completedToday || 0, helper: `${summary?.completionRate || 0}% completion rate`, icon: CheckCircle2, accent: 'bg-emerald-600' },
    ],
    [stats, summary]
  );

  const followUpCollections = useMemo(
    () => ({
      due_today: summary?.todayFollowUps || [],
      overdue: summary?.overdueFollowUps || [],
      upcoming: summary?.upcomingFollowUps || [],
      completed: summary?.completedToday || [],
    }),
    [summary]
  );

  const activeFollowUpItems = useMemo(() => {
    const items = [...(followUpCollections[followUpTab] || [])];
    return items.filter((item) => {
      const search = searchTerm.trim().toLowerCase();
      const itemDate = normalizeDate(item.scheduledAt);
      const matchesSearch =
        !search ||
        [
          item.leadName,
          item.mobile,
          item.phone,
          item.email,
          item.assignedCounsellor?.name,
          item.branchName,
          getFollowUpNote(item),
        ]
          .filter(Boolean)
          .some((value) => String(value).toLowerCase().includes(search));

      return !scheduleDate || (itemDate && itemDate.toISOString().slice(0, 10) === scheduleDate)
        ? matchesSearch
        : false;
    });
  }, [followUpCollections, followUpTab, scheduleDate, searchTerm]);

  const calendarEvents = useMemo(() => buildCalendarEvents(summary), [summary]);
  const monthGrid = useMemo(() => {
    const gridStart = startOfMonthGrid(calendarCursor);
    return Array.from({ length: 42 }, (_, index) => addDays(gridStart, index));
  }, [calendarCursor]);
  const weekRange = useMemo(
    () => Array.from({ length: 7 }, (_, index) => addDays(startOfWeek(calendarCursor), index)),
    [calendarCursor]
  );

  const visibleCalendarEvents = useMemo(() => {
    if (calendarView === 'month') return calendarEvents;
    if (calendarView === 'week') {
      const weekStart = startOfWeek(calendarCursor);
      const weekEnd = addDays(weekStart, 7);
      return calendarEvents.filter((event) => event.scheduledAt >= weekStart && event.scheduledAt < weekEnd);
    }
    if (calendarView === 'day') {
      return calendarEvents.filter((event) => isSameDay(event.scheduledAt, calendarCursor));
    }
    return calendarEvents.slice(0, 30);
  }, [calendarCursor, calendarEvents, calendarView]);

  const birthdays = useMemo(
    () => deriveUpcomingBirthdays(widgetData.leadRecords, widgetData.studentRecords),
    [widgetData.leadRecords, widgetData.studentRecords]
  );

  const joinAnniversaries = useMemo(
    () =>
      widgetData.users
        .map((person) => {
          const createdAt = normalizeDate(person.createdAt);
          if (!createdAt) return null;
          const upcomingOn = new Date(now.getFullYear(), createdAt.getMonth(), createdAt.getDate());
          if (upcomingOn < startOfDay(now)) upcomingOn.setFullYear(upcomingOn.getFullYear() + 1);
          return { id: person._id, name: person.name, label: person.jobTitle || person.role || 'Team member', upcomingOn };
        })
        .filter(Boolean)
        .sort((left, right) => left.upcomingOn.getTime() - right.upcomingOn.getTime())
        .slice(0, 6),
    [now, widgetData.users]
  );

  const keyHighlights = useMemo(() => {
    if (widgetData.notifications.length) {
      return widgetData.notifications.slice(0, 4).map((notification) => ({
        id: notification._id,
        title: notification.title || notification.message || 'Notification',
        helper: formatDateTime(notification.createdAt),
      }));
    }
    if (summary?.leadsOverdueForContact?.length) {
      return summary.leadsOverdueForContact.slice(0, 4).map((lead) => ({
        id: lead._id,
        title: lead.leadName,
        helper: lead.lastContactedAt ? `Last contacted ${formatDateTime(lead.lastContactedAt)}` : 'No recorded contact yet',
      }));
    }
    return [];
  }, [summary, widgetData.notifications]);

  const reminderItems = useMemo(
    () => widgetData.notifications.filter((notification) => ['reminder', 'followup', 'billing'].includes(notification.type)),
    [widgetData.notifications]
  );

  const taskItems = useMemo(
    () => [...(summary?.todayFollowUps || []), ...(summary?.overdueFollowUps || [])].slice(0, 6),
    [summary]
  );

  const handleCompleteFollowUp = async (form) => {
    if (!selectedFollowUp) return;
    setSubmitting(true);
    setActionError('');

    try {
      await leadAPI.completeFollowUp(selectedFollowUp.leadId, selectedFollowUp._id, form);
      setSelectedFollowUp(null);
      await hydrateDashboard();
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

  return (
    <AppShell
      title="Dashboard"
      description="Monitor CRM workload, act on scheduled follow-ups, and keep the counselling team aligned without changing any routes or backend contracts."
      actions={
        <button
          type="button"
          onClick={() => hydrateDashboard()}
          className="ds-button-secondary"
          disabled={pageLoading || widgetLoading}
        >
          <RefreshCw className={`h-4 w-4 ${pageLoading || widgetLoading ? 'animate-spin' : ''}`} />
          {pageLoading || widgetLoading ? 'Refreshing...' : 'Refresh'}
        </button>
      }
    >
      {pageLoading || loadingDashboard ? <LoadingState label="Loading dashboard..." /> : null}

      {!pageLoading && !loadingDashboard ? (
        <div className="ds-page-stack">
          {error ? <ErrorState message={error} onRetry={() => hydrateDashboard()} /> : null}
          {summary ? (
            <>
              <PageHero
                eyebrow="Operations Snapshot"
                title={`${getGreeting(now)}, ${displayName}!`}
                description="The legacy dashboard layout is preserved as a task-oriented workspace, now with cleaner spacing, clearer widgets, and live backend data only."
                aside={
                  <div className="grid gap-4 md:grid-cols-3 xl:grid-cols-1">
                    <div className="ds-surface-muted">
                      <div className="flex items-center justify-between gap-3">
                        <div>
                          <p className="ds-stat-label">Local time</p>
                          <p className="mt-2 text-3xl font-semibold text-slate-950">
                            {formatClockTime(now, timeZone)}
                          </p>
                          <p className="mt-1 text-sm text-slate-500">{formatClockDate(now, timeZone)}</p>
                        </div>
                        <div className="rounded-2xl bg-teal-600 p-3 text-white shadow-lg shadow-teal-200">
                          <Clock3 className="h-5 w-5" />
                        </div>
                      </div>
                    </div>
                    <div className="ds-surface-muted">
                      <p className="ds-stat-label">Workspace health</p>
                      <div className="mt-3 flex items-center gap-2">
                        <StatusPill tone="completed">Connected</StatusPill>
                        <span className="text-sm text-slate-500">
                          {lastRefreshedAt ? `Refreshed ${formatDateTime(lastRefreshedAt)}` : 'Fresh session'}
                        </span>
                      </div>
                    </div>
                    <div className="ds-surface-muted">
                      <p className="ds-stat-label">Coverage</p>
                      <p className="mt-2 text-sm leading-6 text-slate-600">
                        {summary.counts.pending} open follow-ups, {summary.counts.leadsWithoutFutureFollowUp}{' '}
                        uncovered leads, and {summary.counts.leadsOverdueForContact} contact-risk records.
                      </p>
                    </div>
                  </div>
                }
              >
                <div className="flex flex-wrap gap-2">
                  <div className="ds-chip">
                    <Sparkles className="mr-2 h-4 w-4" />
                    Completion rate {summary.completionRate || 0}%
                  </div>
                  <div className="ds-chip">
                    <BellRing className="mr-2 h-4 w-4" />
                    {widgetData.notifications.length} recent notifications
                  </div>
                  <div className="ds-chip">
                    <CalendarClock className="mr-2 h-4 w-4" />
                    {summary.counts.upcoming} upcoming follow-ups
                  </div>
                </div>
              </PageHero>

              <div className="ds-kpi-grid xl:grid-cols-3 2xl:grid-cols-6">
                {cards.map((card) => (
                  <MetricCard key={card.label} {...card} />
                ))}
              </div>

              <div className="grid gap-6 xl:grid-cols-[minmax(0,1.55fr)_340px]">
                <div className="space-y-6">
                  <SectionCard>
                    <SectionHeader
                      eyebrow="Stay Updated"
                      title="Scheduled follow-up workbench"
                      description="The classic scheduled follow-up section, preserved with live filters and queue tabs."
                    />
                    <div className="mt-6 grid gap-4 xl:grid-cols-[240px_minmax(0,1fr)]">
                      <div className="rounded-[1.5rem] border border-slate-200 bg-slate-50/80 p-3">
                        <div className="space-y-2">
                          {FOLLOW_UP_TABS.map((tab) => {
                            const isActive = followUpTab === tab.key;
                            const count =
                              tab.key === 'due_today'
                                ? summary.counts.dueToday
                                : tab.key === 'overdue'
                                  ? summary.counts.overdue
                                  : tab.key === 'upcoming'
                                    ? summary.counts.upcoming
                                    : summary.counts.completedToday;

                            return (
                              <button
                                key={tab.key}
                                type="button"
                                onClick={() => setFollowUpTab(tab.key)}
                                className={cn(
                                  'flex w-full items-center justify-between rounded-2xl px-4 py-3 text-left text-sm font-semibold transition',
                                  isActive
                                    ? 'bg-blue-600 text-white shadow-lg shadow-blue-200'
                                    : 'bg-white text-slate-700 hover:bg-slate-100'
                                )}
                              >
                                <span>{tab.label}</span>
                                <span className={cn('rounded-full px-2 py-0.5 text-xs', isActive ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-500')}>
                                  {count}
                                </span>
                              </button>
                            );
                          })}
                        </div>
                      </div>
                      <div className="space-y-4">
                        <div className="grid gap-3 md:grid-cols-[minmax(0,1fr)_180px_auto]">
                          <input
                            className="ds-field w-full"
                            placeholder="Search lead, phone, counsellor, or note"
                            value={searchTerm}
                            onChange={(event) => setSearchTerm(event.target.value)}
                          />
                          <input
                            type="date"
                            className="ds-field w-full"
                            value={scheduleDate}
                            onChange={(event) => setScheduleDate(event.target.value)}
                          />
                          <button
                            type="button"
                            className="ds-button-secondary"
                            onClick={() => {
                              setSearchTerm('');
                              setScheduleDate('');
                            }}
                          >
                            Reset
                          </button>
                        </div>
                        <FollowUpTable items={activeFollowUpItems} onComplete={setSelectedFollowUp} />
                      </div>
                    </div>
                  </SectionCard>

                  <DataTableSurface>
                    <SectionHeader
                      eyebrow="Calendar"
                      title="Follow-up calendar"
                      description="Month, week, day, and list views sourced from the current follow-up queues."
                      actions={
                        <>
                          <button type="button" onClick={() => setCalendarCursor(startOfDay(new Date()))} className="ds-button-secondary">
                            Today
                          </button>
                          <div className="flex items-center gap-2 rounded-2xl border border-slate-200 bg-slate-50 px-2 py-2">
                            <button type="button" onClick={() => setCalendarCursor((current) => moveCalendarCursor(current, calendarView, -1))} className="rounded-xl p-2 text-slate-600 transition hover:bg-white">
                              <ChevronLeft className="h-4 w-4" />
                            </button>
                            <button type="button" onClick={() => setCalendarCursor((current) => moveCalendarCursor(current, calendarView, 1))} className="rounded-xl p-2 text-slate-600 transition hover:bg-white">
                              <ChevronRight className="h-4 w-4" />
                            </button>
                          </div>
                          <div className="flex flex-wrap gap-2 rounded-2xl border border-slate-200 bg-slate-50 p-2">
                            {CALENDAR_VIEWS.map((view) => (
                              <button
                                key={view.key}
                                type="button"
                                onClick={() => setCalendarView(view.key)}
                                className={cn(
                                  'rounded-xl px-3 py-2 text-sm font-semibold transition',
                                  calendarView === view.key ? 'bg-blue-600 text-white shadow-lg shadow-blue-200' : 'text-slate-600 hover:bg-white'
                                )}
                              >
                                {view.label}
                              </button>
                            ))}
                          </div>
                        </>
                      }
                    />
                    <div className="mt-6">
                      {calendarView === 'month' ? (
                        <div className="space-y-4">
                          <div className="flex items-center justify-between">
                            <p className="text-lg font-semibold text-slate-950">{formatCalendarHeading(calendarCursor)}</p>
                            <p className="text-sm text-slate-500">{calendarEvents.length} events in view</p>
                          </div>
                          <div className="grid grid-cols-7 gap-3 text-center text-xs font-semibold uppercase tracking-[0.22em] text-slate-400">
                            {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((label) => (
                              <span key={label}>{label}</span>
                            ))}
                          </div>
                          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-7">
                            {monthGrid.map((day) => {
                              const dayEvents = calendarEvents.filter((event) => isSameDay(event.scheduledAt, day));
                              const isToday = isSameDay(day, now);
                              const isCurrentMonth = day.getMonth() === calendarCursor.getMonth();

                              return (
                                <button
                                  key={day.toISOString()}
                                  type="button"
                                  onClick={() => {
                                    setCalendarCursor(day);
                                    setCalendarView('day');
                                  }}
                                  className={cn(
                                    'min-h-[170px] rounded-[1.5rem] border p-4 text-left transition',
                                    isToday
                                      ? 'border-blue-300 bg-blue-50/70 shadow-lg shadow-blue-100'
                                      : 'border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50/80',
                                    !isCurrentMonth && 'bg-slate-50/60 text-slate-400'
                                  )}
                                >
                                  <div className="flex items-center justify-between">
                                    <span className="text-sm font-semibold">{day.getDate()}</span>
                                    {dayEvents.length ? (
                                      <span className="rounded-full bg-slate-900 px-2 py-0.5 text-[11px] font-semibold text-white">
                                        {dayEvents.length}
                                      </span>
                                    ) : null}
                                  </div>
                                  <div className="mt-4 space-y-2">
                                    {dayEvents.slice(0, 3).map((event) => (
                                      <div
                                        key={event.id}
                                        className="rounded-2xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-700"
                                      >
                                        <p className="font-semibold">{event.leadName}</p>
                                        <p className="mt-1 truncate">
                                          {event.scheduledAt.toLocaleTimeString([], {
                                            hour: '2-digit',
                                            minute: '2-digit',
                                          })}
                                        </p>
                                      </div>
                                    ))}
                                  </div>
                                </button>
                              );
                            })}
                          </div>
                        </div>
                      ) : null}

                      {calendarView === 'week' ? (
                        <div className="grid gap-4 xl:grid-cols-7">
                          {weekRange.map((day) => {
                            const dayEvents = visibleCalendarEvents.filter((event) =>
                              isSameDay(event.scheduledAt, day)
                            );

                            return (
                              <div
                                key={day.toISOString()}
                                className="rounded-[1.5rem] border border-slate-200 bg-slate-50/70 p-4"
                              >
                                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">
                                  {formatWeekday(day)}
                                </p>
                                <p className="mt-1 text-lg font-semibold text-slate-950">
                                  {day.getDate()}
                                </p>
                                <div className="mt-4 space-y-3">
                                  {dayEvents.length ? (
                                    dayEvents.map((event) => (
                                      <div
                                        key={event.id}
                                        className="rounded-2xl border border-slate-200 bg-white px-3 py-3"
                                      >
                                        <p className="text-sm font-semibold text-slate-900">
                                          {event.leadName}
                                        </p>
                                        <p className="mt-1 text-xs text-slate-500">
                                          {event.scheduledAt.toLocaleTimeString([], {
                                            hour: '2-digit',
                                            minute: '2-digit',
                                          })}{' '}
                                          • {event.counsellorName}
                                        </p>
                                      </div>
                                    ))
                                  ) : (
                                    <SmallListEmpty title="No events" />
                                  )}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      ) : null}

                      {calendarView === 'day' ? (
                        visibleCalendarEvents.length ? (
                          <div className="space-y-3">
                            {visibleCalendarEvents.map((event) => (
                              <div
                                key={event.id}
                                className="rounded-[1.5rem] border border-slate-200 bg-slate-50/70 p-4"
                              >
                                <p className="font-semibold text-slate-900">{event.leadName}</p>
                                <p className="mt-1 text-sm text-slate-500">
                                  {formatDateTime(event.scheduledAt)} • {event.counsellorName}
                                </p>
                                <p className="mt-2 text-sm text-slate-500">{event.note}</p>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <EmptyState
                            title="No calendar items for this day"
                            description="Switch to another date or choose the list view to see upcoming events."
                          />
                        )
                      ) : null}

                      {calendarView === 'list' ? (
                        visibleCalendarEvents.length ? (
                          <div className="space-y-3">
                            {visibleCalendarEvents.map((event) => (
                              <div
                                key={event.id}
                                className="rounded-[1.5rem] border border-slate-200 bg-slate-50/70 p-4"
                              >
                                <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                                  <div>
                                    <p className="font-semibold text-slate-900">{event.leadName}</p>
                                    <p className="mt-1 text-sm text-slate-500">
                                      {formatDateTime(event.scheduledAt)} • {event.counsellorName}
                                    </p>
                                  </div>
                                  <Link
                                    href={`/tenant/leads/${event.leadId}`}
                                    className="ds-button-secondary"
                                  >
                                    Open lead
                                  </Link>
                                </div>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <EmptyState
                            title="No data available"
                            description="There are no follow-up events to show in the list view."
                          />
                        )
                      ) : null}
                    </div>
                  </DataTableSurface>

                  {canViewTeamPanels ? (
                    <div className="grid gap-6 xl:grid-cols-[1.15fr_0.85fr]">
                      <DataTableSurface>
                        <SectionHeader
                          eyebrow="Team Performance"
                          title="Counsellor follow-up summary"
                          description="Completion and open workload by counsellor, using the existing dashboard summary API."
                        />
                        {summary.byCounsellor?.length ? (
                          <div className="ds-table-wrap mt-6">
                            <table className="ds-table min-w-[720px]">
                              <thead>
                                <tr>
                                  <th>Counsellor</th>
                                  <th>Pending</th>
                                  <th>Overdue</th>
                                  <th>Due Today</th>
                                  <th>Completed Today</th>
                                </tr>
                              </thead>
                              <tbody>
                                {summary.byCounsellor.map((row) => (
                                  <tr key={row.counsellorId || row.counsellorName}>
                                    <td className="font-semibold text-slate-900">
                                      {row.counsellorName}
                                    </td>
                                    <td>{row.pending}</td>
                                    <td>{row.overdue}</td>
                                    <td>{row.dueToday}</td>
                                    <td>{row.completedToday}</td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        ) : (
                          <EmptyState
                            title="No recent activity"
                            description="Counsellor performance rows will appear once follow-ups are assigned and completed."
                          />
                        )}
                        {stats ? (
                          <InlineStats
                            className="mt-6"
                            items={[
                              {
                                label: 'Revenue',
                                value: `USD ${Number(stats.revenue || 0).toLocaleString()}`,
                              },
                              { label: 'Branches', value: stats.totalBranches || 0 },
                              {
                                label: 'Pending Transfers',
                                value: stats.pendingTransfers || 0,
                              },
                              {
                                label: 'Pending Commissions',
                                value: stats.pendingCommissions || 0,
                              },
                            ]}
                          />
                        ) : null}
                      </DataTableSurface>

                      <SectionCard>
                        <SectionHeader
                          eyebrow="Pipeline Attention"
                          title="Leads needing action"
                          description="Admin visibility for uncovered leads and overdue contact risk."
                        />
                        <div className="mt-6 space-y-4">
                          <div className="rounded-[1.5rem] border border-slate-200 bg-slate-50/80 p-4">
                            <div className="flex items-center justify-between gap-3">
                              <p className="font-semibold text-slate-900">No future follow-up</p>
                              <StatusPill tone="pending">
                                {summary.counts.leadsWithoutFutureFollowUp}
                              </StatusPill>
                            </div>
                            <MiniTimelineList
                              items={(summary.leadsWithoutFutureFollowUp || []).map((lead) => ({
                                id: lead._id,
                                title: lead.leadName,
                                helper: lead.phone || lead.email || 'No contact info',
                              }))}
                              emptyText="All active leads are covered."
                              formatHelper={(item) => item.helper}
                            />
                          </div>
                          <div className="rounded-[1.5rem] border border-slate-200 bg-slate-50/80 p-4">
                            <div className="flex items-center justify-between gap-3">
                              <p className="font-semibold text-slate-900">Overdue for contact</p>
                              <StatusPill tone="overdue">
                                {summary.counts.leadsOverdueForContact}
                              </StatusPill>
                            </div>
                            <MiniTimelineList
                              items={(summary.leadsOverdueForContact || []).map((lead) => ({
                                id: lead._id,
                                title: lead.leadName,
                                helper: lead.lastContactedAt
                                  ? `Last contacted ${formatDateTime(lead.lastContactedAt)}`
                                  : 'No recorded contact yet',
                              }))}
                              emptyText="No leads are overdue for contact."
                              formatHelper={(item) => item.helper}
                            />
                          </div>
                        </div>
                      </SectionCard>
                    </div>
                  ) : null}
                </div>

                <div className="space-y-6">
                  <SectionCard>
                    <SectionHeader eyebrow="Key Highlights" title="Alerts and notable updates" />
                    {widgetLoading ? (
                      <SecondaryPanelLoader />
                    ) : (
                      <MiniTimelineList
                        items={keyHighlights}
                        emptyText="No recent activity."
                        formatHelper={(item) => item.helper}
                      />
                    )}
                  </SectionCard>

                  <SectionCard>
                    <SectionHeader eyebrow="Reminder" title="Reminder widget" />
                    {widgetLoading ? (
                      <SecondaryPanelLoader />
                    ) : (
                      <MiniTimelineList
                        items={reminderItems.map((item) => ({
                          id: item._id,
                          title: item.title || item.message || 'Reminder',
                          helper: formatDateTime(item.createdAt),
                        }))}
                        emptyText="No reminders found."
                        formatHelper={(item) => item.helper}
                      />
                    )}
                  </SectionCard>

                  <SectionCard>
                    <SectionHeader eyebrow="Tasks" title="Today&apos;s tasks" />
                    <MiniTimelineList
                      items={taskItems.map((task) => ({
                        id: task._id,
                        title: task.leadName,
                        helper: `${formatDateTime(task.scheduledAt)} • ${getFollowUpNote(task)}`,
                      }))}
                      emptyText="No tasks scheduled for today."
                      formatHelper={(item) => item.helper}
                    />
                  </SectionCard>
                </div>
              </div>

              <div className="grid gap-6 xl:grid-cols-3">
                <SectionCard>
                  <SectionHeader eyebrow="Upcoming Birthdays" title="People updates" />
                  <div className="mt-6 space-y-3">
                    {widgetLoading ? (
                      <SecondaryPanelLoader />
                    ) : birthdays.length ? (
                      birthdays.map((birthday) => (
                        <div
                          key={birthday.id}
                          className="flex items-center gap-4 rounded-[1.5rem] border border-slate-200 bg-slate-50/80 p-4"
                        >
                          <div className="min-w-[64px] rounded-2xl bg-white px-3 py-2 text-center shadow-sm">
                            <p className="text-xl font-semibold text-slate-950">
                              {birthday.upcomingOn.getDate()}
                            </p>
                            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">
                              {new Intl.DateTimeFormat('en-US', { month: 'short' }).format(
                                birthday.upcomingOn
                              )}
                            </p>
                          </div>
                          <div>
                            <p className="font-semibold text-slate-900">{birthday.name}</p>
                            <p className="mt-1 text-sm text-slate-500">
                              {birthday.role}
                              {birthday.branchName ? ` • ${birthday.branchName}` : ''}
                            </p>
                          </div>
                        </div>
                      ))
                    ) : (
                      <SmallListEmpty title="No birthdays available yet." />
                    )}
                  </div>
                </SectionCard>

                <SectionCard>
                  <SectionHeader eyebrow="On Leave Today" title="Team availability" />
                  <div className="mt-6">
                    <SmallListEmpty title="No leave data is connected to this workspace yet." />
                  </div>
                </SectionCard>

                <SectionCard>
                  <SectionHeader eyebrow="Join Anniversaries" title="Team milestones" />
                  <div className="mt-6 space-y-3">
                    {widgetLoading ? (
                      <SecondaryPanelLoader />
                    ) : joinAnniversaries.length ? (
                      joinAnniversaries.map((item) => (
                        <div
                          key={item.id}
                          className="flex items-center gap-4 rounded-[1.5rem] border border-slate-200 bg-slate-50/80 p-4"
                        >
                          <div className="rounded-2xl bg-white px-3 py-2 text-center shadow-sm">
                            <p className="text-xl font-semibold text-slate-950">
                              {item.upcomingOn.getDate()}
                            </p>
                            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">
                              {new Intl.DateTimeFormat('en-US', { month: 'short' }).format(
                                item.upcomingOn
                              )}
                            </p>
                          </div>
                          <div>
                            <p className="font-semibold text-slate-900">{item.name}</p>
                            <p className="mt-1 text-sm text-slate-500">{item.label}</p>
                          </div>
                        </div>
                      ))
                    ) : (
                      <SmallListEmpty title="No join anniversaries are available." />
                    )}
                  </div>
                </SectionCard>
              </div>
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
