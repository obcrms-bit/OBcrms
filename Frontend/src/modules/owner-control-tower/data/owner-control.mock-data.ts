import type {
  ActivityFeedItem,
  AuditLogRecord,
  AutomationRecord,
  BranchRecord,
  ConsultancyRecord,
  ImportJob,
  ImportPreviewSummary,
  ImportScenario,
  ImportSectionValidation,
  PartnerRecord,
  RiskAlert,
  RoleMatrixRecord,
  ServiceChecklistItem,
  SetupSection,
  SetupStatus,
  UserRecord,
  WorkflowRecord,
} from '../types/owner-control.types';

type ConsultancyBlueprint = {
  id: string;
  tenantId: string;
  name: string;
  country: string;
  headOffice: string;
  headOfficeCity: string;
  countries: string[];
  status: ConsultancyRecord['status'];
  plan: ConsultancyRecord['plan'];
  setupCompletion: number;
  healthStatus: ConsultancyRecord['healthStatus'];
  automationStatus: ConsultancyRecord['automationStatus'];
  partnerSetupStatus: ConsultancyRecord['partnerSetupStatus'];
  lastActivity: string;
  onboardingStartedAt: string;
  tags: string[];
  subscription: ConsultancyRecord['subscription'];
  metrics: ConsultancyRecord['metrics'];
  setupStatuses: Partial<Record<string, SetupStatus>>;
  branchSeeds: Array<Omit<BranchRecord, 'id'>>;
  userSeeds: Array<Omit<UserRecord, 'id'>>;
  roleSeeds: Omit<RoleMatrixRecord, 'id'>[];
  partnerSeeds: Array<Omit<PartnerRecord, 'id'>>;
  workflowSeeds: Array<Omit<WorkflowRecord, 'id'>>;
  automationSeeds: Array<Omit<AutomationRecord, 'id'>>;
  serviceSeeds: Array<Omit<ServiceChecklistItem, 'id'>>;
  activitySeeds: Omit<ActivityFeedItem, 'id'>[];
  auditSeeds: Omit<AuditLogRecord, 'id'>[];
  risks: Array<Omit<RiskAlert, 'id' | 'consultancyId' | 'consultancyName'>>;
};

const monthTrend = (...values: number[]) =>
  values.map((value, index) => ({
    label: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'][index],
    value,
  }));

const setupCatalog = [
  ['company_info', 'Company Profile', 'Review legal entity metadata and branding'],
  ['branch_setup', 'Branch / Office Setup', 'Verify head office and reporting branch map'],
  ['workflows', 'Workflow Setup', 'Confirm pipelines, statuses, and escalation rules'],
  ['document_checklist', 'Document Checklist', 'Publish visa and admission checklists'],
  ['partners', 'Partner Setup', 'Approve partner and referral configuration'],
  ['super_agents', 'Super Agents', 'Validate regional super agent mapping'],
  ['sub_agents', 'Sub Agents', 'Validate branch-level sub agent ownership'],
  ['roles_permissions', 'Roles & Permission Matrix', 'Finalize role presets and scopes'],
  ['users', 'Users', 'Complete user import and branch assignment'],
  ['automation', 'Automation', 'Enable onboarding and reminder automations'],
  ['services', 'Services / Setup Checklist', 'Confirm go-live service readiness'],
];

const setupOwners: Record<string, string> = {
  company_info: 'Owner PMO',
  branch_setup: 'Launch Operations',
  workflows: 'Process Architect',
  document_checklist: 'Compliance Lead',
  partners: 'Partner Desk',
  super_agents: 'Regional Expansion',
  sub_agents: 'Branch Growth Team',
  roles_permissions: 'Security & RBAC',
  users: 'People Operations',
  automation: 'Automation Studio',
  services: 'Go-Live Desk',
};

const buildSetupSections = (
  statuses: Partial<Record<string, SetupStatus>>,
  completionOverrides: Partial<Record<string, number>> = {}
): SetupSection[] =>
  setupCatalog.map(([key, label, action], index) => {
    const status = statuses[key] || 'pending';
    const completion =
      completionOverrides[key] ??
      (status === 'complete'
        ? 100
        : status === 'in_progress'
          ? 72
          : status === 'blocked'
            ? 38
            : status === 'failed'
              ? 24
              : 0);

    return {
      key,
      label,
      status,
      completion,
      owner: setupOwners[key],
      updatedAt: `2026-03-${String(6 + index).padStart(2, '0')}T09:30:00.000Z`,
      nextAction:
        status === 'complete'
          ? 'Healthy and synced to owner template library'
          : status === 'blocked'
            ? action
            : status === 'failed'
              ? 'Resolve validation blockers and retry section import'
              : action,
      blockedReason:
        status === 'blocked'
          ? 'Dependent branch and role references need manual confirmation.'
          : undefined,
    };
  });

const buildBranches = (consultancyId: string, seeds: ConsultancyBlueprint['branchSeeds']) =>
  seeds.map((branch, index) => ({
    id: `${consultancyId}-branch-${index + 1}`,
    ...branch,
  }));

const buildUsers = (consultancyId: string, seeds: ConsultancyBlueprint['userSeeds']) =>
  seeds.map((user, index) => ({
    id: `${consultancyId}-user-${index + 1}`,
    ...user,
  }));

const buildRoles = (consultancyId: string, seeds: ConsultancyBlueprint['roleSeeds']) =>
  seeds.map((role, index) => ({
    id: `${consultancyId}-role-${index + 1}`,
    ...role,
  }));

const buildPartners = (consultancyId: string, seeds: ConsultancyBlueprint['partnerSeeds']) =>
  seeds.map((partner, index) => ({
    id: `${consultancyId}-partner-${index + 1}`,
    ...partner,
  }));

const buildWorkflows = (consultancyId: string, seeds: ConsultancyBlueprint['workflowSeeds']) =>
  seeds.map((workflow, index) => ({
    id: `${consultancyId}-workflow-${index + 1}`,
    ...workflow,
  }));

const buildAutomations = (consultancyId: string, seeds: ConsultancyBlueprint['automationSeeds']) =>
  seeds.map((automation, index) => ({
    id: `${consultancyId}-automation-${index + 1}`,
    ...automation,
  }));

const buildServices = (consultancyId: string, seeds: ConsultancyBlueprint['serviceSeeds']) =>
  seeds.map((service, index) => ({
    id: `${consultancyId}-service-${index + 1}`,
    ...service,
  }));

