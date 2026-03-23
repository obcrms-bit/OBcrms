import { consultancies } from '@/src/modules/owner-control-tower/data/owner-control.mock-data';
import { hasPermission, normalizeRoleKey } from '@/src/services/access';
import type {
  DateRangeFilter,
  OnboardingFilter,
  PlatformActivityItem,
  PlatformAttentionItem,
  PlatformBillingStatus,
  PlatformCapabilitySet,
  PlatformChartDatum,
  PlatformCommandInsight,
  PlatformDashboardModel,
  PlatformImportBatchRecord,
  PlatformPlanKey,
  PlatformSystemHealthItem,
  PlatformTenantRecord,
  PlatformTenantStatus,
  SortDirection,
  TenantAttentionLevel,
  TenantFilterState,
  TenantSortField,
} from './platform.types';

const DEFAULT_MONTHLY_PRICING: Record<PlatformPlanKey, number> = {
  starter: 79,
  growth: 199,
  enterprise: 499,
};

const MOCK_COMPANY_PREFIXES = [
  'Aurora',
  'Northline',
  'Summit',
  'BluePeak',
  'PrimeGate',
  'Westbridge',
  'Atlas',
  'Crestview',
  'Origin',
  'Meridian',
  'Elevate',
  'TrueNorth',
  'EastGate',
  'Pioneer',
  'Harbor',
  'IvyRoute',
  'Vertex',
  'Crownstone',
  'Bridgefield',
  'Launchpad',
  'Oakline',
  'SilverPath',
  'Foundry',
  'Lighthouse',
];

export const DEFAULT_TENANT_FILTERS: TenantFilterState = {
  search: '',
  status: 'all',
  plan: 'all',
  onboarding: 'all',
  country: '',
  billing: 'all',
  dateRange: 'all',
};

const clamp = (value: number, min: number, max: number) =>
  Math.max(min, Math.min(max, value));

const titleCase = (value = '') =>
  String(value)
    .replace(/[_-]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .replace(/\b\w/g, (match) => match.toUpperCase());

export const slugify = (value = '') =>
  String(value)
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');

export const formatRelativeDate = (value?: string) => {
  if (!value) {
    return 'No activity';
  }

  const timestamp = new Date(value).getTime();
  if (Number.isNaN(timestamp)) {
    return 'Unknown';
  }

  const diff = Date.now() - timestamp;
  const minutes = Math.floor(diff / (1000 * 60));
  const hours = Math.floor(diff / (1000 * 60 * 60));
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));

  if (minutes < 60) {
    return `${Math.max(minutes, 1)}m ago`;
  }
  if (hours < 24) {
    return `${hours}h ago`;
  }
  if (days < 30) {
    return `${days}d ago`;
  }

  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  }).format(new Date(timestamp));
};

export const normalizePlanKey = (value?: string): PlatformPlanKey => {
  const normalized = String(value || '')
    .trim()
    .toLowerCase();

  if (['enterprise', 'scale'].includes(normalized)) {
    return 'enterprise';
  }
  if (['growth', 'professional', 'pro'].includes(normalized)) {
    return 'growth';
  }
  return 'starter';
};

export const getPlanLabel = (plan: PlatformPlanKey) =>
  plan === 'enterprise' ? 'Enterprise' : plan === 'growth' ? 'Growth' : 'Starter';

const normalizeBillingStatus = (value?: string): PlatformBillingStatus => {
  const normalized = String(value || '')
    .trim()
    .toLowerCase();

  if (normalized === 'past_due') {
    return 'past_due';
  }
  if (['inactive', 'suspended'].includes(normalized)) {
    return 'inactive';
  }
  if (['cancelled', 'canceled'].includes(normalized)) {
    return 'cancelled';
  }
  if (normalized === 'trial') {
    return 'trial';
  }
  return 'active';
};

const normalizeTenantStatus = (value?: string): PlatformTenantStatus => {
  const normalized = String(value || '')
    .trim()
    .toLowerCase();

  if (normalized === 'past_due') {
    return 'past_due';
  }
  if (normalized === 'suspended') {
    return 'suspended';
  }
  if (normalized === 'trial') {
    return 'trial';
  }
  if (normalized === 'onboarding') {
    return 'onboarding';
  }
  return 'active';
};

const deriveAttentionLevel = ({
  status,
  billingStatus,
  healthScore,
  warnings,
}: {
  status: PlatformTenantStatus;
  billingStatus: PlatformBillingStatus;
  healthScore: number;
  warnings: string[];
}): TenantAttentionLevel => {
  if (
    status === 'suspended' ||
    status === 'past_due' ||
    billingStatus === 'past_due' ||
    billingStatus === 'cancelled' ||
    healthScore < 58 ||
    warnings.length >= 4
  ) {
    return 'critical';
  }

  if (warnings.length >= 2 || healthScore < 78 || status === 'trial' || status === 'onboarding') {
    return 'watch';
  }

  return 'healthy';
};

