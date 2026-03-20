'use client';

import { useEffect, useState } from 'react';
import { BellRing, CheckCheck } from 'lucide-react';
import AppShell from '@/components/app/app-shell';
import {
  EmptyState,
  ErrorState,
  LoadingState,
  StatusPill,
  formatDateTime,
} from '@/components/app/shared';
import { notificationAPI } from '@/src/services/api';
import { useDashboardStore } from '@/src/stores/AppDataStore';

export default function NotificationsPage() {
  const [actionError, setActionError] = useState('');
  const [filter, setFilter] = useState('all');
  const {
    notifications,
    notificationMeta: meta,
    loadingNotifications,
    error: storeError,
    loadNotifications: loadNotificationsStore,
  } = useDashboardStore();

  const loadNotifications = async (nextFilter = filter) => {
    try {
      setActionError('');
      await loadNotificationsStore({
        ...(nextFilter === 'unread' ? { unreadOnly: true } : {}),
        ...(nextFilter !== 'all' && nextFilter !== 'unread' ? { type: nextFilter } : {}),
        limit: 50,
      });
    } catch (requestError) {
      setActionError(
        requestError?.response?.data?.message ||
          requestError?.message ||
          'Failed to load notifications.'
      );
    }
  };

  const error = actionError || storeError;

  useEffect(() => {
    loadNotifications();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleMarkRead = async (notificationId) => {
    try {
      await notificationAPI.markRead(notificationId);
      await loadNotifications();
    } catch (requestError) {
      setActionError(
        requestError?.response?.data?.message ||
          requestError?.message ||
          'Failed to update the notification.'
      );
    }
  };

  const handleMarkAllRead = async () => {
    try {
      await notificationAPI.markAllRead();
      await loadNotifications();
    } catch (requestError) {
      setActionError(
        requestError?.response?.data?.message ||
          requestError?.message ||
          'Failed to mark all notifications as read.'
      );
    }
  };

  return (
    <AppShell
      title="Notifications"
      description="In-app operational alerts for overdue follow-ups, approvals, billing signals, and branch activity."
      actions={
        <button
          type="button"
          onClick={handleMarkAllRead}
          className="rounded-xl border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
        >
          <CheckCheck className="mr-2 inline h-4 w-4" />
          Mark all as read
        </button>
      }
    >
      {loadingNotifications ? <LoadingState label="Loading notifications..." /> : null}
      {!loadingNotifications ? (
        <div className="space-y-6">
          {error ? <ErrorState message={error} onRetry={loadNotifications} /> : null}

          <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
                  Notification Center
                </p>
                <h3 className="mt-2 text-xl font-semibold text-slate-900">
                  {meta.unreadCount || 0} unread alerts
                </h3>
              </div>
              <div className="flex flex-wrap gap-2">
                {['all', 'unread', ...meta.byType.map((item) => item._id)].map((value) => (
                  <button
                    key={value}
                    type="button"
                    onClick={() => {
                      setFilter(value);
                      loadNotifications(value);
                    }}
                    className={`rounded-full px-4 py-2 text-sm font-semibold transition ${
                      filter === value
                        ? 'bg-slate-900 text-white'
                        : 'border border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
                    }`}
                  >
                    {value === 'all'
                      ? 'All'
                      : value === 'unread'
                        ? 'Unread'
                        : String(value).replace(/_/g, ' ')}
                  </button>
                ))}
              </div>
            </div>
          </section>

          <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
            {notifications.length ? (
              <div className="space-y-4">
                {notifications.map((notification) => (
                  <div
                    key={notification._id}
                    className={`rounded-3xl border p-4 ${
                      notification.read
                        ? 'border-slate-200 bg-white'
                        : 'border-teal-200 bg-teal-50/60'
                    }`}
                  >
                    <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                      <div>
                        <div className="flex flex-wrap items-center gap-2">
                          <p className="font-semibold text-slate-900">{notification.title}</p>
                          <StatusPill tone={notification.type}>
                            {String(notification.type).replace(/_/g, ' ')}
                          </StatusPill>
                          {!notification.read ? <StatusPill tone="due_today">Unread</StatusPill> : null}
                        </div>
                        <p className="mt-2 text-sm leading-6 text-slate-600">
                          {notification.message}
                        </p>
                        <p className="mt-2 text-xs text-slate-500">
                          {formatDateTime(notification.createdAt)}
                        </p>
                      </div>
                      {!notification.read ? (
                        <button
                          type="button"
                          onClick={() => handleMarkRead(notification._id)}
                          className="rounded-xl border border-slate-200 px-3 py-2 text-sm font-semibold text-slate-700 transition hover:bg-white"
                        >
                          Mark read
                        </button>
                      ) : null}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <EmptyState
                title="No notifications"
                description="New reminder, approval, and billing events will appear here as the SaaS workspace runs."
                icon={BellRing}
              />
            )}
          </section>
        </div>
      ) : null}
    </AppShell>
  );
}
