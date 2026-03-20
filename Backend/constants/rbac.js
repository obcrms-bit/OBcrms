const ACCESS_SCOPES = {
  OWN: 'own',
  CREATED_BY_ME: 'created_by_me',
  ASSIGNED_TO_ME: 'assigned_to_me',
  OWN_BRANCH: 'own_branch',
  ASSIGNED_TO_BRANCH: 'assigned_to_branch',
  TEAM: 'team',
  TENANT: 'tenant',
  HEAD_OFFICE: 'head_office',
  SHARED: 'shared',
};

const MODULES = [
  'leads',
  'followups',
  'documents',
  'accounting',
  'applications',
  'users',
  'branches',
  'roles',
  'permissions',
  'universities',
  'courses',
  'imports',
  'dashboards',
  'commissions',
  'transfers',
  'settings',
  'branding',
  'billing',
  'automations',
  'integrations',
  'publicforms',
  'qrcodes',
  'websiteintegration',
  'audit',
  'sla',
  'notifications',
  'chat',
  'reports',
];

const ACTIONS = [
  'view',
  'create',
  'edit',
  'delete',
  'assign',
  'transfer',
  'approve',
  'reject',
  'export',
  'import',
  'manage',
  'comment',
  'upload',
  'download',
  'convert',
  'override',
  'lock',
  'unlock',
  'complete',
  'reschedule',
  'search',
  'preview',
  'execute',
  'mark_paid',
  'configure',
  'generate',
  'publish',
  'submit',
];

const ROLE_ALIASES = {
  super_admin: 'head_office_admin',
  admin: 'head_office_admin',
  manager: 'branch_manager',
  counselor: 'follow_up_team',
  sales: 'frontdesk',
  follow_up: 'follow_up_team',
};