const deriveSetupCompletion = (tenant: any) => {
  if (tenant?.company?.metadata?.onboardingCompletedAt) {
    return 100;
  }

  const warningCount = Array.isArray(tenant?.warnings) ? tenant.warnings.length : 0;
  const baseScore = tenant?.healthScore || 82;
  return clamp(Math.round(baseScore - warningCount * 4), 36, 99);
};

const getMonthlyPrice = (planKey: PlatformPlanKey, billingPlans: any[] = []) => {
  const matchedPlan =
    billingPlans.find((plan) => normalizePlanKey(plan?.key || plan?.name) === planKey) || null;

  return matchedPlan?.priceMonthly || DEFAULT_MONTHLY_PRICING[planKey];
};

export const mapApiTenantToRecord = (
  tenant: any,
  billingPlans: any[] = [],
  index = 0
): PlatformTenantRecord => {
  const plan = normalizePlanKey(tenant?.plan || tenant?.subscription?.plan);
  const status = normalizeTenantStatus(tenant?.status);
  const billingStatus = normalizeBillingStatus(tenant?.billingStatus);
  const warnings = Array.isArray(tenant?.warnings) ? tenant.warnings : [];
  const countries = Array.isArray(tenant?.countries) ? tenant.countries.filter(Boolean) : [];
  const healthScore = clamp(Number(tenant?.healthScore || 80), 0, 100);
  const setupCompletion = deriveSetupCompletion(tenant);
  const code =
    tenant?.company?.companyId ||
    tenant?.companyId ||
    `TEN-${String(index + 1).padStart(3, '0')}`;
  const name = tenant?.name || tenant?.company?.name || 'Untitled Tenant';
  const domain =
    tenant?.company?.settings?.customDomain ||
    tenant?.company?.settings?.supportEmail?.split('@')?.[1] ||
    slugify(name);

  return {
    id: tenant?.id || tenant?._id || code,
    code,
    name,
    domain,
    plan,
    planLabel: getPlanLabel(plan),
    status,
    billingStatus,
    country: tenant?.company?.country || countries[0] || 'Unknown',
    countries,
    branches: Number(tenant?.branchCount || tenant?.subscription?.usage?.branches || 0),
    users: Number(tenant?.usersCount || tenant?.subscription?.usage?.activeUsers || 0),
    setupCompletion,
    healthScore,
    lastActivityAt:
      tenant?.company?.updatedAt ||
      tenant?.updatedAt ||
      tenant?.createdAt ||
      new Date().toISOString(),
    createdAt: tenant?.createdAt || tenant?.company?.createdAt || new Date().toISOString(),
    ownerEmail:
      tenant?.company?.adminContact?.email || tenant?.company?.email || 'owner@consultancy.com',
    website: tenant?.company?.website || '',
    mrr: getMonthlyPrice(plan, billingPlans),
    warnings,
    attentionLevel: deriveAttentionLevel({
      status,
      billingStatus,
      healthScore,
      warnings,
    }),
    importIssues: warnings.filter((warning: string) =>
      /import|workflow|branding|setup/i.test(warning)
    ).length,
    inactiveUsers: Math.max(
      0,
      Math.round((tenant?.usersCount || 0) * (healthScore < 70 ? 0.18 : 0.05))
    ),
    source: 'api',
    raw: tenant,
  };
};

const mapMockConsultancyToRecord = (consultancy: any, index: number): PlatformTenantRecord => {
  const plan = normalizePlanKey(consultancy?.plan);
  const status = normalizeTenantStatus(consultancy?.status);
  const billingStatus = normalizeBillingStatus(consultancy?.subscription?.status);
  const warnings =
    (consultancy?.risks || []).map((item: any) => item.title || item.description).filter(Boolean) ||
    [];
  const healthScore =
    consultancy?.healthStatus === 'healthy'
      ? 89
      : consultancy?.healthStatus === 'attention'
        ? 71
        : 52;

  return {
    id: consultancy.id,
    code: consultancy.tenantId || `TEN-${String(index + 1).padStart(3, '0')}`,
    name: consultancy.name,
    domain: slugify(consultancy.name),
    plan,
    planLabel: getPlanLabel(plan),
    status,
    billingStatus,
    country: consultancy.country,
    countries: consultancy.countries || [consultancy.country],
    branches: consultancy.metrics?.branches || 0,
    users: consultancy.metrics?.users || 0,
    setupCompletion: consultancy.setupCompletion || 0,
    healthScore,
    lastActivityAt: consultancy.lastActivity,
    createdAt: consultancy.onboardingStartedAt,
    ownerEmail: `owner@${slugify(consultancy.name)}.com`,
    website: `https://${slugify(consultancy.name)}.com`,
    mrr: consultancy.subscription?.arr
      ? Math.round(Number(consultancy.subscription.arr) / 12)
      : DEFAULT_MONTHLY_PRICING[plan],
    warnings,
    attentionLevel: deriveAttentionLevel({
      status,
      billingStatus,
      healthScore,
      warnings,
    }),
    importIssues:
      consultancy.importHistory?.filter((item: any) => item.status === 'failed').length || 0,
    inactiveUsers: Math.max(0, Math.round((consultancy.metrics?.users || 0) * 0.08)),
    source: 'mock',
    raw: consultancy,
  };
};

