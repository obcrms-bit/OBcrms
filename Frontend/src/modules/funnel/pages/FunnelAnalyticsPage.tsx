'use client';

import { useEffect, useState } from 'react';
import AppShell from '@/components/app/app-shell';
import { ErrorState, LoadingState } from '@/components/app/shared';
import { funnelAPI } from '@/src/services/api';
import FunnelAnalyticsPanel from '../components/FunnelAnalyticsPanel';

export default function FunnelAnalyticsPage() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [analytics, setAnalytics] = useState<any>(null);

  useEffect(() => {
    let active = true;

    const loadAnalytics = async () => {
      setLoading(true);
      setError('');

      try {
        const response = await funnelAPI.getAnalytics();
        if (!active) {
          return;
        }
        setAnalytics(response.data?.data || null);
      } catch (requestError: any) {
        if (active) {
          setError(
            requestError?.response?.data?.message ||
              requestError?.message ||
              'Failed to load Funnel analytics.'
          );
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    };

    loadAnalytics();
    return () => {
      active = false;
    };
  }, []);

  return (
    <AppShell
      title="Funnel Analytics"
      description="Track stage performance, conversion, branch execution, assignee output, stage aging, source quality, and loss patterns."
    >
      {loading ? <LoadingState label="Loading Funnel analytics..." /> : null}
      {!loading && error ? <ErrorState message={error} /> : null}
      {!loading && !error && analytics ? <FunnelAnalyticsPanel analytics={analytics} /> : null}
    </AppShell>
  );
}
