'use client';

import dynamic from 'next/dynamic';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, Download, Sparkles } from 'lucide-react';
import AppShell from '@/components/app/app-shell';
import { ErrorState, LoadingState } from '@/components/app/shared';
import { intelligenceAPI } from '@/src/services/api';

const IntelligenceReportView = dynamic(
  () => import('@/components/intelligence/report-view'),
  {
    loading: () => <LoadingState label="Loading intelligence visualizations..." />,
  }
);

export default function IntelligenceReportDetailPage({ params }) {
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const loadReport = async () => {
    setLoading(true);
    setError('');

    try {
      const response = await intelligenceAPI.getReportById(params.id);
      setReport(response.data?.data?.report || null);
    } catch (requestError) {
      setError(
        requestError?.response?.data?.message ||
          requestError?.message ||
          'Failed to load the intelligence report.'
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadReport();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [params.id]);

  const downloadPdf = async () => {
    try {
      const response = await intelligenceAPI.downloadReportPdf(params.id);
      const blob = new Blob([response.data], { type: 'application/pdf' });
      const url = URL.createObjectURL(blob);
      const anchor = document.createElement('a');
      anchor.href = url;
      anchor.download = `${report?.title || 'company-intelligence-report'}.pdf`;
      anchor.click();
      URL.revokeObjectURL(url);
    } catch (requestError) {
      setError(
        requestError?.response?.data?.message ||
          requestError?.message ||
          'Failed to download the PDF report.'
      );
    }
  };

  const copyShareLink = async () => {
    try {
      const response = await intelligenceAPI.updateReportSharing(params.id, {
        shareEnabled: true,
      });
      const nextReport = response.data?.data?.report || report;
      setReport(nextReport);
      if (nextReport?.shareUrl) {
        await navigator.clipboard.writeText(nextReport.shareUrl);
      }
    } catch (requestError) {
      setError(
        requestError?.response?.data?.message ||
          requestError?.message ||
          'Failed to update sharing for this report.'
      );
    }
  };

  return (
    <AppShell
      title="Company Intelligence Report"
      description="Review the white-labeled report generated from the uploaded dataset and export it for client sharing."
      actions={
        <div className="flex flex-wrap gap-3">
          <Link className="ds-button" href="/intelligence">
            <ArrowLeft className="h-4 w-4" />
            Back to workspace
          </Link>
          <button className="ds-button" onClick={downloadPdf} type="button" disabled={!report}>
            <Download className="h-4 w-4" />
            Download PDF
          </button>
          <button className="ds-button-primary" onClick={copyShareLink} type="button" disabled={!report}>
            <Sparkles className="h-4 w-4" />
            Copy share link
          </button>
        </div>
      }
    >
      {loading ? <LoadingState label="Loading intelligence report..." /> : null}
      {!loading && error ? <ErrorState message={error} onRetry={loadReport} /> : null}
      {!loading && !error ? (
        <IntelligenceReportView
          report={report}
          companyName={report?.branding?.companyName}
          shareUrl={report?.shareUrl}
        />
      ) : null}
    </AppShell>
  );
}