const buildActivityFeed = (consultancyId: string, seeds: ConsultancyBlueprint['activitySeeds']) =>
  seeds.map((activity, index) => ({
    id: `${consultancyId}-activity-${index + 1}`,
    ...activity,
  }));

const buildAuditLogs = (consultancyId: string, seeds: ConsultancyBlueprint['auditSeeds']) =>
  seeds.map((audit, index) => ({
    id: `${consultancyId}-audit-${index + 1}`,
    ...audit,
  }));

const buildRisks = (consultancy: ConsultancyBlueprint): RiskAlert[] =>
  consultancy.risks.map((risk, index) => ({
    id: `${consultancy.id}-risk-${index + 1}`,
    consultancyId: consultancy.id,
    consultancyName: consultancy.name,
    ...risk,
  }));

const createPreview = (
  companyName: string,
  summary: Partial<ImportPreviewSummary>
): ImportPreviewSummary => ({
  companyName,
  branchesToCreate: 0,
  usersToCreate: 0,
  rolesToCreate: 0,
  permissionsToMap: 0,
  partnersToCreate: 0,
  superAgentsToCreate: 0,
  subAgentsToCreate: 0,
  workflowsToCreate: 0,
  automationsToConfigure: 0,
  servicesToInitialize: 0,
  ...summary,
});

const cleanSections: ImportSectionValidation[] = [
  {
    key: 'company_info',
    label: 'Company Info',
    rowCount: 1,
    status: 'valid',
    summary: 'Legal entity, region, branding, and owner fields are complete.',
    issues: [],
  },
  {
    key: 'branch_setup',
    label: 'Branch / Office Setup',
    rowCount: 4,
    status: 'valid',
    summary: 'All branches include valid office codes, managers, and reporting regions.',
    issues: [],
  },
  {
    key: 'workflows',
    label: 'Workflows',
    rowCount: 5,
    status: 'warning',
    summary: 'One workflow is missing an optional SLA escalation owner.',
    issues: [
      {
        id: 'clean-workflow-warning',
        severity: 'warning',
        row: 4,
        field: 'escalationOwner',
        message: 'Visa follow-up workflow has no fallback escalation owner.',
        suggestion: 'Assign Compliance Lead or leave it to use the platform default.',
      },
    ],
  },
  {
    key: 'roles_permissions',
    label: 'Roles and Permission Matrix',
    rowCount: 6,
    status: 'valid',
    summary: 'Role presets align to supported modules and branch scopes.',
    issues: [],
  },
  {
    key: 'users',
    label: 'Users',
    rowCount: 18,
    status: 'valid',
    summary: 'User roster is unique and branch mappings resolved successfully.',
    issues: [],
  },
  {
    key: 'automation',
    label: 'Automation',
    rowCount: 7,
    status: 'warning',
    summary: 'Birthday automation will start disabled until SMTP verification completes.',
    issues: [
      {
        id: 'clean-automation-warning',
        severity: 'warning',
        row: 2,
        field: 'channel',
        message: 'Birthday reminder email channel is set to pending verification.',
        suggestion: 'Confirm SMTP credentials post-import to activate automatically.',
      },
    ],
  },
  {
    key: 'services',
    label: 'Services',
    rowCount: 8,
    status: 'valid',
    summary: 'Go-live services and owners are ready to initialize.',
    issues: [],
  },
];

const warningSections: ImportSectionValidation[] = [
  ...cleanSections,
  {
    key: 'partners',
    label: 'Partners',
    rowCount: 11,
    status: 'warning',
    summary: 'Two partners do not yet have a mapped head branch.',
    issues: [
      {
        id: 'warning-partner-1',
        severity: 'warning',
        row: 7,
        field: 'mappedBranch',
        message: 'Westbridge Overseas has no mapped branch.',
        suggestion: 'Attach to Dubai Head Office or use the owner review queue.',
      },
      {
        id: 'warning-partner-2',
        severity: 'warning',
        row: 9,
        field: 'mappedBranch',
        message: 'Future Path Sub Agent is missing office association.',
        suggestion: 'Attach to Abu Dhabi Satellite before confirm.',
      },
    ],
  },
];

const errorSections: ImportSectionValidation[] = [
  {
    key: 'company_info',
    label: 'Company Info',
    rowCount: 1,
    status: 'valid',
    summary: 'Base company metadata is present.',
    issues: [],
  },
  {
    key: 'branch_setup',
    label: 'Branch / Office Setup',
    rowCount: 3,
    status: 'error',
    summary: 'Duplicate branch naming and missing office code detected.',
    issues: [
      {
        id: 'error-branch-1',
        severity: 'error',
        row: 2,
        field: 'branchName',
        message: 'Duplicate branch name "Nairobi Hub" found in the same consultancy.',
        suggestion: 'Rename the secondary office before retrying validation.',
      },
      {
        id: 'error-branch-2',
        severity: 'error',
        row: 3,
        field: 'officeCode',
        message: 'Branch office code is missing.',
        suggestion: 'Provide a unique office code for branch import.',
      },
    ],
  },
  {
    key: 'roles_permissions',
    label: 'Roles and Permission Matrix',
    rowCount: 4,
    status: 'error',
    summary: 'Imported role preset references unsupported branch access scope.',
    issues: [
      {
        id: 'error-role-1',
        severity: 'error',
        row: 4,
        field: 'roleName',
        message: 'Role "Regional Commander" is not mapped to an approved preset.',
        suggestion: 'Map it to Branch Manager or create a custom owner-approved preset.',
      },
    ],
  },
  {
    key: 'users',
    label: 'Users',
    rowCount: 12,
    status: 'error',
    summary: 'User roster contains duplicate emails and invalid branch references.',
    issues: [
      {
        id: 'error-user-1',
        severity: 'error',
        row: 5,
        field: 'email',
        message: 'Duplicate email address found: admissions@originpathways.co.ke',
        suggestion: 'Make each user email unique before confirm.',
      },
      {
        id: 'error-user-2',
        severity: 'error',
        row: 8,
        field: 'primaryBranch',
        message: 'Primary branch reference "Westlands" does not exist in Branch Setup.',
        suggestion: 'Align the user import with a valid branch name or office code.',
      },
    ],
  },
  {
    key: 'automation',
    label: 'Automation',
    rowCount: 6,
    status: 'warning',
    summary: 'Visa expiry reminder is incomplete because no owner was assigned.',
    issues: [
      {
        id: 'error-automation-warning',
        severity: 'warning',
        row: 6,
        field: 'owner',
        message: 'Visa expiry reminder has no escalation owner.',
        suggestion: 'Assign Compliance Lead after fixing blocking errors.',
      },
    ],
  },
];