export const buildMockPlatformTenants = (): PlatformTenantRecord[] =>
  Array.from({ length: 24 }, (_, index) => {
    const base = consultancies[index % consultancies.length];
    const prefix = MOCK_COMPANY_PREFIXES[index];
    const name =
      index < consultancies.length
        ? base.name
        : `${prefix} ${base.name.replace(
            /^(NorthStar|Atlas|BluePeak|VisaVerse|Origin)\s*/i,
            ''
          )}`.trim();
    const record = mapMockConsultancyToRecord(
      {
        ...base,
        id: `${base.id}-${index + 1}`,
        tenantId: `TEN-${String(index + 1).padStart(3, '0')}`,
        name,
        country:
          index % 2 === 0
            ? base.country
            : base.countries?.[index % base.countries.length] || base.country,
        status:
          index % 7 === 0
            ? 'suspended'
            : index % 5 === 0
              ? 'trial'
              : index % 4 === 0
                ? 'onboarding'
                : 'active',
        plan: index % 6 === 0 ? 'Enterprise' : index % 3 === 0 ? 'Growth' : 'Launch',
        setupCompletion: clamp((base.setupCompletion || 68) + ((index % 9) - 4) * 5, 24, 100),
        lastActivity: new Date(Date.now() - (index + 1) * 1000 * 60 * 60 * 11).toISOString(),
        onboardingStartedAt: new Date(
          Date.now() - (index + 14) * 1000 * 60 * 60 * 24 * 9
        ).toISOString(),
        subscription: {
          ...(base.subscription || {}),
          status:
            index % 7 === 0
              ? 'suspended'
              : index % 5 === 0
                ? 'trial'
                : 'active',
          arr: Math.max(18000, (base.subscription?.arr || 36000) + index * 2400),
        },
        metrics: {
          ...(base.metrics || {}),
          branches: Math.max(1, (base.metrics?.branches || 2) + (index % 4)),
          users: Math.max(6, (base.metrics?.users || 14) + index * 2),
        },
      },
      index
    );

    return {
      ...record,
      domain: `${slugify(name)}.trustcloud`,
      ownerEmail: `owner@${slugify(name)}.com`,
    };
  });

export const buildPlatformTenantDataset = (
  apiTenants: any[] = [],
  billingPlans: any[] = []
): PlatformTenantRecord[] => {
  if (apiTenants.length) {
    return apiTenants.map((tenant, index) => mapApiTenantToRecord(tenant, billingPlans, index));
  }

  return buildMockPlatformTenants();
};

export const mapImportBatchToRecord = (batch: any): PlatformImportBatchRecord => ({
  id: batch?._id || batch?.id || `import-${Math.random().toString(36).slice(2, 9)}`,
  fileName: batch?.fileName || 'Untitled import',
  fileType: String(batch?.fileType || 'csv').toUpperCase(),
  status: ['uploaded', 'validated', 'imported', 'failed'].includes(batch?.status)
    ? batch.status
    : 'uploaded',
  completionPercentage: clamp(Number(batch?.completionPercentage || 0), 0, 100),
  createdAt: batch?.createdAt || new Date().toISOString(),
  updatedAt: batch?.updatedAt || batch?.createdAt || new Date().toISOString(),
  createdByName: batch?.createdBy?.name || 'Platform Ops',
  createdByEmail: batch?.createdBy?.email || '',
  importedTenantId: batch?.importedTenantId?._id || batch?.importedTenantId || '',
  importedTenantName: batch?.importedTenantId?.name || '',
  totalRows: Number(batch?.validation?.totalRows || batch?.summary?.totalRows || 0),
  validationErrors: Number(
    batch?.validation?.errorRows || batch?.summary?.validationErrors || 0
  ),
  validationWarnings: Number(
    batch?.validation?.warningRows || batch?.summary?.validationWarnings || 0
  ),
  raw: batch,
});

const toMonthLabel = (date: Date) =>
  new Intl.DateTimeFormat('en-US', { month: 'short' }).format(date);

const buildSeriesMonths = (count = 6) =>
  Array.from({ length: count }, (_, index) => {
    const date = new Date();
    date.setMonth(date.getMonth() - (count - index - 1));
    date.setDate(1);
    date.setHours(0, 0, 0, 0);
    return date;
  });

const sameOrBeforeMonth = (value: string, rightMonth: Date) => {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return false;
  }

  const monthDate = new Date(
    rightMonth.getFullYear(),
    rightMonth.getMonth() + 1,
    0,
    23,
    59,
    59,
    999
  );
  return date <= monthDate;
};

const isBillingIssue = (tenant: PlatformTenantRecord) =>
  ['past_due', 'inactive', 'cancelled'].includes(tenant.billingStatus) ||
  tenant.status === 'past_due';

const getWarningByPattern = (warnings: string[], pattern: RegExp) =>
  warnings.find((warning) => pattern.test(warning));

