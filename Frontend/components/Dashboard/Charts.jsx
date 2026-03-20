'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';
import { Bar, Doughnut } from 'react-chartjs-2';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { reportAPI } from '@/services/api';

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend
);

const CHART_COLORS = [
  '#2563EB',
  '#0EA5E9',
  '#14B8A6',
  '#10B981',
  '#84CC16',
  '#F59E0B',
  '#F97316',
  '#EF4444',
  '#8B5CF6',
  '#EC4899',
];

const chartOptions = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: {
      display: true,
      position: 'bottom',
    },
  },
};

const formatStageLabel = (value) =>
  String(value || 'Unassigned')
    .replace(/_/g, ' ')
    .replace(/\b\w/g, (char) => char.toUpperCase());

function ChartPanel({ title, error, loading, hasData, children, onRetry }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-72">
          {loading ? (
            <div className="flex h-full items-center justify-center text-sm text-gray-500">
              Loading chart...
            </div>
          ) : null}

          {!loading && error ? (
            <div className="flex h-full flex-col items-center justify-center gap-3 text-center">
              <p className="text-sm text-gray-600">{error}</p>
              <button
                type="button"
                onClick={onRetry}
                className="rounded-lg bg-slate-900 px-3 py-2 text-sm font-semibold text-white transition hover:bg-slate-800"
              >
                Retry
              </button>
            </div>
          ) : null}

          {!loading && !error && !hasData ? (
            <div className="flex h-full items-center justify-center text-sm text-gray-500">
              No data available
            </div>
          ) : null}

          {!loading && !error && hasData ? children : null}
        </div>
      </CardContent>
    </Card>
  );
}

export default function Charts() {
  const [reports, setReports] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const loadCharts = useCallback(async () => {
    setLoading(true);
    setError('');

    try {
      const response = await reportAPI.getSummary();
      setReports(response.data?.data || null);
    } catch (requestError) {
      console.error('Failed to load chart data:', requestError);
      setReports(null);
      setError(
        requestError?.response?.data?.message ||
          requestError?.message ||
          'Failed to load chart data.'
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadCharts();
  }, [loadCharts]);

  const leadStageChart = useMemo(() => {
    const rows = reports?.leadStatusFunnel || [];
    if (!rows.length) {
      return null;
    }

    return {
      labels: rows.map((item) => formatStageLabel(item.stage)),
      datasets: [
        {
          label: 'Leads',
          data: rows.map((item) => item.count || 0),
          backgroundColor: CHART_COLORS.slice(0, rows.length),
        },
      ],
    };
  }, [reports]);

  const applicationStageChart = useMemo(() => {
    const rows = reports?.applicationStages || [];
    if (!rows.length) {
      return null;
    }

    return {
      labels: rows.map((item) => formatStageLabel(item.stage)),
      datasets: [
        {
          label: 'Applications',
          data: rows.map((item) => item.count || 0),
          backgroundColor: CHART_COLORS.slice(0, rows.length),
          borderWidth: 0,
        },
      ],
    };
  }, [reports]);

  const sourcePerformanceChart = useMemo(() => {
    const rows = reports?.sourcePerformance || [];
    if (!rows.length) {
      return null;
    }

    return {
      labels: rows.map((item) => formatStageLabel(item.sourceType)),
      datasets: [
        {
          label: 'Leads',
          data: rows.map((item) => item.count || 0),
          backgroundColor: '#2563EB',
        },
        {
          label: 'Converted',
          data: rows.map((item) => item.converted || 0),
          backgroundColor: '#10B981',
        },
      ],
    };
  }, [reports]);

  const branchPerformanceChart = useMemo(() => {
    const rows = reports?.branchPerformance || [];
    if (!rows.length) {
      return null;
    }

    return {
      labels: rows.map((item) => item.branchName || 'Unassigned'),
      datasets: [
        {
          label: 'Leads',
          data: rows.map((item) => item.leads || 0),
          backgroundColor: '#8B5CF6',
        },
        {
          label: 'Converted',
          data: rows.map((item) => item.converted || 0),
          backgroundColor: '#14B8A6',
        },
      ],
    };
  }, [reports]);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <ChartPanel
        title="Leads by Stage"
        loading={loading}
        error={error}
        hasData={Boolean(leadStageChart)}
        onRetry={loadCharts}
      >
        <Bar data={leadStageChart} options={chartOptions} />
      </ChartPanel>

      <ChartPanel
        title="Application Stages"
        loading={loading}
        error={error}
        hasData={Boolean(applicationStageChart)}
        onRetry={loadCharts}
      >
        <Doughnut data={applicationStageChart} options={chartOptions} />
      </ChartPanel>

      <ChartPanel
        title="Lead Sources"
        loading={loading}
        error={error}
        hasData={Boolean(sourcePerformanceChart)}
        onRetry={loadCharts}
      >
        <Bar data={sourcePerformanceChart} options={chartOptions} />
      </ChartPanel>

      <ChartPanel
        title="Branch Performance"
        loading={loading}
        error={error}
        hasData={Boolean(branchPerformanceChart)}
        onRetry={loadCharts}
      >
        <Bar data={branchPerformanceChart} options={chartOptions} />
      </ChartPanel>
    </div>
  );
}
