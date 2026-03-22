export type ConsultancyStatus = 'active' | 'trial' | 'onboarding' | 'suspended';
export type SetupStatus = 'complete' | 'in_progress' | 'pending' | 'blocked' | 'failed';
export type HealthStatus = 'healthy' | 'attention' | 'critical';
export type Severity = 'info' | 'warning' | 'critical';
export type ImportStatus =
  | 'draft'
  | 'pending_review'
  | 'validated'
  | 'completed'
  | 'failed';

export interface TrendPoint {
  label: string;
  value: number;
}

export interface ConsultancyMetrics {
  branches: number;
  users: number;
  leads: number;
  students: number;
  applications: number;
  visasInProgress: number;
  overdueFollowUps: number;
  commissionsPending: number;
  revenue: number;
  conversionRate: number;
  visaSuccessRate: number;
  followUpDiscipline: number;
  counselorProductivity: number;
  branchGrowth: number;
  activityTrend: TrendPoint[];
}

export interface SetupSection {
  key: string;
  label: string;
  status: SetupStatus;
  completion: number;
  owner: string;
  updatedAt: string;
  nextAction: string;
  blockedReason?: string;
}

export interface BranchRecord {
  id: string;
  name: string;
  city: string;
  country: string;
  status: 'active' | 'planned' | 'standby';
  users: number;
  leads: number;
  students: number;
  manager: string;
}

export interface UserRecord {
  id: string;
  name: string;
  email: string;
  role: string;
  primaryBranch: string;
  secondaryOffices: string[];
  status: 'active' | 'invited' | 'pending';
}

export interface RoleMatrixRecord {
  id: string;
  roleName: string;
  scope: string;
  modules: string[];
  branches: string[];
  preset: 'standard' | 'copied' | 'custom';
}

export interface PartnerRecord {
  id: string;
  name: string;
  type: 'partner' | 'super_agent' | 'sub_agent';
  region: string;
  mappedBranch?: string;
  status: 'active' | 'pending' | 'review';
}

export interface WorkflowRecord {
  id: string;
  name: string;
  stageCount: number;
  owner: string;
  status: SetupStatus;
}

export interface AutomationRecord {
  id: string;
  name: string;
  trigger: string;
  enabled: boolean;
  status: 'ready' | 'partial' | 'disabled';
  channel: string;
  scope: string;
}

export interface ServiceChecklistItem {
  id: string;
  name: string;
  status: SetupStatus;
  owner: string;
  eta: string;
  dependency?: string;
}

export interface ActivityFeedItem {
  id: string;
  title: string;
  description: string;
  type: string;
  timestamp: string;
  actor: string;
}

export interface AuditLogRecord {
  id: string;
  actor: string;
  action: string;
  target: string;
  timestamp: string;
  outcome: 'success' | 'warning' | 'failed';
}

export interface SubscriptionInfo {
  plan: string;
  renewalDate: string;
  arr: number;
  status: 'trial' | 'active' | 'suspended';
  seats: number;
}

export interface RiskAlert {
  id: string;
  consultancyId: string;
  consultancyName: string;
  severity: Severity;
  category: string;
  title: string;
  description: string;
  createdAt: string;
  nextAction: string;
}

export interface ImportIssue {
  id: string;
  severity: 'warning' | 'error';
  row?: number;
  field?: string;
  message: string;
  suggestion: string;
}

export interface ImportSectionValidation {
  key: string;
  label: string;
  rowCount: number;
  status: 'valid' | 'warning' | 'error';
  summary: string;
  issues: ImportIssue[];
}

export interface ImportPreviewSummary {
  companyName: string;
  branchesToCreate: number;
  usersToCreate: number;
  rolesToCreate: number;
  permissionsToMap: number;
  partnersToCreate: number;
  superAgentsToCreate: number;
  subAgentsToCreate: number;
  workflowsToCreate: number;
  automationsToConfigure: number;
  servicesToInitialize: number;
}

export interface ImportResultSummary {
  created: Record<string, number>;
  skipped: string[];
  failed: string[];
}

export interface ImportJob {
  id: string;
  consultancyId?: string;
  consultancyName: string;
  sourceFileName: string;
  status: ImportStatus;
  createdAt: string;
  createdBy: string;
  templateName: string;
  scenario: 'clean' | 'warning' | 'error';
  sections: ImportSectionValidation[];
  preview: ImportPreviewSummary;
  result?: ImportResultSummary;
}

export interface ImportScenario {
  id: string;
  name: string;
  description: string;
  templateName: string;
  sourceFileName: string;
  scenario: 'clean' | 'warning' | 'error';
  sections: ImportSectionValidation[];
  preview: ImportPreviewSummary;
  status: ImportStatus;
}

export interface ConsultancyRecord {
  id: string;
  tenantId: string;
  name: string;
  country: string;
  headOffice: string;
  headOfficeCity: string;
  countries: string[];
  status: ConsultancyStatus;
  plan: string;
  subscription: SubscriptionInfo;
  setupCompletion: number;
  healthStatus: HealthStatus;
  automationStatus: 'ready' | 'partial' | 'missing';
  partnerSetupStatus: 'ready' | 'partial' | 'missing';
  lastActivity: string;
  onboardingStartedAt: string;
  tags: string[];
  metrics: ConsultancyMetrics;
  setupSections: SetupSection[];
  branches: BranchRecord[];
  users: UserRecord[];
  roles: RoleMatrixRecord[];
  partners: PartnerRecord[];
  workflows: WorkflowRecord[];
  automations: AutomationRecord[];
  services: ServiceChecklistItem[];
  activityFeed: ActivityFeedItem[];
  importHistory: ImportJob[];
  auditLogs: AuditLogRecord[];
  risks: RiskAlert[];
}

export interface OwnerKpiSummary {
  totalConsultancies: number;
  activeConsultancies: number;
  onboardingInProgress: number;
  setupCompleted: number;
  totalBranches: number;
  totalUsers: number;
  totalLeads: number;
  totalStudents: number;
  totalApplications: number;
  totalVisasInProgress: number;
  totalOverdueFollowUps: number;
  totalCommissionsPending: number;
  totalRevenueSnapshot: number;
  importsPendingReview: number;
  failedImports: number;
}

export interface OwnerSnapshot {
  ownerName: string;
  ownerEmail: string;
  notifications: number;
  consultancies: ConsultancyRecord[];
  alerts: RiskAlert[];
  importJobs: ImportJob[];
  kpis: OwnerKpiSummary;
  availableCountries: string[];
  statuses: ConsultancyStatus[];
}

export interface OwnerFilters {
  search: string;
  consultancyId: string;
  status: string;
  country: string;
  dateRange: 'all' | '30d' | '90d' | '180d';
}