const getImportAttentionLevel = (batch: PlatformImportBatchRecord): TenantAttentionLevel => {
  if (batch.status === 'failed' || batch.validationErrors > 0) {
    return 'critical';
  }
  if (batch.status === 'uploaded' || batch.validationWarnings > 0) {
    return 'watch';
  }
  return 'healthy';
};

const buildTenantAttentionItems = (tenants: PlatformTenantRecord[]): PlatformAttentionItem[] =>
  tenants.flatMap((tenant) => {
    const items: PlatformAttentionItem[] = [];

    if (tenant.setupCompletion < 70) {
      items.push({
        id: `${tenant.id}-setup`,
        tenantId: tenant.id,
        tenantName: tenant.name,
        level: tenant.setupCompletion < 50 ? 'critical' : 'watch',
        label: 'Incomplete onboarding',
        message: `${tenant.setupCompletion}% setup completion. Resume onboarding before launch confidence drops.`,
        category: 'onboarding',
      });
    }

    if (isBillingIssue(tenant)) {
      items.push({
        id: `${tenant.id}-billing`,
        tenantId: tenant.id,
        tenantName: tenant.name,
        level: 'critical',
        label: 'Billing issue',
        message: `Billing status is ${tenant.billingStatus}. Commercial follow-up is required.`,
        category: 'billing',
      });
    }

    if (tenant.status === 'suspended') {
      items.push({
        id: `${tenant.id}-suspended`,
        tenantId: tenant.id,
        tenantName: tenant.name,
        level: 'critical',
        label: 'Inactive tenant',
        message: 'Tenant access is suspended. Review whether to reactivate, offboard, or intervene.',
        category: 'lifecycle',
      });
    }

    if (
      tenant.users === 0 ||
      tenant.inactiveUsers >= Math.max(2, Math.round(tenant.users * 0.25))
    ) {
      items.push({
        id: `${tenant.id}-users`,
        tenantId: tenant.id,
        tenantName: tenant.name,
        level: tenant.users === 0 ? 'critical' : 'watch',
        label: 'Adoption risk',
        message:
          tenant.users === 0
            ? 'No active tenant users detected yet.'
            : `${tenant.inactiveUsers} users appear inactive from the platform lens.`,
        category: 'adoption',
      });
    }

    const formsWarning = getWarningByPattern(tenant.warnings, /public lead capture/i);
    if (formsWarning) {
      items.push({
        id: `${tenant.id}-forms`,
        tenantId: tenant.id,
        tenantName: tenant.name,
        level: 'watch',
        label: 'Forms missing',
        message: formsWarning,
        category: 'forms',
      });
    }

    const branchWarning = getWarningByPattern(tenant.warnings, /head office branch|branch/i);
    if (branchWarning) {
      items.push({
        id: `${tenant.id}-branch`,
        tenantId: tenant.id,
        tenantName: tenant.name,
        level: 'watch',
        label: 'Branch setup risk',
        message: branchWarning,
        category: 'branches',
      });
    }

    const integrationWarning = getWarningByPattern(tenant.warnings, /integration/i);
    if (integrationWarning) {
      items.push({
        id: `${tenant.id}-integration`,
        tenantId: tenant.id,
        tenantName: tenant.name,
        level: 'watch',
        label: 'Integration gap',
        message: integrationWarning,
        category: 'integrations',
      });
    }

    return items;
  });

const buildImportAttentionItems = (
  batches: PlatformImportBatchRecord[]
): PlatformAttentionItem[] =>
  batches
    .filter((batch) => batch.status !== 'imported')
    .map((batch) => ({
      id: `${batch.id}-import`,
      tenantId: batch.importedTenantId || batch.id,
      tenantName: batch.importedTenantName || 'Import Center',
      level: getImportAttentionLevel(batch),
      label: batch.status === 'failed' ? 'Failed import' : 'Import review',
      message:
        batch.status === 'failed'
          ? `${batch.fileName} failed with ${batch.validationErrors || 1} blocking validation issue(s).`
          : `${batch.fileName} is ${batch.status}. Review before tenant provisioning continues.`,
      category: 'imports',
    }));

const buildActivityFeed = (
  overview: any,
  importBatches: PlatformImportBatchRecord[]
): PlatformActivityItem[] => {
  const auditItems: PlatformActivityItem[] = (overview?.recentAuditLogs || []).map((log: any) => ({
    id: log._id,
    title: titleCase(log.action || 'platform_activity'),
    description: log.resourceName || log.module || 'Platform-level action recorded',
    timestamp: log.createdAt,
    actor: log.userName || 'System',
    module: log.module,
    status: log.status || 'success',
  }));

  const importItems: PlatformActivityItem[] = importBatches.map((batch) => ({
    id: `${batch.id}-activity`,
    title:
      batch.status === 'imported'
        ? 'Tenant import completed'
        : batch.status === 'failed'
          ? 'Tenant import failed'
          : 'Tenant import updated',
    description: `${batch.fileName}${batch.importedTenantName ? ` / ${batch.importedTenantName}` : ''}`,
    timestamp: batch.updatedAt || batch.createdAt,
    actor: batch.createdByName || 'Platform Ops',
    module: 'imports',
    status: batch.status,
  }));

  return [...auditItems, ...importItems]
    .sort((left, right) => +new Date(right.timestamp) - +new Date(left.timestamp))
    .slice(0, 12);
};

