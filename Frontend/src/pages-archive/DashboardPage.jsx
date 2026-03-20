import React, { useCallback, useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useBranding } from '../context/BrandingContext';
import {
  AlertCircle,
  Bell,
  CalendarClock,
  DollarSign,
  FileText,
  GraduationCap,
  RefreshCw,
} from 'lucide-react';
import { dashboardAPI, leadAPI, notificationAPI } from '../services/api';

const formatDateTime = (value) => {
  if (!value) {
    return 'Not scheduled';
  }

  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? 'Invalid date' : date.toLocaleString();
};

const formatCurrency = (value) =>
  new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0,
  }).format(Number(value || 0));

const MetricCard = ({ icon: Icon, title, value, description, accent }) => (
  <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
    <div className="flex items-start justify-between gap-4">
      <div>
        <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-gray-400">
          {title}
        </p>
        <p className="mt-3 text-3xl font-black text-gray-900">{value}</p>
        <p className="mt-2 text-sm text-gray-500">{description}</p>
      </div>
      <div
        className="flex h-12 w-12 items-center justify-center rounded-2xl text-white shadow-sm"
        style={{ backgroundColor: accent }}
      >
        <Icon size={22} />
      </div>
    </div>
  </div>
);

const SectionCard = ({ title, subtitle, children, action }) => (
  <section className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
    <div className="flex items-start justify-between gap-4">
      <div>
        <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-gray-400">
          {subtitle}
        </p>
        <h2 className="mt-2 text-xl font-bold text-gray-900">{title}</h2>
      </div>
      {action}
    </div>
    <div className="mt-6">{children}</div>
  </section>
);

const EmptyBlock = ({ title, text }) => (
  <div className="rounded-2xl border border-dashed border-gray-200 bg-gray-50 px-5 py-8 text-center">
    <p className="text-base font-semibold text-gray-900">{title}</p>
    <p className="mt-2 text-sm text-gray-500">{text}</p>
  </div>
);

