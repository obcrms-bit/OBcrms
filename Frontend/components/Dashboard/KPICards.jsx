'use client';

import { useCallback, useEffect, useState } from 'react';
import {
  AlertCircle,
  CalendarClock,
  ClipboardList,
  DollarSign,
  FileText,
  GraduationCap,
  Users,
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { dashboardAPI, leadAPI } from '@/services/api';

const formatMetricValue = (value, formatter) => {
  if (typeof formatter === 'function') {
    return formatter(value);
  }

  const numericValue = Number(value ?? 0);
  return Number.isFinite(numericValue) ? numericValue.toLocaleString() : '0';
};

export default function KPICards() {
  const [kpiData, setKpiData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchKPIData = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const [statsResponse, followUpResponse] = await Promise.all([
        dashboardAPI.getDashboardStats(),
        leadAPI.getFollowUpSummary(),
      ]);

      const stats = statsResponse.data?.data || {};
      const summary = followUpResponse.data?.data || {};
      const counts = summary.counts || {};

      setKpiData([
        {
          title: 'Leads',
          value: formatMetricValue(stats.totalLeads),
          helper: 'Total CRM leads',
          icon: FileText,
        },
        {
          title: 'Students',
          value: formatMetricValue(stats.totalStudents),
          helper: 'Active student records',
          icon: GraduationCap,
        },
        {
          title: 'Applications',
          value: formatMetricValue(stats.totalApplications),
          helper: 'Open and submitted applications',
          icon: ClipboardList,
        },
        {
          title: 'Revenue',
          value: formatMetricValue(
            stats.revenue,
            (amount) =>
              new Intl.NumberFormat('en-US', {
                style: 'currency',
                currency: 'USD',
                maximumFractionDigits: 0,
              }).format(Number(amount || 0))
          ),
          helper: 'Paid invoice revenue',
          icon: DollarSign,
        },
        {
          title: 'Due Today',
          value: formatMetricValue(counts.dueToday),
          helper: 'Follow-ups scheduled today',
          icon: CalendarClock,
        },
        {
          title: 'Overdue',
          value: formatMetricValue(counts.overdue),
          helper: 'Follow-ups that missed schedule',
          icon: AlertCircle,
        },
      ]);
    } catch (error) {
      console.error('Error fetching KPI data:', error);
      setKpiData([]);
      setError(
        error?.response?.data?.message ||
          error?.message ||
          'Failed to load dashboard metrics.'
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchKPIData();
  }, [fetchKPIData]);

  if (loading) {
    return (
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        {Array(6)
          .fill(0)
          .map((_, i) => (
            <Card key={i}>
              <CardContent className="p-4">
                <div className="animate-pulse">
                  <div className="h-4 bg-gray-200 rounded mb-2"></div>
                  <div className="h-8 bg-gray-200 rounded mb-2"></div>
                  <div className="h-3 bg-gray-200 rounded"></div>
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
        <CardContent className="p-4">
          <div className="flex flex-col gap-3">
            <div>
              <p className="text-sm font-semibold text-gray-900">Dashboard metrics</p>
              <p className="mt-1 text-sm text-gray-600">{error}</p>
            </div>
            <button
              type="button"
              onClick={fetchKPIData}
              className="w-fit rounded-lg bg-slate-900 px-3 py-2 text-sm font-semibold text-white transition hover:bg-slate-800"
            >
              Retry
            </button>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!kpiData.length) {
    return (
      <Card>
        <CardContent className="p-4">
          <p className="text-sm font-semibold text-gray-900">No data available</p>
          <p className="mt-1 text-sm text-gray-600">
            Dashboard metrics will appear here when backend data is available.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
      {kpiData.map((kpi) => (
        <Card key={kpi.title}>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-300">
                  {kpi.title}
                </p>
                <p className="text-2xl font-bold">{kpi.value}</p>
                <p className="text-xs text-gray-500">{kpi.helper}</p>
              </div>
              <kpi.icon className="h-8 w-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