const buildAiInsights = (
  tenants: PlatformTenantRecord[],
  importBatches: PlatformImportBatchRecord[]
): PlatformCommandInsight[] => {
  const criticalTenants = tenants
    .filter((tenant) => tenant.attentionLevel === 'critical')
    .sort((left, right) => left.healthScore - right.healthScore);
  const blockedOnboarding = tenants.filter((tenant) => tenant.setupCompletion < 55);
  const launchReady = tenants.filter(
    (tenant) =>
      tenant.setupCompletion >= 85 &&
      tenant.status !== 'suspended' &&
      !isBillingIssue(tenant)
  );
  const noFormsTenants = tenants.filter((tenant) =>
    tenant.warnings.some((warning) => /public lead capture/i.test(warning))
  );
  const branchMismatchTenants = tenants.filter(
    (tenant) => tenant.branches > 0 && tenant.users <= tenant.branches
  );
  const failedImports = importBatches.filter((batch) => batch.status === 'failed');

  const insights: PlatformCommandInsight[] = [];

  if (criticalTenants.length) {
    insights.push({
      id: 'declining-tenants',
      title: `${criticalTenants.length} tenants show declining health`,
      description: `${criticalTenants
        .slice(0, 3)
        .map((tenant) => tenant.name)
        .join(', ')} need platform intervention before support load grows.`,
      severity: 'critical',
      href: '/platform/alerts',
      actionLabel: 'Review alerts',
      meta: `${criticalTenants[0].healthScore}/100 lowest health score`,
      tenantId: criticalTenants[0].id,
    });
  }

  if (blockedOnboarding.length) {
    insights.push({
      id: 'onboarding-bottleneck',
      title: `${blockedOnboarding.length} tenants are blocked in onboarding`,
      description: 'Missing setup prerequisites and unresolved launch tasks are slowing activation.',
      severity: 'watch',
      href: '/platform/onboarding',
      actionLabel: 'Resume onboarding',
      meta: `${blockedOnboarding.filter((tenant) => tenant.setupCompletion < 40).length} below 40% ready`,
      tenantId: blockedOnboarding[0].id,
    });
  }

  if (failedImports.length) {
    insights.push({
      id: 'import-risk',
      title: `${failedImports.length} import batches need correction`,
      description: 'Workbook validation errors are blocking tenant provisioning and rollout timelines.',
      severity: 'critical',
      href: '/platform/import',
      actionLabel: 'Open import center',
      meta: `${failedImports.reduce((sum, batch) => sum + batch.validationErrors, 0)} validation errors`,
    });
  }

  if (launchReady.length) {
    insights.push({
      id: 'launch-ready',
      title: `${launchReady.length} tenants are launch ready`,
      description: 'These workspaces are sufficiently configured and can be pushed toward activation or case studies.',
      severity: 'positive',
      href: '/platform/tenants',
      actionLabel: 'Open tenant list',
      meta: `${launchReady.slice(0, 3).map((tenant) => tenant.name).join(', ')}`,
      tenantId: launchReady[0].id,
    });
  }

  if (noFormsTenants.length) {
    insights.push({
      id: 'forms-gap',
      title: `${noFormsTenants.length} tenants have no form capture configured`,
      description: 'Lead intake coverage is incomplete, which will slow acquisition after launch.',
      severity: 'info',
      href: '/platform/settings?panel=integrations',
      actionLabel: 'Review white-label setup',
      meta: 'Missing website or public-form readiness',
      tenantId: noFormsTenants[0].id,
    });
  }

  if (branchMismatchTenants.length) {
    insights.push({
      id: 'branch-coverage',
      title: `${branchMismatchTenants.length} tenants may be under-staffed across branches`,
      description:
        'Branch count is outpacing active user count, which can create uneven service quality and routing risk.',
      severity: 'watch',
      href: '/platform/tenants',
      actionLabel: 'Inspect tenant staffing',
      meta: `${branchMismatchTenants[0].name} is the strongest outlier`,
      tenantId: branchMismatchTenants[0].id,
    });
  }

  return insights.slice(0, 6);
};

