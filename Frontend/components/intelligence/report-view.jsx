'use client';

import {
  AlertTriangle,
  ArrowUpRight,
  BadgeCheck,
  BarChart3,
  ClipboardList,
  LineChart as LineChartIcon,
  TrendingUp,
} from 'lucide-react';
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { SectionCard, SectionHeader, InlineStats } from '@/components/app/design-system';
import {
  EmptyState,
  StatusPill,
  formatCurrency,
} from '@/components/app/shared';

const insightTone = (priority) => {
  if (priority === 'high') return 'overdue';
  if (priority === 'low') return 'completed';
  return 'pending';
};

const PIE_COLORS = ['#0f766e', '#0ea5e9', '#f59e0b', '#8b5cf6', '#ef4444'];

function InsightList({ title, description, icon: Icon, items, emptyTitle }) {
  return (
    <SectionCard>
      <SectionHeader
        eyebrow="Analysis"
        title={title}
        description={description}
      />
      {items?.length ? (
        <div className="mt-6 space-y-4">
          {items.map((item, index) => (
            <article
              key={`${item.title}-${index}`}
              className="rounded-[1.25rem] border border-slate-200 bg-slate-50 p-4"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex min-w-0 items-start gap-3">
                  <div className="rounded-2xl bg-white p-2 text-slate-600 shadow-sm">
                    <Icon className="h-4 w-4" />
                  </div>
                  <div className="min-w-0">
                    <p className="font-semibold text-slate-900">{item.title}</p>
                    <p className="mt-2 text-sm leading-6 text-slate-600">{item.description}</p>
                  </div>
                </div>
                <StatusPill tone={insightTone(item.priority)}>
                  {item.priority || 'medium'}
                </StatusPill>
              </div>
            </article>
          ))}
        </div>
      ) : (
        <div className="mt-6">
          <EmptyState
            title={emptyTitle}
            description="Upload a dataset or regenerate the current report to surface structured findings here."
            icon={Icon}
          />
        </div>
      )}
    </SectionCard>
  );
}

