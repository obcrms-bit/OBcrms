'use client';

import { useMemo, useState } from 'react';
import { SectionCard, SectionHeader } from '@/components/app/design-system';
import type { ConsultancyRecord } from '../../types/owner-control.types';
import ComparisonChartCard from './ComparisonChartCard';

export default function ComparisonPanel({
  consultancies,
}: {
  consultancies: ConsultancyRecord[];
}) {
  const [selectedIds, setSelectedIds] = useState<string[]>(
    consultancies.slice(0, 3).map((item) => item.id)
  );

  const selectedConsultancies = useMemo(
    () => consultancies.filter((item) => selectedIds.includes(item.id)).slice(0, 4),
    [consultancies, selectedIds]
  );

  const toggleConsultancy = (id: string) => {
    setSelectedIds((current) =>
      current.includes(id)
        ? current.filter((item) => item !== id)
        : [...current, id].slice(-4)
    );
  };

  const baseData = selectedConsultancies.map((item) => ({
    name: item.name.split(' ')[0],
    leads: item.metrics.leads,
    applications: item.metrics.applications,
    revenue: item.metrics.revenue,
    conversionRate: item.metrics.conversionRate,
    visaSuccessRate: item.metrics.visaSuccessRate,
    followUpDiscipline: item.metrics.followUpDiscipline,
    counselorProductivity: item.metrics.counselorProductivity,
    branchGrowth: item.metrics.branchGrowth,
    commissionsPending: item.metrics.commissionsPending,
  }));

  const trendData = selectedConsultancies.flatMap((item) =>
    item.metrics.activityTrend.map((point) => ({
      name: `${item.name.split(' ')[0]} ${point.label}`,
      activity: point.value,
    }))
  );

  return (
    <div className="space-y-6">
      <SectionCard>
        <SectionHeader
          eyebrow="Consultancy Comparison"
          title="Compare consultancies side by side"
          description="Select up to four consultancies to compare pipeline volume, execution quality, and financial output."
        />
        <div className="mt-6 flex flex-wrap gap-2">
          {consultancies.map((consultancy) => {
            const selected = selectedIds.includes(consultancy.id);
            return (
              <button
                key={consultancy.id}
                type="button"
                onClick={() => toggleConsultancy(consultancy.id)}
                className={`rounded-full px-4 py-2 text-sm font-semibold transition ${
                  selected
                    ? 'bg-slate-900 text-white'
                    : 'border border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
                }`}
              >
                {consultancy.name}
              </button>
            );
          })}
        </div>
      </SectionCard>

      <div className="grid gap-6 xl:grid-cols-2">
        <ComparisonChartCard
          title="Leads and Applications"
          description="Pipeline strength and application readiness across selected consultancies."
          data={baseData}
          dataKey="leads"
          color="#0284c7"
        />
        <ComparisonChartCard
          title="Revenue Snapshot"
          description="Owner-level revenue comparison across the selected portfolio slice."
          data={baseData}
          dataKey="revenue"
          color="#7c3aed"
        />
        <ComparisonChartCard
          title="Conversion Discipline"
          description="Conversion rate, visa success, and follow-up discipline can be read in one curve set."
          data={baseData.map((item) => ({ name: item.name, score: item.conversionRate }))}
          dataKey="score"
          type="line"
          color="#0f766e"
        />
        <ComparisonChartCard
          title="Activity Trend"
          description="Recent operating trend across selected consultancies."
          data={trendData}
          dataKey="activity"
          type="line"
          color="#f97316"
        />
      </div>
    </div>
  );
}
