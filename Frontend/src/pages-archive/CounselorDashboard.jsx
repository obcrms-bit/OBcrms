import React, { useCallback, useEffect, useState } from 'react';
import { AlertCircle, CalendarClock, CheckCircle, ClipboardList } from 'lucide-react';
import DashboardLayout from '../components/Layout/DashboardLayout';
import StatsCard from '../components/Dashboard/StatsCard';
import { leadAPI } from '../services/api';

const formatDateTime = (value) => {
  if (!value) {
    return 'Not scheduled';
  }

  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? 'Invalid date' : date.toLocaleString();
};

const CounselorDashboard = () => {
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const loadDashboard = useCallback(async () => {
    setLoading(true);
    setError('');

    try {
      const response = await leadAPI.getFollowUpSummary();
      setSummary(response.data?.data || null);
    } catch (requestError) {
      console.error('Failed to load counselor dashboard:', requestError);
      setSummary(null);
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

  const renderList = (items, emptyText) => {
    if (!items.length) {
      return <p className="text-sm text-gray-500">{emptyText}</p>;
    }

    return (
      <div className="space-y-3">
        {items.map((item) => (
          <div key={item._id} className="rounded-xl border border-gray-100 p-4">
            <p className="text-sm font-semibold text-gray-900">{item.leadName}</p>
            <p className="mt-1 text-sm text-gray-500">
              {item.mobile || item.phone || item.email || 'No contact info'}
            </p>
            <p className="mt-2 text-xs font-semibold uppercase tracking-wider text-gray-400">
              {formatDateTime(item.scheduledAt || item.nextFollowUp || item.lastContactedAt)}
            </p>
          </div>
        ))}
      </div>
    );
  };

  return (
    <DashboardLayout>
      <div className="space-y-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">My Dashboard</h1>
          <p className="text-gray-600 mt-2">
            Track your real follow-up workload and lead coverage from the live CRM.
          </p>
        </div>

        {loading ? (
          <div className="card p-8 text-center text-gray-600">Loading dashboard...</div>
        ) : null}

        {!loading && error ? (
          <div className="card p-6 border border-red-100 bg-red-50">
            <p className="text-sm font-semibold text-red-700">{error}</p>
          </div>
        ) : null}

        {!loading && !error ? (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
              <StatsCard
                title="Due Today"
                value={counts.dueToday || 0}
                icon={CalendarClock}
                color="primary"
                description="Follow-ups scheduled today"
              />
              <StatsCard
                title="Overdue"
                value={counts.overdue || 0}
                icon={AlertCircle}
                color="danger"
                description="Follow-ups needing urgent action"
              />
              <StatsCard
                title="Pending"
                value={counts.pending || 0}
                icon={ClipboardList}
                color="warning"
                description="Open follow-up tasks"
              />
              <StatsCard
                title="Completed Today"
                value={counts.completedToday || 0}
                icon={CheckCircle}
                color="success"
                description="Follow-ups completed today"
              />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2">
                <div className="card p-6">
                  <h2 className="text-xl font-bold text-gray-900">Today&apos;s Follow-ups</h2>
                  <div className="mt-6">
                    {renderList(
                      summary?.todayFollowUps || [],
                      'No follow-ups found for today.'
                    )}
                  </div>
                </div>
              </div>

              <div className="space-y-6">
                <div className="card p-6">
                  <h3 className="text-lg font-bold text-gray-900 mb-4">Upcoming</h3>
                  {renderList(
                    summary?.upcomingFollowUps || [],
                    'No upcoming follow-ups scheduled.'
                  )}
                </div>

                <div className="card p-6">
                  <h3 className="text-lg font-bold text-gray-900 mb-4">
                    Leads Without Future Follow-up
                  </h3>
                  {renderList(
                    summary?.leadsWithoutFutureFollowUp || [],
                    'No leads found.'
                  )}
                </div>
              </div>
            </div>
          </>
        ) : null}
      </div>
    </DashboardLayout>
  );
};

export default CounselorDashboard;