const buildSystemHealth = (
  overview: any,
  tenants: PlatformTenantRecord[],
  importBatches: PlatformImportBatchRecord[],
  activityFeed: PlatformActivityItem[]
): PlatformSystemHealthItem[] => {
  const activeImports = importBatches.filter((batch) =>
    ['uploaded', 'validated'].includes(batch.status)
  ).length;
  const failedImports = importBatches.filter((batch) => batch.status === 'failed').length;
  const formCoverage = tenants.filter(
    (tenant) => !tenant.warnings.some((warning) => /public lead capture/i.test(warning))
  ).length;
  const integrationsEnabled = tenants.filter(
    (tenant) => !tenant.warnings.some((warning) => /integration/i.test(warning))
  ).length;
  const billingIssues = tenants.filter(isBillingIssue).length;
  const platformAlerts = tenants.filter((tenant) => tenant.attentionLevel !== 'healthy').length;

  return [
    {
      id: 'imports',
      label: 'Import jobs',
      value: activeImports
        ? `${activeImports} active`
        : failedImports
          ? `${failedImports} failed`
          : 'Idle',
      helper: failedImports
        ? `${failedImports} batches need correction`
        : 'No active provisioning queues detected',
      tone: failedImports ? 'danger' : activeImports ? 'info' : 'neutral',
    },
    {
      id: 'billing',
      label: 'Billing posture',
      value: billingIssues ? `${billingIssues} issues` : 'Healthy',
      helper: `${overview?.supportTools?.pastDueTenants || 0} past due / ${overview?.supportTools?.suspendedTenants || 0} suspended`,
      tone: billingIssues ? 'warning' : 'success',
    },
    {
      id: 'forms',
      label: 'Form coverage',
      value: `${formCoverage}/${Math.max(tenants.length, 0)}`,
      helper: tenants.length
        ? 'Tenants with intake forms or lead capture configured'
        : 'No tenants onboarded yet',
      tone:
        !tenants.length ? 'neutral' : formCoverage === tenants.length ? 'success' : 'warning',
    },
    {
      id: 'integrations',
      label: 'Integration readiness',
      value: `${integrationsEnabled}/${Math.max(tenants.length, 0)}`,
      helper: tenants.length ? 'Tenants without integration warnings' : 'No tenants to inspect',
      tone:
        !tenants.length
          ? 'neutral'
          : integrationsEnabled >= Math.ceil(tenants.length * 0.8)
            ? 'success'
            : 'info',
    },
    {
      id: 'alerts',
      label: 'Platform alerts',
      value: platformAlerts ? String(platformAlerts) : 'Quiet',
      helper: activityFeed.length
        ? `${activityFeed.length} recent platform-visible events`
        : 'Activity feed is currently quiet',
      tone: platformAlerts ? 'warning' : 'success',
    },
  ];
};

export const buildPlatformCapabilities = (user: any): PlatformCapabilitySet => {
  const roleKey = normalizeRoleKey(user);
  const canManagePlatform =
    roleKey === 'super_admin' || hasPermission(user, 'platformcontrol', 'manage');

  return {
    roleLabel:
      roleKey === 'super_admin'
        ? 'Owner'
        : roleKey === 'super_admin_manager'
          ? 'Platform Manager'
          : 'Platform Team',
    canManagePlatform,
    canCreateTenant: canManagePlatform,
    canImpersonate: canManagePlatform,
    canEditBilling: canManagePlatform,
    canReviewAudit:
      roleKey === 'super_admin' || hasPermission(user, 'platformcontrol', 'view'),
    canAccessAiInsights:
      roleKey === 'super_admin' || hasPermission(user, 'platformcontrol', 'view'),
  };
};