export const ownerProfile = {
  name: 'Arjun Shrestha',
  email: 'owner@trusteducation.ai',
  notifications: 14,
};

const consultancyBlueprints: ConsultancyBlueprint[] = [
  {
    id: 'northstar-global',
    tenantId: 'TEN-001',
    name: 'NorthStar Global Education',
    country: 'Nepal',
    headOffice: 'NorthStar Tower',
    headOfficeCity: 'Kathmandu',
    countries: ['Australia', 'Canada', 'UK', 'USA'],
    status: 'active',
    plan: 'Enterprise',
    setupCompletion: 92,
    healthStatus: 'healthy',
    automationStatus: 'ready',
    partnerSetupStatus: 'ready',
    lastActivity: '2026-03-21T15:10:00.000Z',
    onboardingStartedAt: '2025-11-06T09:30:00.000Z',
    tags: ['high-growth', 'visa-strong', 'template-source'],
    subscription: {
      plan: 'Enterprise',
      renewalDate: '2026-11-06T00:00:00.000Z',
      arr: 78000,
      status: 'active',
      seats: 64,
    },
    metrics: {
      branches: 6,
      users: 58,
      leads: 2840,
      students: 690,
      applications: 438,
      visasInProgress: 104,
      overdueFollowUps: 31,
      commissionsPending: 68000,
      revenue: 1240000,
      conversionRate: 32,
      visaSuccessRate: 91,
      followUpDiscipline: 88,
      counselorProductivity: 86,
      branchGrowth: 19,
      activityTrend: monthTrend(320, 356, 402, 447, 486, 514),
    },
    setupStatuses: {
      company_info: 'complete',
      branch_setup: 'complete',
      workflows: 'complete',
      document_checklist: 'complete',
      partners: 'complete',
      super_agents: 'complete',
      sub_agents: 'complete',
      roles_permissions: 'complete',
      users: 'complete',
      automation: 'in_progress',
      services: 'complete',
    },
    branchSeeds: [
      { name: 'Kathmandu Head Office', city: 'Kathmandu', country: 'Nepal', status: 'active', users: 22, leads: 1020, students: 245, manager: 'Aakriti Poudel' },
      { name: 'Pokhara Admissions Hub', city: 'Pokhara', country: 'Nepal', status: 'active', users: 10, leads: 410, students: 98, manager: 'Suman Rana' },
      { name: 'Sydney Liaison Office', city: 'Sydney', country: 'Australia', status: 'active', users: 6, leads: 350, students: 101, manager: 'Jordan Blake' },
    ],
    userSeeds: [
      { name: 'Aakriti Poudel', email: 'aakriti@northstarglobal.com', role: 'Tenant Admin', primaryBranch: 'Kathmandu Head Office', secondaryOffices: ['Sydney Liaison Office'], status: 'active' },
      { name: 'Suman Rana', email: 'suman@northstarglobal.com', role: 'Branch Manager', primaryBranch: 'Pokhara Admissions Hub', secondaryOffices: [], status: 'active' },
      { name: 'Jordan Blake', email: 'jordan@northstarglobal.com', role: 'Visa Lead', primaryBranch: 'Sydney Liaison Office', secondaryOffices: [], status: 'active' },
    ],
    roleSeeds: [
      { roleName: 'Tenant Admin', scope: 'All branches', modules: ['CRM', 'Applications', 'Finance', 'Automation'], branches: ['All'], preset: 'standard' },
      { roleName: 'Branch Manager', scope: 'Regional branch', modules: ['CRM', 'Applications', 'Reports'], branches: ['Kathmandu Head Office', 'Pokhara Admissions Hub'], preset: 'custom' },
      { roleName: 'Counsellor', scope: 'Assigned pipeline', modules: ['CRM', 'Follow-ups', 'Documents'], branches: ['Kathmandu Head Office'], preset: 'standard' },
    ],
    partnerSeeds: [
      { name: 'Aurora Pathways', type: 'partner', region: 'Canada', mappedBranch: 'Kathmandu Head Office', status: 'active' },
      { name: 'GlobalNest Alliance', type: 'super_agent', region: 'Australia', mappedBranch: 'Sydney Liaison Office', status: 'active' },
      { name: 'PrepBridge Pokhara', type: 'sub_agent', region: 'Pokhara Valley', mappedBranch: 'Pokhara Admissions Hub', status: 'active' },
    ],
    workflowSeeds: [
      { name: 'Lead to Offer Pipeline', stageCount: 12, owner: 'Launch Operations', status: 'complete' },
      { name: 'Visa Readiness Workflow', stageCount: 9, owner: 'Compliance Lead', status: 'complete' },
      { name: 'Partner Referral Intake', stageCount: 5, owner: 'Partner Desk', status: 'in_progress' },
    ],
    automationSeeds: [
      { name: 'Birthday Follow-up', trigger: 'Birthday', enabled: true, status: 'ready', channel: 'Email + WhatsApp', scope: 'All branches' },
      { name: 'New Contact Triage', trigger: 'New lead', enabled: true, status: 'ready', channel: 'CRM + Email', scope: 'All branches' },
      { name: 'Visa Expiry Reminder', trigger: 'Visa expiry', enabled: true, status: 'ready', channel: 'Email', scope: 'Visa team' },
      { name: 'Offer Deadline Escalation', trigger: 'Stage change', enabled: true, status: 'partial', channel: 'Email + Task', scope: 'Applications' },
    ],
    serviceSeeds: [
      { name: 'Branding rollout', status: 'complete', owner: 'Owner PMO', eta: 'Done' },
      { name: 'Branch SOP sign-off', status: 'complete', owner: 'Launch Operations', eta: 'Done' },
      { name: 'Partner commission rules', status: 'in_progress', owner: 'Finance Ops', eta: '2 days' },
    ],
    activitySeeds: [
      { title: 'Quarterly import validated', description: 'Owner template sync completed for new automation blocks.', type: 'import', timestamp: '2026-03-21T15:10:00.000Z', actor: 'Owner PMO' },
      { title: 'Sydney branch performance up 18%', description: 'Lead-to-application velocity improved after counsellor redistribution.', type: 'performance', timestamp: '2026-03-20T13:00:00.000Z', actor: 'Executive Analytics' },
    ],
    auditSeeds: [
      { actor: 'Arjun Shrestha', action: 'Template applied', target: 'Automation preset library', timestamp: '2026-03-21T15:10:00.000Z', outcome: 'success' },
      { actor: 'Owner PMO', action: 'Role matrix copied', target: 'NorthStar Global Education', timestamp: '2026-03-14T10:20:00.000Z', outcome: 'success' },
    ],
    risks: [
      { severity: 'warning', category: 'automation', title: 'One automation remains in partial readiness', description: 'Offer deadline escalation still uses the legacy email routing map.', createdAt: '2026-03-21T08:00:00.000Z', nextAction: 'Reassign escalation owner and republish automation.' },
    ],
  },
  {
    id: 'atlas-admission-hub',
    tenantId: 'TEN-002',
    name: 'Atlas Admission Hub',
    country: 'United Arab Emirates',
    headOffice: 'Atlas Central',
    headOfficeCity: 'Dubai',
    countries: ['Australia', 'Canada', 'Germany'],
    status: 'onboarding',
    plan: 'Growth',
    setupCompletion: 71,
    healthStatus: 'attention',
    automationStatus: 'partial',
    partnerSetupStatus: 'partial',
    lastActivity: '2026-03-22T08:20:00.000Z',
    onboardingStartedAt: '2026-02-02T09:30:00.000Z',
    tags: ['owner-review', 'regional-expansion'],
    subscription: {
      plan: 'Growth',
      renewalDate: '2026-08-02T00:00:00.000Z',
      arr: 36000,
      status: 'active',
      seats: 34,
    },
    metrics: {
      branches: 4,
      users: 26,
      leads: 1460,
      students: 302,
      applications: 201,
      visasInProgress: 61,
      overdueFollowUps: 56,
      commissionsPending: 42000,
      revenue: 582000,
      conversionRate: 27,
      visaSuccessRate: 83,
      followUpDiscipline: 71,
      counselorProductivity: 69,
      branchGrowth: 11,
      activityTrend: monthTrend(210, 228, 236, 262, 274, 291),
    },
    setupStatuses: {
      company_info: 'complete',
      branch_setup: 'complete',
      workflows: 'in_progress',
      document_checklist: 'complete',
      partners: 'in_progress',
      super_agents: 'pending',
      sub_agents: 'blocked',
      roles_permissions: 'in_progress',
      users: 'in_progress',
      automation: 'blocked',
      services: 'in_progress',
    },
    branchSeeds: [
      { name: 'Dubai Head Office', city: 'Dubai', country: 'United Arab Emirates', status: 'active', users: 12, leads: 530, students: 115, manager: 'Hiba Nasser' },
      { name: 'Abu Dhabi Satellite', city: 'Abu Dhabi', country: 'United Arab Emirates', status: 'active', users: 6, leads: 284, students: 61, manager: 'Rami Sayegh' },
      { name: 'Sharjah Funnel Desk', city: 'Sharjah', country: 'United Arab Emirates', status: 'planned', users: 4, leads: 221, students: 38, manager: 'Noor Jasim' },
    ],
    userSeeds: [
      { name: 'Hiba Nasser', email: 'hiba@atlasadmissionhub.ae', role: 'Tenant Admin', primaryBranch: 'Dubai Head Office', secondaryOffices: ['Abu Dhabi Satellite'], status: 'active' },
      { name: 'Rami Sayegh', email: 'rami@atlasadmissionhub.ae', role: 'Branch Manager', primaryBranch: 'Abu Dhabi Satellite', secondaryOffices: [], status: 'active' },
      { name: 'Noor Jasim', email: 'noor@atlasadmissionhub.ae', role: 'Operations Analyst', primaryBranch: 'Sharjah Funnel Desk', secondaryOffices: [], status: 'invited' },
    ],
    roleSeeds: [
      { roleName: 'Tenant Admin', scope: 'All branches', modules: ['CRM', 'Applications', 'Finance', 'Automation'], branches: ['All'], preset: 'copied' },
      { roleName: 'Branch Manager', scope: 'Assigned branch', modules: ['CRM', 'Applications', 'Reports'], branches: ['Dubai Head Office', 'Abu Dhabi Satellite'], preset: 'standard' },
      { roleName: 'Operations Analyst', scope: 'Read-only executive', modules: ['Reports', 'Imports', 'Audit'], branches: ['All'], preset: 'custom' },
    ],
    partnerSeeds: [
      { name: 'Westbridge Overseas', type: 'partner', region: 'Germany', mappedBranch: 'Dubai Head Office', status: 'pending' },
      { name: 'Future Path Super Agent', type: 'super_agent', region: 'Canada', mappedBranch: 'Abu Dhabi Satellite', status: 'review' },
      { name: 'Future Path Sub Agent', type: 'sub_agent', region: 'Sharjah', mappedBranch: '', status: 'review' },
    ],
    workflowSeeds: [
      { name: 'Regional Lead Qualification', stageCount: 10, owner: 'Process Architect', status: 'in_progress' },
      { name: 'Visa Documentation Review', stageCount: 8, owner: 'Compliance Lead', status: 'complete' },
      { name: 'Partner Handoff Workflow', stageCount: 6, owner: 'Partner Desk', status: 'blocked' },
    ],
    automationSeeds: [
      { name: 'New Contact Routing', trigger: 'New lead', enabled: true, status: 'ready', channel: 'CRM + Email', scope: 'All branches' },
      { name: 'Follow-up Reminder', trigger: 'Follow-up due', enabled: true, status: 'partial', channel: 'Task + WhatsApp', scope: 'Counsellors' },
      { name: 'Visa Expiry Reminder', trigger: 'Visa expiry', enabled: false, status: 'disabled', channel: 'Email', scope: 'Visa team' },
    ],
    serviceSeeds: [
      { name: 'Branch QA sign-off', status: 'in_progress', owner: 'Launch Operations', eta: '3 days' },
      { name: 'Partner commission mapping', status: 'blocked', owner: 'Finance Ops', eta: 'Waiting on partner branches', dependency: 'Partner setup' },
      { name: 'Automation readiness', status: 'blocked', owner: 'Automation Studio', eta: 'Waiting on SMTP credentials', dependency: 'Infrastructure' },
    ],
    activitySeeds: [
      { title: 'Import validation completed', description: 'Three sections require owner review before confirm.', type: 'import', timestamp: '2026-03-22T08:20:00.000Z', actor: 'Import Center' },
      { title: 'Automation paused', description: 'SMTP verification is blocking outbound owner-approved automations.', type: 'automation', timestamp: '2026-03-20T09:00:00.000Z', actor: 'Automation Studio' },
    ],
    auditSeeds: [
      { actor: 'Arjun Shrestha', action: 'Import reviewed', target: 'Atlas Admission Hub onboarding file', timestamp: '2026-03-22T08:20:00.000Z', outcome: 'warning' },
      { actor: 'Security & RBAC', action: 'Role preset copied', target: 'Growth consultancy starter preset', timestamp: '2026-03-17T11:45:00.000Z', outcome: 'success' },
    ],
    risks: [
      { severity: 'critical', category: 'automation', title: 'Automation setup is blocked', description: 'Owner-level reminders cannot be activated until SMTP and escalation owners are assigned.', createdAt: '2026-03-22T08:10:00.000Z', nextAction: 'Complete SMTP verification and assign fallback workflow owners.' },
      { severity: 'warning', category: 'partners', title: 'Partner branch mapping incomplete', description: 'Two incoming partner records still have no mapped delivery branch.', createdAt: '2026-03-21T16:40:00.000Z', nextAction: 'Resolve branch associations before import confirm.' },
    ],
  },
  {
    id: 'bluepeak-study-network',
    tenantId: 'TEN-003',
    name: 'BluePeak Study Network',
    country: 'Bangladesh',
    headOffice: 'BluePeak House',
    headOfficeCity: 'Dhaka',
    countries: ['Canada', 'Ireland', 'UK'],
    status: 'active',
    plan: 'Scale',
    setupCompletion: 83,
    healthStatus: 'attention',
    automationStatus: 'ready',
    partnerSetupStatus: 'partial',
    lastActivity: '2026-03-21T18:05:00.000Z',
    onboardingStartedAt: '2025-10-10T09:30:00.000Z',
    tags: ['high-volume', 'follow-up-risk'],
    subscription: {
      plan: 'Scale',
      renewalDate: '2026-10-10T00:00:00.000Z',
      arr: 52000,
      status: 'active',
      seats: 48,
    },
    metrics: {
      branches: 5,
      users: 37,
      leads: 2180,
      students: 518,
      applications: 351,
      visasInProgress: 88,
      overdueFollowUps: 118,
      commissionsPending: 59400,
      revenue: 931000,
      conversionRate: 24,
      visaSuccessRate: 79,
      followUpDiscipline: 61,
      counselorProductivity: 74,
      branchGrowth: 13,
      activityTrend: monthTrend(298, 314, 327, 341, 358, 367),
    },
    setupStatuses: {
      company_info: 'complete',
      branch_setup: 'complete',
      workflows: 'complete',
      document_checklist: 'complete',
      partners: 'in_progress',
      super_agents: 'complete',
      sub_agents: 'in_progress',
      roles_permissions: 'complete',
      users: 'complete',
      automation: 'complete',
      services: 'in_progress',
    },
    branchSeeds: [
      { name: 'Dhaka HQ', city: 'Dhaka', country: 'Bangladesh', status: 'active', users: 14, leads: 770, students: 180, manager: 'Farhan Alam' },
      { name: 'Chattogram Branch', city: 'Chattogram', country: 'Bangladesh', status: 'active', users: 8, leads: 430, students: 105, manager: 'Nusrat Jahan' },
      { name: 'Sylhet Branch', city: 'Sylhet', country: 'Bangladesh', status: 'active', users: 6, leads: 301, students: 67, manager: 'Rashed Hossain' },
    ],
    userSeeds: [
      { name: 'Farhan Alam', email: 'farhan@bluepeakstudy.com', role: 'Tenant Admin', primaryBranch: 'Dhaka HQ', secondaryOffices: ['Chattogram Branch'], status: 'active' },
      { name: 'Nusrat Jahan', email: 'nusrat@bluepeakstudy.com', role: 'Branch Manager', primaryBranch: 'Chattogram Branch', secondaryOffices: [], status: 'active' },
      { name: 'Rashed Hossain', email: 'rashed@bluepeakstudy.com', role: 'Counsellor', primaryBranch: 'Sylhet Branch', secondaryOffices: [], status: 'active' },
    ],
    roleSeeds: [
      { roleName: 'Tenant Admin', scope: 'All branches', modules: ['CRM', 'Applications', 'Finance'], branches: ['All'], preset: 'standard' },
      { roleName: 'Counsellor', scope: 'Assigned branch', modules: ['CRM', 'Follow-ups', 'Documents'], branches: ['Dhaka HQ', 'Chattogram Branch', 'Sylhet Branch'], preset: 'standard' },
      { roleName: 'Visa Officer', scope: 'Visa pod', modules: ['Applications', 'Documents', 'Reports'], branches: ['Dhaka HQ'], preset: 'custom' },
    ],
    partnerSeeds: [
      { name: 'Peak Union Partners', type: 'partner', region: 'Ireland', mappedBranch: 'Dhaka HQ', status: 'active' },
      { name: 'Northern Channel', type: 'super_agent', region: 'Canada', mappedBranch: 'Dhaka HQ', status: 'active' },
      { name: 'Campus Lane Chattogram', type: 'sub_agent', region: 'Chattogram', mappedBranch: 'Chattogram Branch', status: 'review' },
    ],
    workflowSeeds: [
      { name: 'Lead Conversion Workflow', stageCount: 11, owner: 'Process Architect', status: 'complete' },
      { name: 'Visa Submission Workflow', stageCount: 8, owner: 'Compliance Lead', status: 'complete' },
      { name: 'Payment Escalation Workflow', stageCount: 6, owner: 'Finance Ops', status: 'complete' },
    ],
    automationSeeds: [
      { name: 'Birthday Outreach', trigger: 'Birthday', enabled: true, status: 'ready', channel: 'WhatsApp', scope: 'All branches' },
      { name: 'Event Reminder', trigger: 'Event', enabled: true, status: 'ready', channel: 'Email', scope: 'Marketing' },
      { name: 'Stage Change Alert', trigger: 'Stage change', enabled: true, status: 'ready', channel: 'Task', scope: 'Applications' },
    ],
    serviceSeeds: [
      { name: 'Partner branch review', status: 'in_progress', owner: 'Partner Desk', eta: '2 days' },
      { name: 'Counsellor SLA coaching', status: 'in_progress', owner: 'Operations Excellence', eta: '5 days' },
      { name: 'Quarterly audit pack', status: 'complete', owner: 'Owner PMO', eta: 'Done' },
    ],
    activitySeeds: [
      { title: 'Overdue follow-up spike detected', description: 'Owner watchlist triggered due to missed follow-up SLA in Dhaka.', type: 'risk', timestamp: '2026-03-21T18:05:00.000Z', actor: 'Executive Analytics' },
      { title: 'Counsellor coaching assigned', description: 'BluePeak leadership accepted the owner recommendations pack.', type: 'service', timestamp: '2026-03-20T12:40:00.000Z', actor: 'Operations Excellence' },
    ],
    auditSeeds: [
      { actor: 'Executive Analytics', action: 'Risk triggered', target: 'Follow-up discipline KPI', timestamp: '2026-03-21T18:05:00.000Z', outcome: 'warning' },
      { actor: 'Owner PMO', action: 'Service checklist updated', target: 'Quarterly audit pack', timestamp: '2026-03-19T16:25:00.000Z', outcome: 'success' },
    ],
    risks: [
      { severity: 'critical', category: 'follow_up', title: 'Overdue follow-ups exceed owner threshold', description: '118 follow-ups are overdue, with concentration in the Dhaka branch.', createdAt: '2026-03-21T17:30:00.000Z', nextAction: 'Launch branch-level SLA recovery plan and reassign dormant records.' },
      { severity: 'warning', category: 'conversion', title: 'Conversion rate below benchmark', description: 'Conversion is trailing similar consultancies by 7 percentage points.', createdAt: '2026-03-20T09:10:00.000Z', nextAction: 'Review lead scoring and counsellor productivity mix.' },
    ],
  },
  {
    id: 'visaverse-consultants',
    tenantId: 'TEN-004',
    name: 'VisaVerse Consultants',
    country: 'Canada',
    headOffice: 'VisaVerse One',
    headOfficeCity: 'Toronto',
    countries: ['Canada', 'USA', 'UK'],
    status: 'suspended',
    plan: 'Scale',
    setupCompletion: 64,
    healthStatus: 'critical',
    automationStatus: 'missing',
    partnerSetupStatus: 'partial',
    lastActivity: '2026-03-18T14:00:00.000Z',
    onboardingStartedAt: '2025-12-12T09:30:00.000Z',
    tags: ['billing-hold', 'owner-escalation'],
    subscription: {
      plan: 'Scale',
      renewalDate: '2026-06-12T00:00:00.000Z',
      arr: 40000,
      status: 'suspended',
      seats: 28,
    },
    metrics: {
      branches: 2,
      users: 17,
      leads: 880,
      students: 164,
      applications: 122,
      visasInProgress: 42,
      overdueFollowUps: 74,
      commissionsPending: 21300,
      revenue: 322000,
      conversionRate: 19,
      visaSuccessRate: 68,
      followUpDiscipline: 48,
      counselorProductivity: 52,
      branchGrowth: -4,
      activityTrend: monthTrend(171, 162, 158, 149, 144, 131),
    },
    setupStatuses: {
      company_info: 'complete',
      branch_setup: 'complete',
      workflows: 'in_progress',
      document_checklist: 'failed',
      partners: 'in_progress',
      super_agents: 'pending',
      sub_agents: 'pending',
      roles_permissions: 'blocked',
      users: 'in_progress',
      automation: 'failed',
      services: 'blocked',
    },
    branchSeeds: [
      { name: 'Toronto Head Office', city: 'Toronto', country: 'Canada', status: 'active', users: 10, leads: 530, students: 101, manager: 'Emma Clarke' },
      { name: 'Mississauga Desk', city: 'Mississauga', country: 'Canada', status: 'standby', users: 3, leads: 122, students: 24, manager: 'Nathan Cole' },
    ],
    userSeeds: [
      { name: 'Emma Clarke', email: 'emma@visaverse.ca', role: 'Tenant Admin', primaryBranch: 'Toronto Head Office', secondaryOffices: [], status: 'active' },
      { name: 'Nathan Cole', email: 'nathan@visaverse.ca', role: 'Branch Manager', primaryBranch: 'Mississauga Desk', secondaryOffices: [], status: 'pending' },
    ],
    roleSeeds: [
      { roleName: 'Tenant Admin', scope: 'All branches', modules: ['CRM', 'Applications', 'Billing'], branches: ['All'], preset: 'standard' },
      { roleName: 'Visa Officer', scope: 'Central visa team', modules: ['Applications', 'Documents'], branches: ['Toronto Head Office'], preset: 'custom' },
    ],
    partnerSeeds: [
      { name: 'MapleTrack', type: 'partner', region: 'USA', mappedBranch: 'Toronto Head Office', status: 'review' },
    ],
    workflowSeeds: [
      { name: 'Visa Renewal Workflow', stageCount: 7, owner: 'Compliance Lead', status: 'failed' },
      { name: 'Lead Re-engagement Workflow', stageCount: 4, owner: 'Process Architect', status: 'in_progress' },
    ],
    automationSeeds: [
      { name: 'Visa Expiry Reminder', trigger: 'Visa expiry', enabled: false, status: 'disabled', channel: 'Email', scope: 'Visa team' },
      { name: 'Dormant Lead Reactivation', trigger: 'No activity', enabled: false, status: 'disabled', channel: 'Email + Task', scope: 'CRM' },
    ],
    serviceSeeds: [
      { name: 'Billing remediation', status: 'blocked', owner: 'Billing Ops', eta: 'Waiting on payment' },
      { name: 'Document checklist rebuild', status: 'failed', owner: 'Compliance Lead', eta: 'Owner review required' },
      { name: 'Role matrix cleanup', status: 'blocked', owner: 'Security & RBAC', eta: 'Awaiting tenant decision' },
    ],
    activitySeeds: [
      { title: 'Subscription suspended', description: 'Owner payment policy triggered temporary tenant suspension.', type: 'billing', timestamp: '2026-03-18T14:00:00.000Z', actor: 'Billing Ops' },
      { title: 'Document import failed', description: 'Checklist import failed due to duplicate document codes.', type: 'import', timestamp: '2026-03-16T09:20:00.000Z', actor: 'Import Center' },
    ],
    auditSeeds: [
      { actor: 'Billing Ops', action: 'Tenant suspended', target: 'Scale plan subscription', timestamp: '2026-03-18T14:00:00.000Z', outcome: 'failed' },
      { actor: 'Import Center', action: 'Checklist import failed', target: 'Document checklist', timestamp: '2026-03-16T09:20:00.000Z', outcome: 'failed' },
    ],
    risks: [
      { severity: 'critical', category: 'billing', title: 'Consultancy is suspended', description: 'Billing hold has frozen onboarding and automations for VisaVerse Consultants.', createdAt: '2026-03-18T14:00:00.000Z', nextAction: 'Resolve billing hold and rerun the automation readiness checklist.' },
      { severity: 'critical', category: 'documents', title: 'Document checklist import failed', description: 'Compliance templates are incomplete, blocking visa workflow activation.', createdAt: '2026-03-16T09:20:00.000Z', nextAction: 'Review failed import report and fix duplicate document codes.' },
    ],
  },
  {
    id: 'origin-pathways',
    tenantId: 'TEN-005',
    name: 'Origin Pathways',
    country: 'Kenya',
    headOffice: 'Origin Square',
    headOfficeCity: 'Nairobi',
    countries: ['Australia', 'Canada', 'France'],
    status: 'trial',
    plan: 'Launch',
    setupCompletion: 58,
    healthStatus: 'critical',
    automationStatus: 'partial',
    partnerSetupStatus: 'missing',
    lastActivity: '2026-03-22T06:40:00.000Z',
    onboardingStartedAt: '2026-03-01T09:30:00.000Z',
    tags: ['new-tenant', 'import-retry'],
    subscription: {
      plan: 'Launch',
      renewalDate: '2026-04-01T00:00:00.000Z',
      arr: 18000,
      status: 'trial',
      seats: 18,
    },
    metrics: {
      branches: 3,
      users: 12,
      leads: 430,
      students: 88,
      applications: 67,
      visasInProgress: 21,
      overdueFollowUps: 39,
      commissionsPending: 8400,
      revenue: 118000,
      conversionRate: 20,
      visaSuccessRate: 74,
      followUpDiscipline: 58,
      counselorProductivity: 57,
      branchGrowth: 7,
      activityTrend: monthTrend(42, 61, 73, 81, 94, 106),
    },
    setupStatuses: {
      company_info: 'complete',
      branch_setup: 'blocked',
      workflows: 'pending',
      document_checklist: 'pending',
      partners: 'pending',
      super_agents: 'pending',
      sub_agents: 'pending',
      roles_permissions: 'failed',
      users: 'failed',
      automation: 'in_progress',
      services: 'in_progress',
    },
    branchSeeds: [
      { name: 'Nairobi Hub', city: 'Nairobi', country: 'Kenya', status: 'active', users: 6, leads: 240, students: 51, manager: 'Zuri Mwangi' },
      { name: 'Mombasa Desk', city: 'Mombasa', country: 'Kenya', status: 'planned', users: 2, leads: 68, students: 10, manager: 'Kelvin Ouma' },
    ],
    userSeeds: [
      { name: 'Zuri Mwangi', email: 'zuri@originpathways.co.ke', role: 'Tenant Admin', primaryBranch: 'Nairobi Hub', secondaryOffices: [], status: 'active' },
      { name: 'Kelvin Ouma', email: 'kelvin@originpathways.co.ke', role: 'Counsellor', primaryBranch: 'Mombasa Desk', secondaryOffices: [], status: 'pending' },
    ],
    roleSeeds: [
      { roleName: 'Tenant Admin', scope: 'All branches', modules: ['CRM', 'Applications'], branches: ['All'], preset: 'standard' },
      { roleName: 'Counsellor', scope: 'Assigned branch', modules: ['CRM', 'Follow-ups'], branches: ['Nairobi Hub'], preset: 'standard' },
    ],
    partnerSeeds: [],
    workflowSeeds: [
      { name: 'Base Admission Workflow', stageCount: 7, owner: 'Process Architect', status: 'pending' },
      { name: 'Visa Follow-up Workflow', stageCount: 5, owner: 'Compliance Lead', status: 'pending' },
    ],
    automationSeeds: [
      { name: 'Welcome Sequence', trigger: 'New consultancy', enabled: true, status: 'partial', channel: 'Email', scope: 'Owner onboarding' },
      { name: 'Follow-up Reminder', trigger: 'Follow-up due', enabled: true, status: 'partial', channel: 'Task', scope: 'Counsellors' },
    ],
    serviceSeeds: [
      { name: 'Import issue remediation', status: 'failed', owner: 'Import Center', eta: 'Immediate' },
      { name: 'Branch mapping confirmation', status: 'blocked', owner: 'Launch Operations', eta: 'Waiting on owner' },
      { name: 'Starter automation enablement', status: 'in_progress', owner: 'Automation Studio', eta: '1 day' },
    ],
    activitySeeds: [
      { title: 'Import blocked on user references', description: 'Owner upload failed due to duplicate emails and invalid branch names.', type: 'import', timestamp: '2026-03-22T06:40:00.000Z', actor: 'Import Center' },
      { title: 'Trial consultancy created', description: 'Origin Pathways was created manually and is pending structured import completion.', type: 'onboarding', timestamp: '2026-03-01T09:30:00.000Z', actor: 'Owner PMO' },
    ],
    auditSeeds: [
      { actor: 'Import Center', action: 'Validation failed', target: 'Origin Pathways onboarding file', timestamp: '2026-03-22T06:40:00.000Z', outcome: 'failed' },
      { actor: 'Owner PMO', action: 'Consultancy created', target: 'Origin Pathways', timestamp: '2026-03-01T09:30:00.000Z', outcome: 'success' },
    ],
    risks: [
      { severity: 'critical', category: 'import', title: 'Structured onboarding import failed', description: 'Duplicate user emails and invalid branch references are blocking setup completion.', createdAt: '2026-03-22T06:40:00.000Z', nextAction: 'Fix user and branch references, then retry the import wizard.' },
      { severity: 'warning', category: 'partners', title: 'Partner setup has not started', description: 'No partners or agents are configured, limiting referral growth at launch.', createdAt: '2026-03-21T11:20:00.000Z', nextAction: 'Start from the owner partner template library or upload partner sheet.' },
    ],
  },
];

