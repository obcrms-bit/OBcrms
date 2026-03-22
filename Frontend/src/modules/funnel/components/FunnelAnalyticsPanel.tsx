'use client';

import { InlineStats, SectionCard, SectionHeader } from '@/components/app/design-system';

type FunnelAnalyticsPanelProps = {
  analytics: any;
};

const maxValue = (items: any[], field: string) =>
  Math.max(1, ...items.map((item) => Number(item?.[field] || 0)));

const BarList = ({
  title,
  description,
  items,
  labelField,
  valueField,
  suffix = '',
}: any) => {
  const highest = maxValue(items, valueField);

  return (
    <SectionCard>
      <SectionHeader title={title} description={description} />
      <div className="mt-6 space-y-4">
        {items.length ? (
          items.map((item: any) => (
            <div key={`${title}-${item[labelField]}`}>
              <div className="mb-2 flex items-center justify-between gap-3 text-sm">
                <span className="font-medium text-slate-700">{item[labelField]}</span>
                <span className="font-semibold text-slate-900">
                  {item[valueField]}
                  {suffix}
                </span>
              </div>
              <div className="h-2.5 overflow-hidden rounded-full bg-slate-100">
                <div
                  className="h-full rounded-full bg-slate-900 transition-[width] duration-500"
                  style={{ width: `${(Number(item[valueField] || 0) / highest) * 100}%` }}
                />
              </div>
            </div>
          ))
        ) : (
          <p className="text-sm text-slate-500">No analytics available yet.</p>
        )}
      </div>
    </SectionCard>
  );
};

export default function FunnelAnalyticsPanel({ analytics }: FunnelAnalyticsPanelProps) {
  const totals = analytics?.totals || {};

  return (
    <div className="space-y-6">
      <InlineStats
        items={[
          { label: 'Total Leads', value: totals.totalLeads || 0, helper: 'All active Funnel records' },
          { label: 'Converted', value: totals.convertedLeads || 0, helper: 'Reached won Funnel stages' },
          { label: 'Lost', value: totals.lostLeads || 0, helper: 'Moved into lost stages' },
          { label: 'Overdue', value: totals.overdueLeads || 0, helper: 'Follow-up SLA currently at risk' },
          {
            label: 'Avg. Time To Conversion',
            value: `${totals.averageTimeToConversionDays || 0}d`,
            helper: 'Mean time from inquiry to conversion',
          },
        ]}
        columns={5}
      />

      <div className="grid gap-6 xl:grid-cols-2">
        <BarList
          title="Stage-Wise Lead Count"
          description="Where volume currently sits across the Funnel."
          items={analytics?.stageCounts || []}
          labelField="stageName"
          valueField="count"
        />
        <BarList
          title="Branch Funnel Performance"
          description="Branch-level lead volume and conversion output."
          items={analytics?.branchPerformance || []}
          labelField="branchName"
          valueField="conversionRate"
          suffix="%"
        />
        <BarList
          title="Assignee Conversion"
          description="Primary-owner conversion rate across the Funnel."
          items={analytics?.assigneePerformance || []}
          labelField="assigneeName"
          valueField="conversionRate"
          suffix="%"
        />
        <BarList
          title="Lost Reason Analytics"
          description="Most common reasons for Funnel drop-off."
          items={analytics?.lostReasonAnalytics || []}
          labelField="label"
          valueField="count"
        />
        <BarList
          title="Source To Conversion"
          description="Lead source quality and conversion output."
          items={analytics?.sourceAnalytics || []}
          labelField="source"
          valueField="conversionRate"
          suffix="%"
        />
        <BarList
          title="Stage Aging"
          description="Average days spent per Funnel stage."
          items={analytics?.stageCounts || []}
          labelField="stageName"
          valueField="averageAgingDays"
          suffix="d"
        />
      </div>
    </div>
  );
}