export const buildDashboardModel = ({
  overview,
  tenants,
  importBatches = [],
}: {
  overview?: any;
  tenants: PlatformTenantRecord[];
  importBatches?: PlatformImportBatchRecord[];
}): PlatformDashboardModel => {
  const totalMrr = tenants.reduce(
    (sum, tenant) => sum + (tenant.status === 'suspended' ? 0 : tenant.mrr),
    0
  );
  const averageSetupCompletion = Math.round(
    tenants.reduce((sum, tenant) => sum + tenant.setupCompletion, 0) / Math.max(tenants.length, 1)
  );
  const averageHealthScore = Math.round(
    tenants.reduce((sum, tenant) => sum + tenant.healthScore, 0) / Math.max(tenants.length, 1)
  );

  const activeTenants = tenants.filter((tenant) => tenant.status === 'active').length;
  const suspendedTenants = tenants.filter((tenant) => tenant.status === 'suspended').length;
  const onboardingInProgress = tenants.filter((tenant) =>
    ['trial', 'onboarding'].includes(tenant.status)
  ).length;
  const billingIssues = tenants.filter(isBillingIssue).length;
  const launchReadyTenants = tenants.filter(
    (tenant) =>
      tenant.setupCompletion >= 85 &&
      tenant.status !== 'suspended' &&
      !isBillingIssue(tenant)
  ).length;
  const activeImports = importBatches.filter((batch) =>
    ['uploaded', 'validated'].includes(batch.status)
  ).length;

  const attentionItems = [...buildTenantAttentionItems(tenants), ...buildImportAttentionItems(importBatches)]
    .sort((left, right) => {
      const leftScore = left.level === 'critical' ? 3 : left.level === 'watch' ? 2 : 1;
      const rightScore = right.level === 'critical' ? 3 : right.level === 'watch' ? 2 : 1;
      return rightScore - leftScore;
    })
    .slice(0, 10);

  const criticalIssues = attentionItems.filter((item) => item.level === 'critical').length;
  const importFailurePenalty =
    importBatches.filter((batch) => batch.status === 'failed').length * 4;
  const platformHealthScore = clamp(
    Math.round(averageHealthScore - billingIssues * 2 - criticalIssues * 1.5 - importFailurePenalty),
    tenants.length ? 18 : 0,
    100
  );

  const months = buildSeriesMonths();
  const revenueTrend: PlatformChartDatum[] = months.map((month) => ({
    label: toMonthLabel(month),
    value: tenants
      .filter((tenant) => sameOrBeforeMonth(tenant.createdAt, month))
      .reduce((sum, tenant) => sum + (tenant.status === 'suspended' ? 0 : tenant.mrr), 0),
  }));

  const tenantGrowthTrend: PlatformChartDatum[] = months.map((month) => ({
    label: toMonthLabel(month),
    value: tenants.filter((tenant) => sameOrBeforeMonth(tenant.createdAt, month)).length,
    secondaryValue: tenants.filter(
      (tenant) =>
        sameOrBeforeMonth(tenant.createdAt, month) &&
        ['active', 'trial', 'onboarding'].includes(tenant.status)
    ).length,
  }));

  const planDistribution: PlatformChartDatum[] = ['starter', 'growth', 'enterprise'].map((plan) => ({
    label: getPlanLabel(plan as PlatformPlanKey),
    value: tenants.filter((tenant) => tenant.plan === plan).length,
  }));

  const onboardingDistribution: PlatformChartDatum[] = [
    {
      label: 'Complete',
      value: tenants.filter((tenant) => tenant.setupCompletion >= 85).length,
    },
    {
      label: 'In Progress',
      value: tenants.filter(
        (tenant) => tenant.setupCompletion >= 55 && tenant.setupCompletion < 85
      ).length,
    },
    {
      label: 'Blocked',
      value: tenants.filter((tenant) => tenant.setupCompletion < 55).length,
    },
  ];

  const healthDistribution: PlatformChartDatum[] = [
    {
      label: 'Healthy',
      value: tenants.filter((tenant) => tenant.healthScore >= 85).length,
    },
    {
      label: 'Watch',
      value: tenants.filter(
        (tenant) => tenant.healthScore >= 65 && tenant.healthScore < 85
      ).length,
    },
    {
      label: 'Critical',
      value: tenants.filter((tenant) => tenant.healthScore < 65).length,
    },
  ];

  const branchDistribution: PlatformChartDatum[] = [
    {
      label: '1-2 branches',
      value: tenants.filter((tenant) => tenant.branches >= 1 && tenant.branches <= 2).length,
    },
    {
      label: '3-5 branches',
      value: tenants.filter((tenant) => tenant.branches >= 3 && tenant.branches <= 5).length,
    },
    {
      label: '6-10 branches',
      value: tenants.filter((tenant) => tenant.branches >= 6 && tenant.branches <= 10).length,
    },
    {
      label: '10+ branches',
      value: tenants.filter((tenant) => tenant.branches > 10).length,
    },
  ];

  const alertSeverityDistribution: PlatformChartDatum[] = [
    {
      label: 'Critical',
      value: attentionItems.filter((item) => item.level === 'critical').length,
    },
    {
      label: 'Watch',
      value: attentionItems.filter((item) => item.level === 'watch').length,
    },
    {
      label: 'Healthy',
      value: Math.max(tenants.length - attentionItems.length, 0),
    },
  ];

  const importTrend: PlatformChartDatum[] = months.map((month) => ({
    label: toMonthLabel(month),
    value: importBatches.filter(
      (batch) => batch.status === 'imported' && sameOrBeforeMonth(batch.createdAt, month)
    ).length,
    secondaryValue: importBatches.filter(
      (batch) => batch.status === 'failed' && sameOrBeforeMonth(batch.createdAt, month)
    ).length,
  }));

  const activityFeed = buildActivityFeed(overview, importBatches);
  const aiInsights = buildAiInsights(tenants, importBatches);
  const systemHealth = buildSystemHealth(overview, tenants, importBatches, activityFeed);

  return {
    tenants,
    imports: importBatches,
    totalMrr,
    averageSetupCompletion,
    averageHealthScore,
    platformHealthScore,
    activeTenants,
    suspendedTenants,
    onboardingInProgress,
    billingIssues,
    launchReadyTenants,
    activeImports,
    criticalIssues,
    heroInsights: [
      {
        id: 'platform-health',
        label: 'Platform Health',
        value: `${platformHealthScore}/100`,
        tone:
          platformHealthScore >= 84 ? 'healthy' : platformHealthScore >= 65 ? 'watch' : 'critical',
        helper: `${averageHealthScore}/100 average tenant health across the portfolio`,
      },
      {
        id: 'onboarding-queue',
        label: 'Onboarding Queue',
        value: String(onboardingInProgress + activeImports),
        tone: onboardingInProgress + activeImports > 0 ? 'info' : 'healthy',
        helper: `${onboardingInProgress} tenants in setup / ${activeImports} import jobs still active`,
      },
      {
        id: 'critical-issues',
        label: 'Critical Issues',
        value: String(criticalIssues),
        tone: criticalIssues ? 'critical' : 'healthy',
        helper: `${billingIssues} billing issues and ${suspendedTenants} suspended tenants currently visible`,
      },
    ],
    revenueTrend,
    tenantGrowthTrend,
    planDistribution,
    onboardingDistribution,
    healthDistribution,
    branchDistribution,
    alertSeverityDistribution,
    importTrend,
    attentionItems,
    activityFeed,
    aiInsights,
    systemHealth,
    emptyStates: {
      hasTenants: tenants.length > 0,
      hasImports: importBatches.length > 0,
      hasActivity: activityFeed.length > 0,
    },
  };
};