const buildImportJob = (
  id: string,
  consultancyName: string,
  consultancyId: string | undefined,
  sourceFileName: string,
  status: ImportJob['status'],
  scenario: ImportJob['scenario'],
  createdAt: string,
  createdBy: string,
  templateName: string,
  sections: ImportSectionValidation[],
  preview: ImportPreviewSummary,
  result?: ImportJob['result']
): ImportJob => ({
  id,
  consultancyId,
  consultancyName,
  sourceFileName,
  status,
  createdAt,
  createdBy,
  templateName,
  scenario,
  sections,
  preview,
  result,
});

export const importScenarios: ImportScenario[] = [
  {
    id: 'standard-clean',
    name: 'Standard Clean Template',
    description: 'A healthy onboarding file with a few non-blocking warnings.',
    templateName: 'Enterprise owner starter',
    sourceFileName: 'consultancy_master_onboarding_clean.xlsx',
    scenario: 'clean',
    sections: cleanSections,
    preview: createPreview('Aurora Axis Education', {
      branchesToCreate: 4,
      usersToCreate: 18,
      rolesToCreate: 6,
      permissionsToMap: 42,
      partnersToCreate: 8,
      superAgentsToCreate: 2,
      subAgentsToCreate: 3,
      workflowsToCreate: 5,
      automationsToConfigure: 7,
      servicesToInitialize: 8,
    }),
    status: 'validated',
  },
  {
    id: 'owner-review',
    name: 'Owner Review Template',
    description: 'A realistic onboarding file that needs owner review for partner and workflow warnings.',
    templateName: 'Growth consultancy starter',
    sourceFileName: 'consultancy_owner_review_template.xlsx',
    scenario: 'warning',
    sections: warningSections,
    preview: createPreview('SummitGate Study World', {
      branchesToCreate: 3,
      usersToCreate: 13,
      rolesToCreate: 5,
      permissionsToMap: 36,
      partnersToCreate: 6,
      superAgentsToCreate: 1,
      subAgentsToCreate: 2,
      workflowsToCreate: 4,
      automationsToConfigure: 5,
      servicesToInitialize: 7,
    }),
    status: 'pending_review',
  },
  {
    id: 'validation-error',
    name: 'Validation Error Template',
    description: 'A failed onboarding import scenario with duplicate users, branch collisions, and invalid role references.',
    templateName: 'Launch consultancy starter',
    sourceFileName: 'consultancy_validation_errors.xlsx',
    scenario: 'error',
    sections: errorSections,
    preview: createPreview('Origin Pathways', {
      branchesToCreate: 3,
      usersToCreate: 12,
      rolesToCreate: 4,
      permissionsToMap: 26,
      workflowsToCreate: 2,
      automationsToConfigure: 4,
      servicesToInitialize: 6,
    }),
    status: 'failed',
  },
];

