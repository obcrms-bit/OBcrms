import type {
  ConsultancyRecord,
  ConsultancyStatus,
  HealthStatus,
  ImportJob,
  ImportSectionValidation,
  OwnerFilters,
  OwnerKpiSummary,
  RiskAlert,
  SetupSection,
  SetupStatus,
} from '../types/owner-control.types';

const DAY_IN_MS = 24 * 60 * 60 * 1000;

export const ownerDateFilters = [
  { value: 'all', label: 'All time' },
  { value: '30d', label: 'Last 30 days' },
  { value: '90d', label: 'Last 90 days' },
  { value: '180d', label: 'Last 180 days' },
] as const;

export const defaultOwnerFilters: OwnerFilters = {
  search: '',
  consultancyId: 'all',
  status: 'all',
  country: 'all',
  dateRange: 'all',
};

export function cloneData<T>(value: T): T {
  return JSON.parse(JSON.stringify(value));
}

export function buildOwnerKpis(
  consultancies: ConsultancyRecord[],
  importJobs: ImportJob[]
): OwnerKpiSummary {
  const importsPendingReview = importJobs.filter(
    (job) => job.status === 'pending_review' || job.status === 'validated'
  ).length;
  const failedImports = importJobs.filter((job) => job.status === 'failed').length;

  return consultancies.reduce<OwnerKpiSummary>(
    (summary, consultancy) => {
      summary.totalConsultancies += 1;
      summary.activeConsultancies += consultancy.status === 'active' ? 1 : 0;
      summary.onboardingInProgress += consultancy.status === 'onboarding' ? 1 : 0;
      summary.setupCompleted += consultancy.setupCompletion >= 90 ? 1 : 0;
      summary.totalBranches += consultancy.metrics.branches;
      summary.totalUsers += consultancy.metrics.users;
      summary.totalLeads += consultancy.metrics.leads;
      summary.totalStudents += consultancy.metrics.students;
      summary.totalApplications += consultancy.metrics.applications;
      summary.totalVisasInProgress += consultancy.metrics.visasInProgress;
      summary.totalOverdueFollowUps += consultancy.metrics.overdueFollowUps;
      summary.totalCommissionsPending += consultancy.metrics.commissionsPending;
      summary.totalRevenueSnapshot += consultancy.metrics.revenue;
      summary.importsPendingReview = importsPendingReview;
      summary.failedImports = failedImports;
      return summary;
    },
    {
      totalConsultancies: 0,
      activeConsultancies: 0,
      onboardingInProgress: 0,
      setupCompleted: 0,
      totalBranches: 0,
      totalUsers: 0,
      totalLeads: 0,
      totalStudents: 0,
      totalApplications: 0,
      totalVisasInProgress: 0,
      totalOverdueFollowUps: 0,
      totalCommissionsPending: 0,
      totalRevenueSnapshot: 0,
      importsPendingReview,
      failedImports,
    }
  );
}

export function flattenRisks(consultancies: ConsultancyRecord[]): RiskAlert[] {
  return consultancies.flatMap((consultancy) => consultancy.risks);
}

export function filterConsultancies(
  consultancies: ConsultancyRecord[],
  filters: OwnerFilters
): ConsultancyRecord[] {
  const now = Date.now();
  const daysBack =
    filters.dateRange === '30d'
      ? 30
      : filters.dateRange === '90d'
        ? 90
        : filters.dateRange === '180d'
          ? 180
          : 0;

  return consultancies.filter((consultancy) => {
    const searchValue = filters.search.trim().toLowerCase();
    const matchesSearch =
      !searchValue ||
      [
        consultancy.name,
        consultancy.tenantId,
        consultancy.country,
        consultancy.headOffice,
        consultancy.plan,
      ]
        .join(' ')
        .toLowerCase()
        .includes(searchValue);

    const matchesConsultancy =
      filters.consultancyId === 'all' || consultancy.id === filters.consultancyId;
    const matchesStatus = filters.status === 'all' || consultancy.status === filters.status;
    const matchesCountry = filters.country === 'all' || consultancy.country === filters.country;
    const matchesDate =
      daysBack === 0 ||
      now - new Date(consultancy.lastActivity).getTime() <= daysBack * DAY_IN_MS;

    return matchesSearch && matchesConsultancy && matchesStatus && matchesCountry && matchesDate;
  });
}

export function getConsultancyStatusTone(status: ConsultancyStatus): string {
  if (status === 'active') return 'completed';
  if (status === 'trial') return 'due_today';
  if (status === 'onboarding') return 'pending';
  return 'overdue';
}

export function getHealthTone(status: HealthStatus): string {
  if (status === 'healthy') return 'completed';
  if (status === 'attention') return 'pending';
  return 'overdue';
}

export function getSetupTone(status: SetupStatus): string {
  if (status === 'complete') return 'completed';
  if (status === 'in_progress') return 'due_today';
  if (status === 'pending') return 'pending';
  return 'overdue';
}

export function getSeverityTone(severity: RiskAlert['severity']): string {
  if (severity === 'info') return 'new';
  if (severity === 'warning') return 'pending';
  return 'overdue';
}

export function getValidationTone(status: ImportSectionValidation['status']): string {
  if (status === 'valid') return 'completed';
  if (status === 'warning') return 'pending';
  return 'overdue';
}

export function canFinalizeImport(sections: ImportSectionValidation[]): boolean {
  return sections.every((section) => section.status !== 'error');
}

export function summarizeSetup(sections: SetupSection[]) {
  return sections.reduce(
    (summary, section) => {
      summary.total += 1;
      if (section.status === 'complete') summary.complete += 1;
      if (section.status === 'in_progress') summary.inProgress += 1;
      if (section.status === 'blocked' || section.status === 'failed') summary.blocked += 1;
      return summary;
    },
    { total: 0, complete: 0, inProgress: 0, blocked: 0 }
  );
}

export function formatPercent(value: number) {
  return `${Math.round(value)}%`;
}

export function formatCompactNumber(value: number) {
  return new Intl.NumberFormat('en-US', {
    notation: 'compact',
    maximumFractionDigits: 1,
  }).format(value);
}

export function groupImportIssues(sections: ImportSectionValidation[]) {
  return sections.reduce(
    (summary, section) => {
      section.issues.forEach((issue) => {
        if (issue.severity === 'error') {
          summary.errors += 1;
        } else {
          summary.warnings += 1;
        }
      });
      return summary;
    },
    { errors: 0, warnings: 0 }
  );
}