const FollowUpRows = ({ items, emptyTitle, emptyText, highlightColor }) => {
  if (!items.length) {
    return <EmptyBlock title={emptyTitle} text={emptyText} />;
  }

  return (
    <div className="space-y-3">
      {items.map((item) => (
        <div key={item._id} className="rounded-2xl border border-gray-100 p-4">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <p className="text-sm font-bold text-gray-900">{item.leadName}</p>
              <p className="mt-1 text-sm text-gray-500">
                {item.mobile || item.phone || item.email || 'No contact information'}
              </p>
              <p className="mt-2 text-xs font-semibold uppercase tracking-wider text-gray-400">
                {formatDateTime(item.scheduledAt)}
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <span
                className="rounded-full px-3 py-1 text-xs font-bold uppercase tracking-wide text-white"
                style={{ backgroundColor: highlightColor }}
              >
                {String(item.urgency || item.status || '').replace(/_/g, ' ')}
              </span>
              {item.branchName ? (
                <span className="rounded-full bg-gray-100 px-3 py-1 text-xs font-semibold text-gray-600">
                  {item.branchName}
                </span>
              ) : null}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

const NotificationRows = ({ items }) => {
  if (!items.length) {
    return (
      <EmptyBlock
        title="No recent activity"
        text="Notifications and workflow events will appear here when the backend records them."
      />
    );
  }

  return (
    <div className="space-y-3">
      {items.map((notification) => (
        <div key={notification._id} className="rounded-2xl border border-gray-100 p-4">
          <p className="text-sm font-semibold text-gray-900">
            {notification.title || notification.type || 'Notification'}
          </p>
          <p className="mt-1 text-sm text-gray-600">
            {notification.message || 'No message provided'}
          </p>
          <p className="mt-2 text-xs font-semibold uppercase tracking-wider text-gray-400">
            {formatDateTime(notification.createdAt)}
          </p>
        </div>
      ))}
    </div>
  );
};

const DashboardPage = () => {
  const { user } = useAuth();
  const { branding } = useBranding();
  const [stats, setStats] = useState(null);
  const [summary, setSummary] = useState(null);
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const loadDashboard = useCallback(async () => {
    setLoading(true);
    setError('');

    try {
      const [statsResponse, summaryResponse, notificationsResponse] =
        await Promise.all([
          dashboardAPI.getDashboardStats(),
          leadAPI.getFollowUpSummary(),
          notificationAPI.getNotifications({ limit: 6 }),
        ]);

      setStats(statsResponse.data?.data || null);
      setSummary(summaryResponse.data?.data || null);
      setNotifications(notificationsResponse.data?.data?.notifications || []);
    } catch (requestError) {
      console.error('Failed to load dashboard data:', requestError);
      setStats(null);
      setSummary(null);
      setNotifications([]);
      setError(
        requestError?.response?.data?.message ||
          requestError?.message ||
          'Failed to load dashboard data.'
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadDashboard();
  }, [loadDashboard]);

  const counts = summary?.counts || {};

  return (
    <div className="space-y-6 p-2">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <h1 className="text-3xl font-black tracking-tight text-gray-900">
            Hi, {user?.name || 'Team'}!
          </h1>
          <p className="mt-2 text-sm font-medium text-gray-500">
            Welcome back to your {branding.name} workspace.
          </p>
        </div>
        <button
          type="button"
          onClick={loadDashboard}
          className="inline-flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:opacity-90"
          style={{ backgroundColor: branding.primaryColor }}
        >
          <RefreshCw size={16} />
          Refresh Dashboard
        </button>
      </div>

      {loading ? (
        <div className="rounded-2xl border border-gray-100 bg-white p-10 text-center shadow-sm">
          <p className="text-sm font-semibold text-gray-600">Loading dashboard...</p>
        </div>
      ) : null}

      {!loading && error ? (
        <div className="rounded-2xl border border-red-100 bg-red-50 p-6 shadow-sm">
          <p className="text-sm font-bold text-red-700">Unable to load dashboard</p>
          <p className="mt-2 text-sm text-red-600">{error}</p>
        </div>
      ) : null}

      {!loading && !error ? (
        <>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-6">
            <MetricCard
              icon={FileText}
              title="Active Leads"
              value={(stats?.totalLeads || 0).toLocaleString()}
              description="Tenant leads currently in CRM"
              accent="#8B5CF6"
            />
            <MetricCard
              icon={GraduationCap}
              title="Students"
              value={(stats?.totalStudents || 0).toLocaleString()}
              description="Student records available"
              accent="#F59E0B"
            />
            <MetricCard
              icon={CalendarClock}
              title="Applications"
              value={(stats?.totalApplications || 0).toLocaleString()}
              description="Applications in workflow"
              accent="#2563EB"
            />
            <MetricCard
              icon={DollarSign}
              title="Revenue"
              value={formatCurrency(stats?.revenue || 0)}
              description="Paid invoice revenue"
              accent="#10B981"
            />
            <MetricCard
              icon={CalendarClock}
              title="Due Today"
              value={(counts.dueToday || 0).toLocaleString()}
              description="Follow-ups scheduled today"
              accent={branding.primaryColor}
            />
            <MetricCard
              icon={AlertCircle}
              title="Overdue"
              value={(counts.overdue || 0).toLocaleString()}
              description="Follow-ups that need attention"
              accent="#EF4444"
            />
          </div>

          <div className="grid gap-6 xl:grid-cols-[1.25fr_0.75fr]">
            <SectionCard title="Today's Follow-ups" subtitle="Follow-up Queue">
              <FollowUpRows
                items={summary?.todayFollowUps || []}
                emptyTitle="No follow-ups found"
                emptyText="There are no follow-ups due today."
                highlightColor={branding.primaryColor}
              />
            </SectionCard>

            <SectionCard title="Recent Activity" subtitle="Notifications">
              <NotificationRows items={notifications} />
            </SectionCard>
          </div>

          <div className="grid gap-6 xl:grid-cols-2">
            <SectionCard title="Overdue Follow-ups" subtitle="Needs Action">
              <FollowUpRows
                items={summary?.overdueFollowUps || []}
                emptyTitle="No data available"
                emptyText="There are no overdue follow-ups right now."
                highlightColor="#EF4444"
              />
            </SectionCard>

            <SectionCard title="Leads Without Future Follow-up" subtitle="Coverage Gaps">
              <FollowUpRows
                items={summary?.leadsWithoutFutureFollowUp || []}
                emptyTitle="No leads found"
                emptyText="Every active lead currently has a future follow-up scheduled."
                highlightColor="#0EA5E9"
              />
            </SectionCard>
          </div>
        </>
      ) : null}
    </div>
  );
};

export default DashboardPage;
