'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { AlertTriangle, ShieldCheck, Sparkles } from 'lucide-react';
import { useTenantStore } from '@/src/stores/AppDataStore';
import { superAdminAPI } from '@/src/services/api';
import {
  ChartCard,
  EmptyResultsState,
  InsightCard,
  KpiCard,
  LoadingPanel,
  PageHeading,
  ProgressBar,
  StatusBadge,
} from '../components/platform-ui';
import type { PlatformImportBatchRecord } from '../platform.types';
import {
  buildDashboardModel,
  buildPlatformTenantDataset,
  mapImportBatchToRecord,
} from '../platform.utils';

export default function PlatformAiInsightsPage() {
  const { overview, tenants, loadingOverview, loadingTenants, loadOverview, loadTenants } =
    useTenantStore();
  const [imports, setImports] = useState<PlatformImportBatchRecord[]>([]);
  const [loadingImports, setLoadingImports] = useState(false);

  const loadInsights = useCallback(async () => {
    setLoadingImports(true);
    await Promise.all([
      loadOverview().catch(() => null),
      loadTenants({}).catch(() => null),
      superAdminAPI
        .getImportLogs({ limit: 24 })
        .then((response) =>
          setImports((response?.data?.data?.batches || []).map(mapImportBatchToRecord))
        )
        .catch(() => setImports([])),
    ]);
    setLoadingImports(false);
  }, [loadOverview, loadTenants]);

  useEffect(() => {
    void loadInsights();
  }, [loadInsights]);

  const tenantRecords = useMemo(
    () =>
      buildPlatformTenantDataset(
        tenants?.length ? tenants : overview?.tenants || [],
        overview?.billingPlans || []
      ),
    [overview, tenants]
  );

  const model = useMemo(
    () =>
      buildDashboardModel({
        overview,
        tenants: tenantRecords,
        importBatches: imports,
      }),
    [imports, overview, tenantRecords]
  );

  if ((loadingOverview || loadingTenants || loadingImports) && !tenantRecords.length) {
    return <LoadingPanel label="Loading AI insights..." />;
  }

  const topRisk = model.aiInsights.find((item) => item.severity === 'critical');
  const quickStats = [
    {
      label: 'Critical Insights',
      value: model.aiInsights.filter((item) => item.severity === 'critical').length,
      helper: 'Immediate intervention candidates',
      icon: AlertTriangle,
      tone: 'danger' as const,
    },
    {
      label: 'Positive Signals',
      value: model.aiInsights.filter((item) => item.severity === 'positive').length,
      helper: 'Launch-ready or high-performing tenants',
      icon: ShieldCheck,
      tone: 'success' as const,
    },
    {
      label: 'Average Health',
      value: `${model.averageHealthScore}/100`,
      helper: 'Portfolio health baseline for AI scoring',
      icon: Sparkles,
      tone: 'info' as const,
    },
  ];

  return (
    <div className="space-y-8">
      <PageHeading
        eyebrow="Platform AI Insights"
        title="Explainable portfolio signals, not fake AI fluff"
        subtitle="This workspace surfaces supervision priorities and growth opportunities from tenant health, onboarding posture, billing drift, import failures, and platform activity patterns."
        actions={
          <StatusBadge
            label={topRisk ? `Top risk: ${topRisk.title}` : 'No urgent risks'}
            tone={topRisk ? 'danger' : 'success'}
          />
        }
      />

      <section className="grid gap-4 xl:grid-cols-3">
        {quickStats.map((item) => (
          <KpiCard key={item.label} {...item} />
        ))}
      </section>

      <section className="grid gap-5 xl:grid-cols-[minmax(0,1.1fr)_minmax(340px,0.9fr)]">
        <ChartCard
          eyebrow="Insight Feed"
          title="What the platform is telling you right now"
          subtitle="Every insight is tied to observable tenant or import conditions so the platform team can act confidently."
        >
          {model.aiInsights.length ? (
            <div className="grid gap-3 xl:grid-cols-2">
              {model.aiInsights.map((insight) => (
                <InsightCard key={insight.id} {...insight} />
              ))}
            </div>
          ) : (
            <EmptyResultsState
              title="No explainable insights yet"
              description="As tenants, imports, and platform activity accumulate, this page will surface trends and risk signals automatically."
            />
          )}
        </ChartCard>

        <ChartCard
          eyebrow="Insight Matrix"
          title="Portfolio posture by severity"
          subtitle="A quick read on how much of the portfolio is healthy, watch-level, or critical."
        >
          <div className="space-y-4">
            {model.healthDistribution.map((item, index) => (
              <div key={item.label}>
                <div className="flex items-center justify-between gap-3">
                  <p className="text-sm font-semibold text-slate-950 dark:text-slate-50">
                    {item.label}
                  </p>
                  <p className="text-sm font-semibold text-slate-500 dark:text-slate-400">
                    {item.value}
                  </p>
                </div>
                <ProgressBar
                  className="mt-3"
                  value={(item.value / Math.max(model.tenants.length, 1)) * 100}
                  tone={index === 0 ? 'success' : index === 1 ? 'warning' : 'danger'}
                />
              </div>
            ))}
          </div>
        </ChartCard>
      </section>

      <section className="grid gap-5 xl:grid-cols-2">
        <ChartCard
          eyebrow="AI Coverage"
          title="What powers the insight engine"
          subtitle="Signals currently feeding the platform insight layer."
        >
          <div className="grid gap-3 md:grid-cols-2">
            {[
              {
                label: 'Tenant health',
                value: `${model.averageHealthScore}/100`,
                helper: 'Derived from warnings, billing status, and readiness',
              },
              {
                label: 'Onboarding queue',
                value: String(model.onboardingInProgress + model.activeImports),
                helper: 'Tenants and import batches still in setup',
              },
              {
                label: 'Critical issues',
                value: String(model.criticalIssues),
                helper: 'Billing, suspension, import, or adoption risk',
              },
              {
                label: 'Recent platform events',
                value: String(model.activityFeed.length),
                helper: 'Audit and import signals used for context',
              },
            ].map((item) => (
              <div
                key={item.label}
                className="rounded-[22px] border border-slate-200/80 bg-slate-50/85 p-4 dark:border-slate-800 dark:bg-slate-900/70"
              >
                <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500 dark:text-slate-400">
                  {item.label}
                </p>
                <p className="mt-3 text-2xl font-semibold tracking-[-0.04em] text-slate-950 dark:text-slate-50">
                  {item.value}
                </p>
                <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">{item.helper}</p>
              </div>
            ))}
          </div>
        </ChartCard>

        <ChartCard
          eyebrow="Usage Note"
          title="How to use these insights"
          subtitle="Treat insights as prioritization guidance for platform review, not autonomous action."
        >
          <div className="space-y-3">
            {[
              'Use critical insights to open alerts, billing, or onboarding work first.',
              'Use positive insights to identify launch-ready tenants and repeatable setup patterns.',
              'Use watch-level insights to intervene before support escalations build up.',
              'Pair this page with tenant drawers and audit logs for final operator judgment.',
            ].map((item) => (
              <div
                key={item}
                className="rounded-[20px] border border-slate-200/80 bg-slate-50/85 p-4 text-sm leading-6 text-slate-600 dark:border-slate-800 dark:bg-slate-900/70 dark:text-slate-300"
              >
                <div className="flex items-start gap-3">
                  <div className="mt-1 flex h-8 w-8 items-center justify-center rounded-2xl bg-slate-950 text-white dark:bg-slate-100 dark:text-slate-950">
                    <Sparkles className="h-4 w-4" />
                  </div>
                  <p>{item}</p>
                </div>
              </div>
            ))}
          </div>
        </ChartCard>
      </section>
    </div>
  );
}