const matchesDateRange = (value: string, range: DateRangeFilter) => {
  if (range === 'all') {
    return true;
  }

  const timestamp = new Date(value).getTime();
  if (Number.isNaN(timestamp)) {
    return false;
  }

  const days = Number(range.replace('d', ''));
  return Date.now() - timestamp <= days * 24 * 60 * 60 * 1000;
};

const matchesOnboarding = (setupCompletion: number, filter: OnboardingFilter) => {
  if (filter === 'all') {
    return true;
  }
  if (filter === 'complete') {
    return setupCompletion >= 85;
  }
  if (filter === 'progress') {
    return setupCompletion >= 50 && setupCompletion < 85;
  }
  return setupCompletion < 50;
};

export const filterTenants = (
  tenants: PlatformTenantRecord[],
  filters: TenantFilterState
) => {
  const search = filters.search.trim().toLowerCase();

  return tenants.filter((tenant) => {
    const matchesSearch =
      !search ||
      [
        tenant.name,
        tenant.code,
        tenant.domain,
        tenant.ownerEmail,
        tenant.country,
        tenant.planLabel,
      ]
        .filter(Boolean)
        .some((value) => String(value).toLowerCase().includes(search));

    return (
      matchesSearch &&
      (filters.status === 'all' || tenant.status === filters.status) &&
      (filters.plan === 'all' || tenant.plan === filters.plan) &&
      (filters.billing === 'all' || tenant.billingStatus === filters.billing) &&
      (!filters.country || tenant.country === filters.country) &&
      matchesOnboarding(tenant.setupCompletion, filters.onboarding) &&
      matchesDateRange(tenant.createdAt, filters.dateRange)
    );
  });
};

export const sortTenants = (
  tenants: PlatformTenantRecord[],
  field: TenantSortField,
  direction: SortDirection
) => {
  const sorted = [...tenants].sort((left, right) => {
    const leftValue = left[field];
    const rightValue = right[field];

    if (typeof leftValue === 'number' && typeof rightValue === 'number') {
      return leftValue - rightValue;
    }

    if (field === 'lastActivityAt' || field === 'createdAt') {
      return new Date(String(leftValue)).getTime() - new Date(String(rightValue)).getTime();
    }

    return String(leftValue || '').localeCompare(String(rightValue || ''));
  });

  return direction === 'asc' ? sorted : sorted.reverse();
};

export const paginateTenants = (
  tenants: PlatformTenantRecord[],
  page: number,
  pageSize: number
) => {
  const total = tenants.length;
  const pages = Math.max(1, Math.ceil(total / pageSize));
  const safePage = clamp(page, 1, pages);
  const startIndex = (safePage - 1) * pageSize;

  return {
    page: safePage,
    pages,
    total,
    items: tenants.slice(startIndex, startIndex + pageSize),
  };
};

export const exportTenantRecords = (records: PlatformTenantRecord[], fileName: string) => {
  const headers = [
    'Tenant Name',
    'Code',
    'Domain',
    'Plan',
    'Status',
    'Country',
    'Branches',
    'Users',
    'Setup Completion',
    'Billing Status',
    'Last Activity',
    'Created At',
    'Owner Email',
  ];

  const lines = records.map((record) =>
    [
      record.name,
      record.code,
      record.domain,
      record.planLabel,
      record.status,
      record.country,
      record.branches,
      record.users,
      `${record.setupCompletion}%`,
      record.billingStatus,
      new Date(record.lastActivityAt).toISOString(),
      new Date(record.createdAt).toISOString(),
      record.ownerEmail,
    ]
      .map((value) => `"${String(value).replace(/"/g, '""')}"`)
      .join(',')
  );

  const csv = [headers.join(','), ...lines].join('\n');
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = fileName;
  anchor.click();
  URL.revokeObjectURL(url);
};

export const getStatusTone = (status: PlatformTenantStatus | PlatformBillingStatus | string) => {
  if (['active', 'healthy'].includes(status)) {
    return 'success';
  }
  if (['trial', 'onboarding'].includes(status)) {
    return 'info';
  }
  if (['past_due', 'warning'].includes(status)) {
    return 'warning';
  }
  if (['inactive', 'cancelled', 'suspended', 'critical'].includes(status)) {
    return 'danger';
  }
  return 'neutral';
};
