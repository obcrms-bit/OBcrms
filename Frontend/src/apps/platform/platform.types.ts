export type PlatformPlanKey = 'starter' | 'growth' | 'enterprise';

export type PlatformTenantStatus =
  | 'active'
  | 'trial'
  | 'onboarding'
  | 'suspended'
  | 'past_due';

export type PlatformBillingStatus =
  | 'active'
  | 'trial'
  | 'past_due'
  | 'inactive'
  | 'cancelled'
  | 'suspended';

export type TenantAttentionLevel = 'healthy' | 'watch' | 'critical';

export type PlatformTone = 'success' | 'warning' | 'danger' | 'info' | 'neutral';

export type TenantSortField =
  | 'name'
  | 'plan'
  | 'status'
  | 'country'
  | 'branches'
  | 'users'
  | 'setupCompletion'
  | 'billingStatus'
  | 'lastActivityAt'
  | 'createdAt';

export type SortDirection = 'asc' | 'desc';

export type OnboardingFilter = 'all' | 'complete' | 'progress' | 'blocked';

export type DateRangeFilter = 'all' | '30d' | '90d' | '180d' | '365d';

export interface PlatformAttentionItem {
  id: string;
  tenantId: string;
  tenantName: string;
  level: TenantAttentionLevel;
  label: string;
  message: string;
  category: string;
}

export interface PlatformActivityItem {
  id: string;
  title: string;
  description: string;
  timestamp: string;
  actor: string;
  module?: string;
  status?: string;
}

export interface PlatformChartDatum {
  label: string;
  value: number;
  secondaryValue?: number;
}

export interface PlatformTenantRecord {
  id: string;
  code: string;
  name: string;
  domain: string;
  plan: PlatformPlanKey;
  planLabel: string;
  status: PlatformTenantStatus;
  billingStatus: PlatformBillingStatus;
  country: string;
  countries: string[];
  branches: number;
  users: number;
  setupCompletion: number;
  healthScore: number;
  lastActivityAt: string;
  createdAt: string;
  ownerEmail: string;
  website?: string;
  mrr: number;
  warnings: string[];
  attentionLevel: TenantAttentionLevel;
  importIssues: number;
  inactiveUsers: number;
  source: 'api' | 'mock';
  raw?: any;
}

export interface PlatformImportBatchRecord {
  id: string;
  fileName: string;
  fileType: string;
  status: 'uploaded' | 'validated' | 'imported' | 'failed';
  completionPercentage: number;
  createdAt: string;
  updatedAt: string;
  createdByName: string;
  createdByEmail: string;
  importedTenantId?: string;
  importedTenantName?: string;
  totalRows: number;
  validationErrors: number;
  validationWarnings: number;
  raw?: any;
}

export interface PlatformCommandInsight {
  id: string;
  title: string;
  description: string;
  severity: 'positive' | 'watch' | 'critical' | 'info';
  href?: string;
  actionLabel?: string;
  meta?: string;
  tenantId?: string;
}

export interface PlatformSystemHealthItem {
  id: string;
  label: string;
  value: string;
  helper: string;
  tone: PlatformTone;
}

export interface PlatformCapabilitySet {
  roleLabel: string;
  canManagePlatform: boolean;
  canCreateTenant: boolean;
  canImpersonate: boolean;
  canEditBilling: boolean;
  canReviewAudit: boolean;
  canAccessAiInsights: boolean;
}

export interface PlatformDashboardModel {
  tenants: PlatformTenantRecord[];
  imports: PlatformImportBatchRecord[];
  totalMrr: number;
  averageSetupCompletion: number;
  averageHealthScore: number;
  platformHealthScore: number;
  activeTenants: number;
  suspendedTenants: number;
  onboardingInProgress: number;
  billingIssues: number;
  launchReadyTenants: number;
  activeImports: number;
  criticalIssues: number;
  heroInsights: Array<{
    id: string;
    label: string;
    value: string;
    tone: TenantAttentionLevel | 'info';
    helper: string;
  }>;
  revenueTrend: PlatformChartDatum[];
  tenantGrowthTrend: PlatformChartDatum[];
  planDistribution: PlatformChartDatum[];
  onboardingDistribution: PlatformChartDatum[];
  healthDistribution: PlatformChartDatum[];
  branchDistribution: PlatformChartDatum[];
  alertSeverityDistribution: PlatformChartDatum[];
  importTrend: PlatformChartDatum[];
  attentionItems: PlatformAttentionItem[];
  activityFeed: PlatformActivityItem[];
  aiInsights: PlatformCommandInsight[];
  systemHealth: PlatformSystemHealthItem[];
  emptyStates: {
    hasTenants: boolean;
    hasImports: boolean;
    hasActivity: boolean;
  };
}

export interface TenantFilterState {
  search: string;
  status: 'all' | PlatformTenantStatus;
  plan: 'all' | PlatformPlanKey;
  onboarding: OnboardingFilter;
  country: string;
  billing: 'all' | PlatformBillingStatus;
  dateRange: DateRangeFilter;
}

export interface TenantImportRow {
  id: string;
  name: string;
  domain: string;
  plan: PlatformPlanKey;
  ownerEmail: string;
  country: string;
  branches: string[];
  tempPassword: string;
  status: 'valid' | 'warning' | 'error';
  errors: Partial<
    Record<'name' | 'domain' | 'plan' | 'ownerEmail' | 'country' | 'branches', string>
  >;
  warnings: string[];
  runtimeError?: string;
  createdTenantId?: string;
}

export interface TenantImportSummary {
  totalRows: number;
  validRows: number;
  warningRows: number;
  errorRows: number;
  tenantsToCreate: number;
}