export const importJobs: ImportJob[] = [
  buildImportJob(
    'import-001',
    'Atlas Admission Hub',
    'atlas-admission-hub',
    'atlas_q2_owner_review.xlsx',
    'pending_review',
    'warning',
    '2026-03-22T08:00:00.000Z',
    'Arjun Shrestha',
    'Growth consultancy starter',
    warningSections,
    createPreview('Atlas Admission Hub', {
      branchesToCreate: 4,
      usersToCreate: 17,
      rolesToCreate: 5,
      permissionsToMap: 34,
      partnersToCreate: 6,
      superAgentsToCreate: 2,
      subAgentsToCreate: 2,
      workflowsToCreate: 4,
      automationsToConfigure: 5,
      servicesToInitialize: 7,
    })
  ),
  buildImportJob(
    'import-002',
    'Origin Pathways',
    'origin-pathways',
    'origin_master_onboarding.xlsx',
    'failed',
    'error',
    '2026-03-22T06:40:00.000Z',
    'Import Center',
    'Launch consultancy starter',
    errorSections,
    createPreview('Origin Pathways', {
      branchesToCreate: 3,
      usersToCreate: 12,
      rolesToCreate: 4,
      permissionsToMap: 26,
      workflowsToCreate: 2,
      automationsToConfigure: 4,
      servicesToInitialize: 6,
    }),
    {
      created: { company: 1 },
      skipped: ['Partner records deferred because file contained none'],
      failed: ['Users import', 'Roles & permission mapping', 'Branch setup validation'],
    }
  ),
  buildImportJob(
    'import-003',
    'NorthStar Global Education',
    'northstar-global',
    'northstar_automation_refresh.xlsx',
    'completed',
    'clean',
    '2026-03-15T11:10:00.000Z',
    'Owner PMO',
    'Enterprise owner starter',
    cleanSections,
    createPreview('NorthStar Global Education', {
      usersToCreate: 2,
      permissionsToMap: 6,
      workflowsToCreate: 1,
      automationsToConfigure: 3,
      servicesToInitialize: 2,
    }),
    {
      created: { users: 2, automations: 3, workflowConfigs: 1 },
      skipped: ['Company metadata unchanged'],
      failed: [],
    }
  ),
  buildImportJob(
    'import-004',
    'VisaVerse Consultants',
    'visaverse-consultants',
    'visaverse_document_checklist_retry.xlsx',
    'failed',
    'error',
    '2026-03-16T09:20:00.000Z',
    'Import Center',
    'Scale consultancy remediation pack',
    errorSections,
    createPreview('VisaVerse Consultants', {
      usersToCreate: 1,
      permissionsToMap: 4,
      workflowsToCreate: 1,
      automationsToConfigure: 1,
      servicesToInitialize: 2,
    }),
    {
      created: {},
      skipped: ['Branch setup already exists'],
      failed: ['Document checklist import', 'Automation readiness sync'],
    }
  ),
];