export default function IntelligenceReportView({
  report,
  companyName,
  shareUrl,
  showActions = false,
  actions = null,
}) {
  if (!report) {
    return (
      <SectionCard>
        <EmptyState
          title="No report selected"
          description="Select an analyzed dataset to review the generated company intelligence report."
          icon={ClipboardList}
        />
      </SectionCard>
    );
  }

  const metrics = report.metrics || {};
  const charts = report.charts || {};
  const stageBreakdown = charts.stageBreakdown || [];
  const monthlyTrend = charts.monthlyTrend || [];
  const leadQualityBreakdown = charts.leadQualityBreakdown || [];

  const statItems = [
    { label: 'Records', value: metrics.totalRecords || 0, helper: 'Cleaned rows analyzed' },
    { label: 'Conversion Rate', value: `${metrics.conversionRate || 0}%`, helper: `${metrics.convertedCount || 0} converted` },
    { label: 'Revenue', value: formatCurrency(metrics.totalRevenue || 0, metrics.currency || 'USD'), helper: `Average ${formatCurrency(metrics.averageRevenue || 0, metrics.currency || 'USD')}` },
    { label: 'Data Completeness', value: `${metrics.completenessRate || 0}%`, helper: `${metrics.duplicateCount || 0} duplicates removed` },
  ];

  return (
    <div className="space-y-6">
      <SectionCard
        className="overflow-hidden"
        style={
          report.branding?.primaryColor
            ? {
                background: `linear-gradient(135deg, ${report.branding.secondaryColor || '#0f172a'} 0%, ${report.branding.primaryColor} 100%)`,
                color: 'white',
              }
            : undefined
        }
      >
        <div className="flex flex-col gap-6 xl:flex-row xl:items-start xl:justify-between">
          <div className="min-w-0">
            <p
              className="text-xs font-semibold uppercase tracking-[0.24em]"
              style={{ color: report.branding?.accentColor || '#99f6e4' }}
            >
              {companyName || report.branding?.companyName || 'Company Intelligence'}
            </p>
            <h1 className="mt-3 text-3xl font-semibold tracking-tight">
              {report.title}
            </h1>
            <p className="mt-4 max-w-3xl text-sm leading-7 text-white/80">
              {report.companyProfile?.headline || report.assistantBrief}
            </p>
            {shareUrl ? (
              <a
                className="mt-4 inline-flex items-center gap-2 text-sm font-semibold text-white/90 underline-offset-4 hover:underline"
                href={shareUrl}
                target="_blank"
                rel="noreferrer"
              >
                Open shareable report
                <ArrowUpRight className="h-4 w-4" />
              </a>
            ) : null}
          </div>
          {showActions ? <div className="flex flex-wrap gap-3">{actions}</div> : null}
        </div>
      </SectionCard>

      <InlineStats items={statItems} columns={4} />

      <div className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
        <SectionCard>
          <SectionHeader
            eyebrow="Structure"
            title="Performance Shape"
            description="Stage distribution and monthly movement inferred from the uploaded dataset."
          />
          <div className="mt-6 grid gap-6 xl:grid-cols-2">
            <div className="rounded-[1.25rem] border border-slate-200 bg-slate-50 p-4">
              <div className="mb-4 flex items-center gap-2 text-sm font-semibold text-slate-700">
                <BarChart3 className="h-4 w-4" />
                Stage Breakdown
              </div>
              {stageBreakdown.length ? (
                <div className="h-72">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={stageBreakdown}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} />
                      <XAxis dataKey="label" tick={{ fontSize: 12 }} />
                      <YAxis tick={{ fontSize: 12 }} />
                      <Tooltip />
                      <Bar dataKey="count" fill="#0f766e" radius={[10, 10, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              ) : (
                <EmptyState
                  title="No stage analytics"
                  description="Upload a pipeline-oriented dataset with stage or status fields to see this chart."
                  icon={BarChart3}
                />
              )}
            </div>

            <div className="rounded-[1.25rem] border border-slate-200 bg-slate-50 p-4">
              <div className="mb-4 flex items-center gap-2 text-sm font-semibold text-slate-700">
                <LineChartIcon className="h-4 w-4" />
                Monthly Trend
              </div>
              {monthlyTrend.length ? (
                <div className="h-72">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={monthlyTrend}>
                      <defs>
                        <linearGradient id="intelligenceTrend" x1="0" x2="0" y1="0" y2="1">
                          <stop offset="5%" stopColor="#0ea5e9" stopOpacity={0.8} />
                          <stop offset="95%" stopColor="#0ea5e9" stopOpacity={0.05} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} />
                      <XAxis dataKey="label" tick={{ fontSize: 12 }} />
                      <YAxis tick={{ fontSize: 12 }} />
                      <Tooltip />
                      <Area type="monotone" dataKey="value" stroke="#0ea5e9" fill="url(#intelligenceTrend)" />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              ) : (
                <EmptyState
                  title="No timeline analytics"
                  description="Include created date or submission date fields to unlock trend analysis."
                  icon={LineChartIcon}
                />
              )}
            </div>
          </div>
        </SectionCard>

        <SectionCard>
          <SectionHeader
            eyebrow="Executive Brief"
            title="Company Profile"
            description="A concise operating snapshot generated from the cleaned dataset."
          />
          <div className="mt-6 space-y-4">
            <article className="rounded-[1.25rem] border border-slate-200 bg-slate-50 p-4">
              <p className="text-sm font-semibold uppercase tracking-[0.2em] text-slate-500">
                Assistant Brief
              </p>
              <p className="mt-3 text-sm leading-7 text-slate-700">
                {report.assistantBrief || 'No assistant summary has been generated yet.'}
              </p>
            </article>

            <div className="grid gap-4 md:grid-cols-2">
              <article className="rounded-[1.25rem] border border-slate-200 p-4">
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
                  Strongest Source
                </p>
                <p className="mt-3 text-lg font-semibold text-slate-900">
                  {report.companyProfile?.strongestSource || 'Unknown'}
                </p>
              </article>
              <article className="rounded-[1.25rem] border border-slate-200 p-4">
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
                  Busiest Stage
                </p>
                <p className="mt-3 text-lg font-semibold text-slate-900">
                  {report.companyProfile?.busiestStage || 'Unknown'}
                </p>
              </article>
              <article className="rounded-[1.25rem] border border-slate-200 p-4">
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
                  Top Branch
                </p>
                <p className="mt-3 text-lg font-semibold text-slate-900">
                  {report.companyProfile?.topBranch || 'Unassigned'}
                </p>
              </article>
              <article className="rounded-[1.25rem] border border-slate-200 p-4">
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
                  Lead Quality
                </p>
                <div className="mt-3 h-36">
                  {leadQualityBreakdown.length ? (
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Tooltip />
                        <Pie
                          data={leadQualityBreakdown}
                          dataKey="count"
                          nameKey="label"
                          innerRadius={28}
                          outerRadius={52}
                        >
                          {leadQualityBreakdown.map((entry, index) => (
                            <Cell
                              key={`${entry.label}-${index}`}
                              fill={PIE_COLORS[index % PIE_COLORS.length]}
                            />
                          ))}
                        </Pie>
                      </PieChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="flex h-full items-center justify-center rounded-2xl bg-slate-50 text-sm text-slate-500">
                      No score distribution detected
                    </div>
                  )}
                </div>
              </article>
            </div>
          </div>
        </SectionCard>
      </div>

      <div className="grid gap-6 xl:grid-cols-2">
        <InsightList
          title="Key Insights"
          description="Signals surfaced directly from the uploaded data."
          icon={BadgeCheck}
          items={report.insights || []}
          emptyTitle="No key insights yet"
        />
        <InsightList
          title="Operational Gaps"
          description="Where the current operation appears exposed or inefficient."
          icon={AlertTriangle}
          items={report.operationalGaps || []}
          emptyTitle="No operational gaps detected"
        />
        <InsightList
          title="Recommendations"
          description="Practical actions to improve conversion, reporting, and accountability."
          icon={TrendingUp}
          items={report.recommendations || []}
          emptyTitle="No recommendations available"
        />
        <InsightList
          title="Growth Opportunities"
          description="Positive momentum or leverage points identified in the data."
          icon={TrendingUp}
          items={report.opportunities || []}
          emptyTitle="No growth opportunities highlighted"
        />
      </div>
    </div>
  );
}
