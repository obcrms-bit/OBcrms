'use client';

import { useEffect, useMemo, useState } from 'react';
import { BarChart3, Briefcase, DollarSign, Users } from 'lucide-react';
import AppShell from '@/components/app/app-shell';
import {
  ErrorState,
  LoadingState,
  MetricCard,
  StatusPill,
  formatCurrency,
} from '@/components/app/shared';
import { useDashboardStore } from '@/src/stores/AppDataStore';
import {
  getSelectedBranchId,
  WORKSPACE_BRANCH_EVENT,
} from '@/src/services/workspace';

export default function ReportsPage() {
  const [actionError, setActionError] = useState('');
  const [selectedBranchId, setSelectedBranchId] = useState('');
  const {
    reports: summary,
    loadingReports,
    error: storeError,
    loadReports: loadReportsStore,
  } = useDashboardStore();

  const loadReports = async (branchId = selectedBranchId) => {
    try {
      setActionError('');
      await loadReportsStore(branchId ? { branchId } : {});
    } catch (requestError) {
      setActionError(
        requestError?.response?.data?.message ||
          requestError?.message ||
          'Failed to load reports.'
      );
    }
  };

  const error = actionError || storeError;

  useEffect(() => {
    const initialBranchId = getSelectedBranchId();
    setSelectedBranchId(initialBranchId);
    loadReports(initialBranchId);

    const handleBranchChange = (event) => {
      const branchId = event?.detail?.branchId || '';
      setSelectedBranchId(branchId);
      loadReports(branchId);
    };

    window.addEventListener(WORKSPACE_BRANCH_EVENT, handleBranchChange);
    return () => {
      window.removeEventListener(WORKSPACE_BRANCH_EVENT, handleBranchChange);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const cards = useMemo(
    () => [
      {
        label: 'Total Leads',
        value: summary?.totals?.leads || 0,
        helper: `${summary?.conversionRate || 0}% conversion rate`,
        icon: Users,
        accent: 'bg-slate-900',
      },
      {
        label: 'Applications',
        value: summary?.totals?.applications || 0,
        helper: 'Active application pipeline',
        icon: Briefcase,
        accent: 'bg-sky-600',
      },
      {
        label: 'Paid Revenue',
        value: formatCurrency(summary?.totals?.paidRevenue || 0),
        helper: 'Closed revenue',
        icon: DollarSign,
        accent: 'bg-emerald-600',
      },
      {
        label: 'Outstanding',
        value: formatCurrency(summary?.totals?.outstandingRevenue || 0),
        helper: `${summary?.totals?.pendingCommissions || 0} commissions pending`,
        icon: BarChart3,
        accent: 'bg-amber-600',
      },
    ],
    [summary]
  );

  return (
    <AppShell
      title="Reports"
      description="Conversion funnel, staff performance, branch visibility, revenue, and agent outcomes for the current tenant or selected branch."
    >
      {loadingReports ? <LoadingState label="Loading reports..." /> : null}
      {!loadingReports ? (
        <div className="space-y-6">
          {error ? <ErrorState message={error} onRetry={loadReports} /> : null}

          {summary ? (
            <>
              <div className="grid gap-4 xl:grid-cols-4">
                {cards.map((card) => (
                  <MetricCard
                    key={card.label}
                    label={card.label}
                    value={card.value}
                    helper={card.helper}
                    icon={card.icon}
                    accent={card.accent}
                  />
                ))}
              </div>

              <div className="grid gap-6 xl:grid-cols-[0.9fr_1.1fr]">
                <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
                  <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
                    Conversion Funnel
                  </p>
                  <div className="mt-6 space-y-3">
                    {(summary.leadStatusFunnel || []).map((item) => (
                      <div
                        key={item.stage}
                        className="flex items-center justify-between rounded-2xl bg-slate-50 px-4 py-3"
                      >
                        <span className="text-sm font-semibold text-slate-700">
                          {String(item.stage).replace(/_/g, ' ')}
                        </span>
                        <StatusPill tone={item.stage}>{item.count}</StatusPill>
                      </div>
                    ))}
                  </div>

                  <p className="mt-8 text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
                    Application Stages
                  </p>
                  <div className="mt-4 space-y-3">
                    {(summary.applicationStages || []).map((item) => (
                      <div
                        key={item.stage}
                        className="flex items-center justify-between rounded-2xl bg-slate-50 px-4 py-3"
                      >
                        <span className="text-sm font-semibold text-slate-700">
                          {String(item.stage).replace(/_/g, ' ')}
                        </span>
                        <StatusPill tone={item.stage}>{item.count}</StatusPill>
                      </div>
                    ))}
                  </div>
                </section>

                <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
                  <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
                    Staff Performance
                  </p>
                  <div className="mt-6 overflow-x-auto">
                    <table className="w-full min-w-[620px] text-left">
                      <thead className="border-b border-slate-200 text-xs uppercase tracking-[0.2em] text-slate-500">
                        <tr>
                          <th className="pb-3">Staff</th>
                          <th className="pb-3">Leads</th>
                          <th className="pb-3">Converted</th>
                          <th className="pb-3">Overdue</th>
                          <th className="pb-3">Avg Score</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {(summary.staffPerformance || []).map((row) => (
                          <tr key={row.userId || row.name}>
                            <td className="py-4">
                              <p className="font-semibold text-slate-900">{row.name}</p>
                              <p className="text-xs text-slate-500">{row.role || 'role not set'}</p>
                            </td>
                            <td className="py-4 text-sm text-slate-600">{row.leads}</td>
                            <td className="py-4 text-sm text-slate-600">{row.converted}</td>
                            <td className="py-4 text-sm text-slate-600">{row.overdueFollowUps}</td>
                            <td className="py-4 text-sm text-slate-600">{row.avgLeadScore}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </section>
              </div>

              <div className="grid gap-6 xl:grid-cols-[1fr_1fr]">
                <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
                  <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
                    Branch Performance
                  </p>
                  <div className="mt-6 space-y-3">
                    {(summary.branchPerformance || []).map((row) => (
                      <div key={row.branchId || row.branchName} className="rounded-2xl border border-slate-200 p-4">
                        <div className="flex items-center justify-between gap-3">
                          <div>
                            <p className="font-semibold text-slate-900">{row.branchName}</p>
                            <p className="mt-1 text-sm text-slate-500">
                              {row.leads} leads, {row.converted} converted
                            </p>
                          </div>
                          <div className="flex flex-wrap gap-2">
                            <StatusPill tone="overdue">{row.overdueFollowUps} overdue</StatusPill>
                            <StatusPill tone="pending">{row.avgAgingDays}d aging</StatusPill>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </section>

                <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
                  <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
                    Agent Performance
                  </p>
                  <div className="mt-6 space-y-3">
                    {(summary.agentPerformance || []).map((row) => (
                      <div key={row.agentId || row.name} className="rounded-2xl border border-slate-200 p-4">
                        <div className="flex items-center justify-between gap-3">
                          <div>
                            <p className="font-semibold text-slate-900">{row.name}</p>
                            <p className="mt-1 text-sm text-slate-500">
                              {row.submissions} submissions, {row.converted} converted
                            </p>
                          </div>
                          <div className="text-right">
                            <p className="text-sm font-semibold text-slate-900">
                              {formatCurrency(row.totalCommission || 0)}
                            </p>
                            <p className="mt-1 text-xs text-slate-500">
                              Pending {formatCurrency(row.pendingCommission || 0)}
                            </p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </section>
              </div>

              <div className="grid gap-6 xl:grid-cols-[0.95fr_1.05fr]">
                <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
                  <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
                    Source Performance
                  </p>
                  <div className="mt-6 space-y-3">
                    {(summary.sourcePerformance || []).map((item) => (
                      <div
                        key={item.sourceType}
                        className="flex items-center justify-between rounded-2xl bg-slate-50 px-4 py-3"
                      >
                        <div>
                          <p className="font-semibold text-slate-900">
                            {String(item.sourceType).replace(/_/g, ' ')}
                          </p>
                          <p className="text-xs text-slate-500">
                            {item.converted} converted
                          </p>
                        </div>
                        <StatusPill tone="pending">{item.count}</StatusPill>
                      </div>
                    ))}
                  </div>
                </section>

                <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
                  <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
                    Public Capture
                  </p>
                  <div className="mt-6 grid gap-4 md:grid-cols-2">
                    <div className="rounded-2xl bg-slate-50 p-4">
                      <p className="text-sm font-semibold text-slate-900">
                        {summary.publicCapture?.forms || 0} forms
                      </p>
                      <p className="mt-1 text-sm text-slate-500">
                        {summary.publicCapture?.formViews || 0} views / {summary.publicCapture?.formSubmissions || 0} submissions
                      </p>
                    </div>
                    <div className="rounded-2xl bg-slate-50 p-4">
                      <p className="text-sm font-semibold text-slate-900">
                        {summary.publicCapture?.qrCodes || 0} QR codes
                      </p>
                      <p className="mt-1 text-sm text-slate-500">
                        {summary.publicCapture?.qrScans || 0} scans / {summary.publicCapture?.qrSubmissions || 0} submissions
                      </p>
                    </div>
                  </div>
                </section>
              </div>
            </>
          ) : null}
        </div>
      ) : null}
    </AppShell>
  );
}
