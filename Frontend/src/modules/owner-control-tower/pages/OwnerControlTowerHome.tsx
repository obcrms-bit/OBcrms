'use client';

import { useMemo, useState } from 'react';
import {
  Activity,
  Building2,
  CheckCircle2,
  Landmark,
  Loader2,
  ShieldAlert,
  Users,
  WalletCards,
} from 'lucide-react';
import { SectionCard, SectionHeader } from '@/components/app/design-system';
import { formatCurrency } from '@/components/app/shared';
import type { OwnerSnapshot } from '../types/owner-control.types';
import {
  defaultOwnerFilters,
  filterConsultancies,
} from '../utils/owner-control.utils';
import ComparisonPanel from '../components/charts/ComparisonPanel';
import ActivityFeed from '../components/owner/ActivityFeed';
import AlertsRiskCard from '../components/owner/AlertsRiskCard';
import CompletionProgressCard from '../components/owner/CompletionProgressCard';
import ConsultancySetupChecklist from '../components/owner/ConsultancySetupChecklist';
import OwnerCommandBar from '../components/owner/OwnerCommandBar';
import OwnerKpiStrip from '../components/owner/OwnerKpiStrip';
import QuickActionBar from '../components/owner/QuickActionBar';
import ConsultancyPortfolioTable from '../components/tables/ConsultancyPortfolioTable';

export default function OwnerControlTowerHome({ snapshot }: { snapshot: OwnerSnapshot }) {
  const [filters, setFilters] = useState(defaultOwnerFilters);
  const [consultancies, setConsultancies] = useState(snapshot.consultancies);

  const filteredConsultancies = useMemo(
    () => filterConsultancies(consultancies, filters),
    [consultancies, filters]
  );

  const kpis = [
    {
      label: 'Total Consultancies',
      value: snapshot.kpis.totalConsultancies,
      helper: 'Owner-controlled tenant portfolio',
      icon: Building2,
      accent: 'bg-slate-900',
    },
    {
      label: 'Active Consultancies',
      value: snapshot.kpis.activeConsultancies,
      helper: 'Operating without owner intervention',
      icon: CheckCircle2,
      accent: 'bg-emerald-600',
    },
    {
      label: 'Onboarding In Progress',
      value: snapshot.kpis.onboardingInProgress,
      helper: 'Structured setup still underway',
      icon: Loader2,
      accent: 'bg-sky-600',
    },
    {
      label: 'Setup Completed',
      value: snapshot.kpis.setupCompleted,
      helper: 'Reached owner go-live threshold',
      icon: Activity,
      accent: 'bg-violet-600',
    },
    {
      label: 'Total Branches',
      value: snapshot.kpis.totalBranches,
      helper: 'Head offices and branches combined',
      icon: Landmark,
      accent: 'bg-teal-600',
    },
    {
      label: 'Total Users',
      value: snapshot.kpis.totalUsers,
      helper: 'Cross-consultancy workforce count',
      icon: Users,
      accent: 'bg-cyan-600',
    },
    {
      label: 'Overdue Follow-ups',
      value: snapshot.kpis.totalOverdueFollowUps,
      helper: 'Owner watchlist backlog',
      icon: ShieldAlert,
      accent: 'bg-rose-600',
    },
    {
      label: 'Revenue Snapshot',
      value: formatCurrency(snapshot.kpis.totalRevenueSnapshot),
      helper: 'Live portfolio revenue view',
      icon: WalletCards,
      accent: 'bg-amber-600',
    },
  ];

  const setupFocus = [...filteredConsultancies]
    .sort((left, right) => left.setupCompletion - right.setupCompletion)
    .slice(0, 2);

  const homeActivity = [...filteredConsultancies]
    .flatMap((consultancy) => consultancy.activityFeed)
    .sort((left, right) => +new Date(right.timestamp) - +new Date(left.timestamp))
    .slice(0, 6);

  const handleToggleStatus = (id: string) => {
    setConsultancies((current) =>
      current.map((item) =>
        item.id === id
          ? {
              ...item,
              status: item.status === 'suspended' ? 'active' : 'suspended',
            }
          : item
      )
    );
  };

  return (
    <div className="space-y-8">
      <OwnerCommandBar
        ownerName={snapshot.ownerName}
        ownerEmail={snapshot.ownerEmail}
        notifications={snapshot.notifications}
        consultancies={consultancies}
        countries={snapshot.availableCountries}
        filters={filters}
        onFiltersChange={setFilters}
      />

      <OwnerKpiStrip items={kpis} />

      <QuickActionBar />

      <ConsultancyPortfolioTable
        consultancies={filteredConsultancies}
        onToggleStatus={handleToggleStatus}
      />

      <div className="grid gap-6 xl:grid-cols-2">
        {setupFocus.map((consultancy) => (
          <div key={consultancy.id} className="space-y-4">
            <CompletionProgressCard
              name={consultancy.name}
              completion={consultancy.setupCompletion}
              sections={consultancy.setupSections}
            />
            <ConsultancySetupChecklist sections={consultancy.setupSections.slice(0, 6)} />
          </div>
        ))}
      </div>

      <ComparisonPanel consultancies={filteredConsultancies} />

      <div className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
        <div className="space-y-4">
          <SectionHeader
            eyebrow="Alerts & Risks"
            title="Issues that need owner attention now"
            description="Validation failures, stalled setups, missing automation, and operational drift are surfaced early."
          />
          <div className="grid gap-4 xl:grid-cols-2">
            {snapshot.alerts.slice(0, 4).map((alert) => (
              <AlertsRiskCard key={alert.id} alert={alert} />
            ))}
          </div>
        </div>

        <div className="space-y-6">
          <ActivityFeed title="Recent cross-tenant activity" items={homeActivity} />
          <SectionCard>
            <SectionHeader
              eyebrow="Import Center"
              title="Import readiness snapshot"
              description="Owner-level import monitoring for pending reviews, failed imports, and reusable onboarding templates."
            />
            <div className="mt-6 grid gap-4 md:grid-cols-3">
              <div className="rounded-[1.35rem] border border-slate-200 bg-slate-50 p-4">
                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
                  Pending Review
                </p>
                <p className="mt-2 text-2xl font-semibold text-slate-950">
                  {snapshot.kpis.importsPendingReview}
                </p>
              </div>
              <div className="rounded-[1.35rem] border border-slate-200 bg-slate-50 p-4">
                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
                  Failed Imports
                </p>
                <p className="mt-2 text-2xl font-semibold text-slate-950">
                  {snapshot.kpis.failedImports}
                </p>
              </div>
              <div className="rounded-[1.35rem] border border-slate-200 bg-slate-50 p-4">
                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
                  Templates Ready
                </p>
                <p className="mt-2 text-2xl font-semibold text-slate-950">3</p>
              </div>
            </div>
            <div className="mt-6 flex flex-wrap gap-3">
              <a href="/owner-control-tower/imports/new" className="ds-button-primary">
                Open import wizard
              </a>
              <a href="/owner-control-tower/imports" className="ds-button-secondary">
                Review import history
              </a>
            </div>
          </SectionCard>
        </div>
      </div>
    </div>
  );
}