const DEFAULT_ROLE_TEMPLATES = [
  {
    key: 'head_office_admin',
    name: 'Head Office Admin',
    description: 'Tenant-wide operational leadership with branch oversight.',
    category: 'admin',
    isHeadOffice: true,
    permissions: [
      { module: 'leads', actions: ['manage', 'assign', 'transfer', 'convert', 'export', 'import', 'lock', 'unlock', 'override'], scopes: [ACCESS_SCOPES.TENANT] },
      { module: 'followups', actions: ['manage', 'complete', 'reschedule', 'delete'], scopes: [ACCESS_SCOPES.TENANT] },
      { module: 'documents', actions: ['view', 'upload', 'download', 'manage'], scopes: [ACCESS_SCOPES.TENANT] },
      { module: 'accounting', actions: ['view', 'create', 'edit', 'manage', 'export', 'approve', 'mark_paid'], scopes: [ACCESS_SCOPES.TENANT] },
      { module: 'applications', actions: ['manage', 'create', 'edit', 'approve'], scopes: [ACCESS_SCOPES.TENANT] },
      { module: 'users', actions: ['view', 'create', 'edit', 'manage'], scopes: [ACCESS_SCOPES.TENANT] },
      { module: 'branches', actions: ['view', 'create', 'edit', 'manage'], scopes: [ACCESS_SCOPES.TENANT] },
      { module: 'roles', actions: ['view', 'create', 'edit', 'assign', 'manage'], scopes: [ACCESS_SCOPES.TENANT] },
      { module: 'permissions', actions: ['view', 'create', 'edit', 'assign', 'manage'], scopes: [ACCESS_SCOPES.TENANT] },
      { module: 'universities', actions: ['view', 'create', 'edit', 'delete', 'manage', 'search'], scopes: [ACCESS_SCOPES.TENANT] },
      { module: 'courses', actions: ['view', 'create', 'edit', 'delete', 'manage', 'search'], scopes: [ACCESS_SCOPES.TENANT] },
      { module: 'imports', actions: ['view', 'preview', 'execute', 'manage', 'download'], scopes: [ACCESS_SCOPES.TENANT] },
      { module: 'dashboards', actions: ['view', 'manage'], scopes: [ACCESS_SCOPES.TENANT] },
      { module: 'commissions', actions: ['view', 'create', 'edit', 'approve', 'mark_paid', 'export', 'manage'], scopes: [ACCESS_SCOPES.TENANT] },
      { module: 'transfers', actions: ['view', 'create', 'approve', 'reject', 'manage'], scopes: [ACCESS_SCOPES.TENANT] },
      { module: 'settings', actions: ['view', 'edit', 'manage'], scopes: [ACCESS_SCOPES.TENANT] },
      { module: 'branding', actions: ['view', 'edit', 'manage'], scopes: [ACCESS_SCOPES.TENANT] },
      { module: 'billing', actions: ['view', 'edit', 'manage'], scopes: [ACCESS_SCOPES.TENANT] },
      { module: 'automations', actions: ['view', 'create', 'edit', 'delete', 'manage'], scopes: [ACCESS_SCOPES.TENANT] },
      { module: 'integrations', actions: ['view', 'create', 'edit', 'delete', 'configure', 'manage'], scopes: [ACCESS_SCOPES.TENANT] },
      { module: 'publicforms', actions: ['view', 'create', 'edit', 'delete', 'publish', 'manage'], scopes: [ACCESS_SCOPES.TENANT] },
      { module: 'qrcodes', actions: ['view', 'create', 'edit', 'delete', 'generate', 'manage'], scopes: [ACCESS_SCOPES.TENANT] },
      { module: 'websiteintegration', actions: ['view', 'create', 'edit', 'delete', 'configure', 'manage'], scopes: [ACCESS_SCOPES.TENANT] },
      { module: 'audit', actions: ['view', 'export'], scopes: [ACCESS_SCOPES.TENANT] },
      { module: 'sla', actions: ['view', 'edit', 'manage'], scopes: [ACCESS_SCOPES.TENANT] },
      { module: 'notifications', actions: ['view', 'manage'], scopes: [ACCESS_SCOPES.TENANT] },
      { module: 'reports', actions: ['view', 'export'], scopes: [ACCESS_SCOPES.TENANT] },
      { module: 'chat', actions: ['view', 'create'], scopes: [ACCESS_SCOPES.TENANT] },
    ],
    fieldAccess: {
      'commissions.commissionAmount': 'read-write',
      'accounting.paymentDetails': 'read-write',
      'leads.internalNotes': 'read-write',
      'transfers.overrideControls': 'read-write',
    },
  },
  {
    key: 'branch_manager',
    name: 'Branch Manager',
    description: 'Branch-level operations manager with team visibility.',
    category: 'admin',
    managerEnabled: true,
    permissions: [
      { module: 'leads', actions: ['view', 'create', 'edit', 'assign', 'transfer', 'convert', 'export', 'lock', 'unlock'], scopes: [ACCESS_SCOPES.OWN_BRANCH, ACCESS_SCOPES.TEAM] },
      { module: 'followups', actions: ['view', 'create', 'edit', 'complete', 'reschedule'], scopes: [ACCESS_SCOPES.OWN_BRANCH, ACCESS_SCOPES.TEAM] },
      { module: 'documents', actions: ['view', 'upload', 'download'], scopes: [ACCESS_SCOPES.OWN_BRANCH, ACCESS_SCOPES.TEAM] },
      { module: 'applications', actions: ['view', 'create', 'edit'], scopes: [ACCESS_SCOPES.OWN_BRANCH, ACCESS_SCOPES.TEAM] },
      { module: 'users', actions: ['view', 'create', 'edit'], scopes: [ACCESS_SCOPES.OWN_BRANCH, ACCESS_SCOPES.TEAM] },
      { module: 'branches', actions: ['view'], scopes: [ACCESS_SCOPES.OWN_BRANCH] },
      { module: 'roles', actions: ['view', 'assign'], scopes: [ACCESS_SCOPES.OWN_BRANCH] },
      { module: 'permissions', actions: ['view'], scopes: [ACCESS_SCOPES.OWN_BRANCH] },
      { module: 'universities', actions: ['view', 'create', 'edit', 'search'], scopes: [ACCESS_SCOPES.TENANT] },
      { module: 'courses', actions: ['view', 'create', 'edit', 'search'], scopes: [ACCESS_SCOPES.TENANT] },
      { module: 'imports', actions: ['view', 'preview', 'execute'], scopes: [ACCESS_SCOPES.TENANT] },
      { module: 'dashboards', actions: ['view'], scopes: [ACCESS_SCOPES.OWN_BRANCH, ACCESS_SCOPES.TEAM] },
      { module: 'commissions', actions: ['view'], scopes: [ACCESS_SCOPES.OWN_BRANCH, ACCESS_SCOPES.TEAM] },
      { module: 'transfers', actions: ['view', 'create', 'approve', 'reject'], scopes: [ACCESS_SCOPES.OWN_BRANCH, ACCESS_SCOPES.TENANT] },
      { module: 'settings', actions: ['view'], scopes: [ACCESS_SCOPES.OWN_BRANCH] },
      { module: 'branding', actions: ['view', 'edit'], scopes: [ACCESS_SCOPES.OWN_BRANCH] },
      { module: 'billing', actions: ['view'], scopes: [ACCESS_SCOPES.OWN_BRANCH] },
      { module: 'automations', actions: ['view'], scopes: [ACCESS_SCOPES.OWN_BRANCH] },
      { module: 'integrations', actions: ['view'], scopes: [ACCESS_SCOPES.OWN_BRANCH] },
      { module: 'publicforms', actions: ['view', 'create', 'edit'], scopes: [ACCESS_SCOPES.OWN_BRANCH] },
      { module: 'qrcodes', actions: ['view', 'create', 'generate'], scopes: [ACCESS_SCOPES.OWN_BRANCH] },
      { module: 'websiteintegration', actions: ['view', 'create', 'edit'], scopes: [ACCESS_SCOPES.OWN_BRANCH] },
      { module: 'audit', actions: ['view'], scopes: [ACCESS_SCOPES.OWN_BRANCH] },
      { module: 'sla', actions: ['view'], scopes: [ACCESS_SCOPES.OWN_BRANCH] },
      { module: 'notifications', actions: ['view'], scopes: [ACCESS_SCOPES.OWN_BRANCH, ACCESS_SCOPES.TEAM] },
      { module: 'reports', actions: ['view'], scopes: [ACCESS_SCOPES.OWN_BRANCH, ACCESS_SCOPES.TEAM] },
      { module: 'chat', actions: ['view', 'create'], scopes: [ACCESS_SCOPES.OWN_BRANCH] },
    ],
    fieldAccess: {
      'commissions.commissionAmount': 'read-only',
      'leads.internalNotes': 'read-write',
    },
  },
  {
    key: 'frontdesk',
    name: 'Frontdesk',
    description: 'Lead intake, first response, and document capture.',
    category: 'operations',
    permissions: [
      { module: 'leads', actions: ['view', 'create', 'edit', 'comment'], scopes: [ACCESS_SCOPES.CREATED_BY_ME, ACCESS_SCOPES.OWN_BRANCH] },
      { module: 'followups', actions: ['view', 'create'], scopes: [ACCESS_SCOPES.ASSIGNED_TO_ME, ACCESS_SCOPES.OWN_BRANCH] },
      { module: 'documents', actions: ['view', 'upload'], scopes: [ACCESS_SCOPES.OWN_BRANCH] },
      { module: 'branches', actions: ['view'], scopes: [ACCESS_SCOPES.OWN_BRANCH] },
      { module: 'universities', actions: ['view', 'search'], scopes: [ACCESS_SCOPES.TENANT] },
      { module: 'courses', actions: ['view', 'search'], scopes: [ACCESS_SCOPES.TENANT] },
      { module: 'dashboards', actions: ['view'], scopes: [ACCESS_SCOPES.OWN_BRANCH] },
      { module: 'publicforms', actions: ['view'], scopes: [ACCESS_SCOPES.OWN_BRANCH] },
      { module: 'notifications', actions: ['view'], scopes: [ACCESS_SCOPES.OWN_BRANCH, ACCESS_SCOPES.CREATED_BY_ME] },
      { module: 'chat', actions: ['view', 'create'], scopes: [ACCESS_SCOPES.OWN_BRANCH] },
    ],
    fieldAccess: {
      'commissions.commissionAmount': 'hidden',
      'accounting.paymentDetails': 'hidden',
      'leads.internalNotes': 'hidden',
    },
  },
  {
    key: 'follow_up_team',
    name: 'Follow-up Team',
    description: 'Counsellors and follow-up staff handling the pipeline.',
    category: 'operations',
    permissions: [
      { module: 'leads', actions: ['view', 'edit', 'assign', 'comment', 'convert'], scopes: [ACCESS_SCOPES.ASSIGNED_TO_ME, ACCESS_SCOPES.OWN_BRANCH, ACCESS_SCOPES.TEAM] },
      { module: 'followups', actions: ['view', 'create', 'edit', 'complete', 'reschedule'], scopes: [ACCESS_SCOPES.ASSIGNED_TO_ME, ACCESS_SCOPES.OWN_BRANCH, ACCESS_SCOPES.TEAM] },
      { module: 'documents', actions: ['view', 'upload'], scopes: [ACCESS_SCOPES.ASSIGNED_TO_ME, ACCESS_SCOPES.OWN_BRANCH] },
      { module: 'branches', actions: ['view'], scopes: [ACCESS_SCOPES.OWN_BRANCH] },
      { module: 'universities', actions: ['view', 'search'], scopes: [ACCESS_SCOPES.TENANT] },
      { module: 'courses', actions: ['view', 'search'], scopes: [ACCESS_SCOPES.TENANT] },
      { module: 'dashboards', actions: ['view'], scopes: [ACCESS_SCOPES.ASSIGNED_TO_ME, ACCESS_SCOPES.OWN_BRANCH, ACCESS_SCOPES.TEAM] },
      { module: 'publicforms', actions: ['view'], scopes: [ACCESS_SCOPES.OWN_BRANCH] },
      { module: 'notifications', actions: ['view'], scopes: [ACCESS_SCOPES.ASSIGNED_TO_ME, ACCESS_SCOPES.OWN_BRANCH, ACCESS_SCOPES.TEAM] },
      { module: 'chat', actions: ['view', 'create'], scopes: [ACCESS_SCOPES.OWN_BRANCH] },
    ],
    fieldAccess: {
      'leads.internalNotes': 'read-write',
      'commissions.commissionAmount': 'hidden',
    },
  },
  {
    key: 'accountant',
    name: 'Accountant',
    description: 'Finance and invoice operations.',
    category: 'finance',
    permissions: [
      { module: 'accounting', actions: ['view', 'create', 'edit', 'mark_paid', 'export'], scopes: [ACCESS_SCOPES.OWN_BRANCH, ACCESS_SCOPES.TENANT] },
      { module: 'leads', actions: ['view'], scopes: [ACCESS_SCOPES.OWN_BRANCH] },
      { module: 'branches', actions: ['view'], scopes: [ACCESS_SCOPES.OWN_BRANCH] },
      { module: 'commissions', actions: ['view'], scopes: [ACCESS_SCOPES.OWN_BRANCH, ACCESS_SCOPES.TENANT] },
      { module: 'billing', actions: ['view'], scopes: [ACCESS_SCOPES.OWN_BRANCH, ACCESS_SCOPES.TENANT] },
      { module: 'dashboards', actions: ['view'], scopes: [ACCESS_SCOPES.OWN_BRANCH] },
      { module: 'notifications', actions: ['view'], scopes: [ACCESS_SCOPES.OWN_BRANCH, ACCESS_SCOPES.TENANT] },
      { module: 'reports', actions: ['view'], scopes: [ACCESS_SCOPES.OWN_BRANCH, ACCESS_SCOPES.TENANT] },
      { module: 'chat', actions: ['view', 'create'], scopes: [ACCESS_SCOPES.OWN_BRANCH] },
    ],
    fieldAccess: {
      'commissions.commissionAmount': 'read-write',
      'accounting.paymentDetails': 'read-write',
      'leads.internalNotes': 'hidden',
    },
  },
  {
    key: 'application_officer',
    name: 'Application Officer',
    description: 'Application and documentation processing.',
    category: 'operations',
    permissions: [
      { module: 'applications', actions: ['view', 'create', 'edit'], scopes: [ACCESS_SCOPES.OWN_BRANCH, ACCESS_SCOPES.TEAM] },
      { module: 'documents', actions: ['view', 'upload', 'download'], scopes: [ACCESS_SCOPES.OWN_BRANCH, ACCESS_SCOPES.TEAM] },
      { module: 'leads', actions: ['view', 'convert'], scopes: [ACCESS_SCOPES.OWN_BRANCH, ACCESS_SCOPES.TEAM] },
      { module: 'branches', actions: ['view'], scopes: [ACCESS_SCOPES.OWN_BRANCH] },
      { module: 'universities', actions: ['view', 'search'], scopes: [ACCESS_SCOPES.TENANT] },
      { module: 'courses', actions: ['view', 'search'], scopes: [ACCESS_SCOPES.TENANT] },
      { module: 'dashboards', actions: ['view'], scopes: [ACCESS_SCOPES.OWN_BRANCH] },
      { module: 'publicforms', actions: ['view'], scopes: [ACCESS_SCOPES.OWN_BRANCH] },
      { module: 'notifications', actions: ['view'], scopes: [ACCESS_SCOPES.OWN_BRANCH, ACCESS_SCOPES.TEAM] },
      { module: 'chat', actions: ['view', 'create'], scopes: [ACCESS_SCOPES.OWN_BRANCH] },
    ],
  },
  {
    key: 'agent',
    name: 'Agent',
    description: 'External or internal agents submitting prospective clients.',
    category: 'partner',
    permissions: [
      { module: 'leads', actions: ['view', 'create', 'upload'], scopes: [ACCESS_SCOPES.CREATED_BY_ME, ACCESS_SCOPES.OWN] },
      { module: 'documents', actions: ['upload', 'view'], scopes: [ACCESS_SCOPES.OWN] },
      { module: 'commissions', actions: ['view'], scopes: [ACCESS_SCOPES.OWN] },
      { module: 'dashboards', actions: ['view'], scopes: [ACCESS_SCOPES.OWN] },
      { module: 'publicforms', actions: ['submit', 'view'], scopes: [ACCESS_SCOPES.OWN] },
      { module: 'notifications', actions: ['view'], scopes: [ACCESS_SCOPES.OWN] },
    ],
    fieldAccess: {
      'leads.internalNotes': 'hidden',
      'commissions.commissionAmount': 'read-only',
    },
  },
];

