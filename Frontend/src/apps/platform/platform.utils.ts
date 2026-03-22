import { consultancies } from '@/src/modules/owner-control-tower/data/owner-control.mock-data';
import type { OwnerSnapshot } from '@/src/modules/owner-control-tower/types/owner-control.types';
import type {
  DateRangeFilter,
  OnboardingFilter,
  PlatformActivityItem,
  PlatformAttentionItem,
  PlatformBillingStatus,
  PlatformChartDatum,
  PlatformDashboardModel,
  PlatformPlanKey,
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

  if (['past_due'].includes(normalized)) {
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
      tenant?.company?.updatedAt || tenant?.updatedAt || tenant?.createdAt || new Date().toISOString(),
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
    inactiveUsers: Math.max(0, Math.round((tenant?.usersCount || 0) * (healthScore < 70 ? 0.18 : 0.05))),
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
    importIssues: consultancy.importHistory?.filter((item: any) => item.status === 'failed').length || 0,
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
        : `${prefix} ${base.name.replace(/^(NorthStar|Atlas|BluePeak|VisaVerse|Origin)\s*/i, '')}`.trim();
    const record = mapMockConsultancyToRecord(
      {
        ...base,
        id: `${base.id}-${index + 1}`,
        tenantId: `TEN-${String(index + 1).padStart(3, '0')}`,
        name,
        country: index % 2 === 0 ? base.country : base.countries?.[index % base.countries.length] || base.country,
        status:
          index % 7 === 0
            ? 'suspended'
            : index % 5 === 0
              ? 'trial'
              : index % 4 === 0
                ? 'onboarding'
                : 'active',
        plan:
          index % 6 === 0 ? 'Enterprise' : index % 3 === 0 ? 'Growth' : 'Launch',
        setupCompletion: clamp((base.setupCompletion || 68) + ((index % 9) - 4) * 5, 24, 100),
        lastActivity: new Date(
          Date.now() - (index + 1) * 1000 * 60 * 60 * 11
        ).toISOString(),
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
                : index % 4 === 0
                  ? 'active'
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

const sameOrBeforeMonth = (left: string, rightMonth: Date) => {
  const date = new Date(left);
  if (Number.isNaN(date.getTime())) {
    return false;
  }

  const monthDate = new Date(rightMonth.getFullYear(), rightMonth.getMonth() + 1, 0, 23, 59, 59, 999);
  return date <= monthDate;
};

export const buildDashboardModel = (
  overview: any,
  tenants: PlatformTenantRecord[],
  ownerSnapshot?: OwnerSnapshot | null
): PlatformDashboardModel => {
  const totalMrr = tenants.reduce((sum, tenant) => sum + (tenant.status === 'suspended' ? 0 : tenant.mrr), 0);
  const averageSetupCompletion = Math.round(
    tenants.reduce((sum, tenant) => sum + tenant.setupCompletion, 0) / Math.max(tenants.length, 1)
  );
  const attentionItems: PlatformAttentionItem[] = tenants
    .flatMap((tenant) =>
      tenant.warnings.slice(0, 2).map((message, index) => ({
        id: `${tenant.id}-warning-${index}`,
        tenantId: tenant.id,
        tenantName: tenant.name,
        level: tenant.attentionLevel,
        label:
          tenant.attentionLevel === 'critical'
            ? 'Needs intervention'
            : tenant.attentionLevel === 'watch'
              ? 'Monitor closely'
              : 'Healthy',
        message,
        category: /billing/i.test(message)
          ? 'billing'
          : /workflow|setup|import|branding/i.test(message)
            ? 'onboarding'
            : 'operations',
      }))
    )
    .sort((left, right) => {
      const leftScore = left.level === 'critical' ? 3 : left.level === 'watch' ? 2 : 1;
      const rightScore = right.level === 'critical' ? 3 : right.level === 'watch' ? 2 : 1;
      return rightScore - leftScore;
    })
    .slice(0, 8);

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
        (tenant) => tenant.setupCompletion >= 50 && tenant.setupCompletion < 85
      ).length,
    },
    {
      label: 'Blocked',
      value: tenants.filter((tenant) => tenant.setupCompletion < 50).length,
    },
  ];

  const activityFeed: PlatformActivityItem[] =
    (overview?.recentAuditLogs || []).length
      ? overview.recentAuditLogs.map((log: any) => ({
          id: log._id,
          title: `${log.action} • ${log.resource}`,
          description: log.resourceName || log.module || 'Owner-level action recorded',
          timestamp: log.createdAt,
          actor: log.userName || 'System',
          module: log.module,
          status: log.status || 'success',
        }))
      : (ownerSnapshot?.consultancies || [])
          .flatMap((consultancy) => consultancy.activityFeed.slice(0, 2))
          .sort((left, right) => +new Date(right.timestamp) - +new Date(left.timestamp))
          .slice(0, 8)
          .map((item) => ({
            id: item.id,
            title: item.title,
            description: item.description,
            timestamp: item.timestamp,
            actor: item.actor,
            status: item.type,
          }));

  const criticalIssues = attentionItems.filter((item) => item.level === 'critical').length;

  return {
    tenants,
    totalMrr,
    averageSetupCompletion,
    criticalIssues,
    heroInsights: [
      {
        id: 'mrr',
        label: 'Monthly recurring revenue',
        value: new Intl.NumberFormat('en-US', {
          style: 'currency',
          currency: 'USD',
          maximumFractionDigits: 0,
        }).format(totalMrr),
        tone: 'info',
        helper: `${tenants.filter((tenant) => tenant.status !== 'suspended').length} revenue-contributing tenants`,
      },
      {
        id: 'setup',
        label: 'Average setup readiness',
        value: `${averageSetupCompletion}%`,
        tone: averageSetupCompletion >= 84 ? 'healthy' : averageSetupCompletion >= 64 ? 'watch' : 'critical',
        helper: `${onboardingDistribution[2].value} tenants are still blocked`,
      },
      {
        id: 'attention',
        label: 'Needs attention',
        value: String(attentionItems.length),
        tone: criticalIssues ? 'critical' : 'watch',
        helper: `${criticalIssues} critical issues surfaced across billing, onboarding, and activity`,
      },
    ],
    revenueTrend,
    tenantGrowthTrend,
    planDistribution,
    onboardingDistribution,
    attentionItems,
    activityFeed,
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
