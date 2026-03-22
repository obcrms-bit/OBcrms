'use client';

import dynamic from 'next/dynamic';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { ErrorState, LoadingState } from '@/components/app/shared';
import { intelligenceAPI } from '@/src/services/api';

const IntelligenceReportView = dynamic(
  () => import('@/components/intelligence/report-view'),
  {
    loading: () => <LoadingState label="Loading intelligence visualizations..." />,
  }
);

export default function SharedIntelligenceReportPage({ params }) {
  const [report, setReport] = useState(null);
  const [company, setCompany] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const loadReport = async () => {
    setLoading(true);
    setError('');

    try {
      const response = await intelligenceAPI.getSharedReport(params.token);
      setReport(response.data?.data?.report || null);
      setCompany(response.data?.data?.company || null);
    } catch (requestError) {
      setError(
        requestError?.response?.data?.message ||
          requestError?.message ||
          'Failed to load the shared intelligence report.'
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadReport();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [params.token]);

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-100 px-4 py-12">
        <div className="mx-auto max-w-7xl">
          <LoadingState label="Opening shared intelligence report..." />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-100 px-4 py-12">
      <div className="mx-auto max-w-7xl space-y-6">
        <Link className="ds-button inline-flex" href="/login">
          <ArrowLeft className="h-4 w-4" />
          Return to workspace login
        </Link>
        {error ? <ErrorState message={error} onRetry={loadReport} /> : null}
        {!error ? (
          <IntelligenceReportView
            report={report}
            companyName={company?.name || report?.branding?.companyName}
            shareUrl=""
          />
        ) : null}
      </div>
    </div>
  );
}