const normalizeRoleKey = (roleKey) => {
  const normalized = String(roleKey || '').trim().toLowerCase();
  return ROLE_ALIASES[normalized] || normalized;
};

const getRoleTemplate = (roleKey) =>
  DEFAULT_ROLE_TEMPLATES.find((template) => template.key === normalizeRoleKey(roleKey)) || null;

const mergePermissionSets = (...permissionSets) => {
  const permissionMap = new Map();

  permissionSets
    .flat()
    .filter(Boolean)
    .forEach((permission) => {
      const key = String(permission.module || '').trim().toLowerCase();
      if (!key) {
        return;
      }

      const existing = permissionMap.get(key) || {
        module: key,
        actions: [],
        scopes: [],
      };

      existing.actions = Array.from(
        new Set([...(existing.actions || []), ...((permission.actions || []).map(String))])
      );
      existing.scopes = Array.from(
        new Set([...(existing.scopes || []), ...((permission.scopes || []).map(String))])
      );

      permissionMap.set(key, existing);
    });

  return Array.from(permissionMap.values());
};

const mergeFieldAccess = (...fieldAccessEntries) =>
  Object.assign({}, ...fieldAccessEntries.filter((entry) => entry && typeof entry === 'object'));

module.exports = {
  ACCESS_SCOPES,
  ACTIONS,
  MODULES,
  ROLE_ALIASES,
  DEFAULT_ROLE_TEMPLATES,
  normalizeRoleKey,
  getRoleTemplate,
  mergePermissionSets,
  mergeFieldAccess,
};