export const consultancies: ConsultancyRecord[] = consultancyBlueprints.map((blueprint) => ({
  id: blueprint.id,
  tenantId: blueprint.tenantId,
  name: blueprint.name,
  country: blueprint.country,
  headOffice: blueprint.headOffice,
  headOfficeCity: blueprint.headOfficeCity,
  countries: blueprint.countries,
  status: blueprint.status,
  plan: blueprint.plan,
  subscription: blueprint.subscription,
  setupCompletion: blueprint.setupCompletion,
  healthStatus: blueprint.healthStatus,
  automationStatus: blueprint.automationStatus,
  partnerSetupStatus: blueprint.partnerSetupStatus,
  lastActivity: blueprint.lastActivity,
  onboardingStartedAt: blueprint.onboardingStartedAt,
  tags: blueprint.tags,
  metrics: blueprint.metrics,
  setupSections: buildSetupSections(blueprint.setupStatuses),
  branches: buildBranches(blueprint.id, blueprint.branchSeeds),
  users: buildUsers(blueprint.id, blueprint.userSeeds),
  roles: buildRoles(blueprint.id, blueprint.roleSeeds),
  partners: buildPartners(blueprint.id, blueprint.partnerSeeds),
  workflows: buildWorkflows(blueprint.id, blueprint.workflowSeeds),
  automations: buildAutomations(blueprint.id, blueprint.automationSeeds),
  services: buildServices(blueprint.id, blueprint.serviceSeeds),
  activityFeed: buildActivityFeed(blueprint.id, blueprint.activitySeeds),
  importHistory: importJobs.filter((job) => job.consultancyId === blueprint.id),
  auditLogs: buildAuditLogs(blueprint.id, blueprint.auditSeeds),
  risks: buildRisks(blueprint),
}));
