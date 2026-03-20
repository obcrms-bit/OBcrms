'use client';

import { useCallback, useEffect, useState } from 'react';
import {
  AlertCircle,
  Bell,
  Calendar,
  CheckSquare,
  Users,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { leadAPI, notificationAPI } from '@/services/api';

const PanelList = ({ items, emptyText, renderItem }) => {
  if (!items.length) {
    return <p className="text-sm text-gray-500">{emptyText}</p>;
  }

  return <div className="space-y-2">{items.map(renderItem)}</div>;
};

export default function Panels() {
  const [summary, setSummary] = useState(null);
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const loadPanels = useCallback(async () => {
    setLoading(true);
    setError('');

    try {
      const [summaryResponse, notificationsResponse] = await Promise.all([
        leadAPI.getFollowUpSummary(),
        notificationAPI.getNotifications({ limit: 5 }),
      ]);

      setSummary(summaryResponse.data?.data || null);
      setNotifications(notificationsResponse.data?.data?.notifications || []);
    } catch (requestError) {
      console.error('Failed to load dashboard panels:', requestError);
      setSummary(null);
      setNotifications([]);
      setError(
        requestError?.response?.data?.message ||
          requestError?.message ||
          'Failed to load dashboard panels.'
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadPanels();
  }, [loadPanels]);

  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
        {Array.from({ length: 5 }).map((_, index) => (
          <Card key={index}>
            <CardContent className="p-6">
              <div className="animate-pulse space-y-3">
                <div className="h-4 w-1/2 rounded bg-gray-200" />
                <div className="h-3 rounded bg-gray-200" />
                <div className="h-3 rounded bg-gray-200" />
                <div className="h-3 w-3/4 rounded bg-gray-200" />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="flex flex-col gap-3">
            <p className="font-semibold text-gray-900">Dashboard panels unavailable</p>
            <p className="text-sm text-gray-600">{error}</p>
            <button
              type="button"
              onClick={loadPanels}
              className="w-fit rounded-lg bg-slate-900 px-3 py-2 text-sm font-semibold text-white transition hover:bg-slate-800"
            >
              Retry
            </button>
          </div>
        </CardContent>
      </Card>
    );
  }

  const overdueFollowUps = summary?.overdueFollowUps || [];
  const todayFollowUps = summary?.todayFollowUps || [];
  const uncoveredLeads = summary?.leadsWithoutFutureFollowUp || [];
  const contactRiskLeads = summary?.leadsOverdueForContact || [];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center">
            <Bell className="h-5 w-5 mr-2" />
            Recent Activity
          </CardTitle>
        </CardHeader>
        <CardContent>
          <PanelList
            items={notifications}
            emptyText="No recent activity"
            renderItem={(notification) => (
              <div key={notification._id} className="flex items-start space-x-2">
                <Bell className="mt-0.5 h-4 w-4 text-blue-500" />
                <span className="text-sm">
                  {notification.message || notification.title || 'Notification'}
                </span>
              </div>
            )}
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center">
            <CheckSquare className="h-5 w-5 mr-2" />
            Overdue Follow-ups
          </CardTitle>
        </CardHeader>
        <CardContent>
          <PanelList
            items={overdueFollowUps.slice(0, 3)}
            emptyText="No overdue follow-ups"
            renderItem={(item) => (
              <div key={item._id} className="flex items-start space-x-2">
                <AlertCircle className="mt-0.5 h-4 w-4 text-red-500" />
                <span className="text-sm">{item.leadName}</span>
              </div>
            )}
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center">
            <Calendar className="h-5 w-5 mr-2" />
            Due Today
          </CardTitle>
        </CardHeader>
        <CardContent>
          <PanelList
            items={todayFollowUps.slice(0, 3)}
            emptyText="No tasks for today"
            renderItem={(item) => (
              <div key={item._id} className="text-sm">
                {item.leadName}
              </div>
            )}
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center">
            <Users className="h-5 w-5 mr-2" />
            No Future Follow-up
          </CardTitle>
        </CardHeader>
        <CardContent>
          <PanelList
            items={uncoveredLeads.slice(0, 3)}
            emptyText="No leads found"
            renderItem={(lead) => (
              <div key={lead._id} className="text-sm">
                {lead.leadName}
              </div>
            )}
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center">
            <AlertCircle className="h-5 w-5 mr-2" />
            Contact Risk
          </CardTitle>
        </CardHeader>
        <CardContent>
          <PanelList
            items={contactRiskLeads.slice(0, 3)}
            emptyText="No data available"
            renderItem={(lead) => (
              <div key={lead._id} className="text-sm">
                {lead.leadName}
              </div>
            )}
          />
        </CardContent>
      </Card>
    </div>
  );
}
