const CANONICAL_ROLE_MAP = {
  super_admin: 'SUPER_ADMIN',
  super_admin_manager: 'SUPER_ADMIN_MANAGER',
  head_office_admin: 'TENANT_ADMIN',
  tenant_admin: 'TENANT_ADMIN',
  admin: 'TENANT_ADMIN',
  branch_manager: 'BRANCH_MANAGER',
  branch_admin: 'BRANCH_ADMIN',
  manager: 'BRANCH_MANAGER',
  counselor: 'COUNSELLOR',
  counsellor: 'COUNSELLOR',
  follow_up_team: 'COUNSELLOR',
  accountant: 'FINANCE',
  finance: 'FINANCE',
  application_officer: 'OPERATIONS',
  frontdesk: 'OPERATIONS',
  sales: 'OPERATIONS',
  operations: 'OPERATIONS',
  agent: 'OPERATIONS',
};

const normalizeRoleValue = (roleValue = '') =>
  String(roleValue || '')
    .trim()
    .toLowerCase();

const resolveCanonicalRole = (...roleCandidates) => {
  const normalizedRole = roleCandidates.map(normalizeRoleValue).find(Boolean);
  return CANONICAL_ROLE_MAP[normalizedRole] || 'OPERATIONS';
};

const resolveWorkspaceZone = (...roleCandidates) =>
  ['SUPER_ADMIN', 'SUPER_ADMIN_MANAGER'].includes(resolveCanonicalRole(...roleCandidates))
    ? 'platform'
    : 'tenant';

module.exports = {
  CANONICAL_ROLE_MAP,
  normalizeRoleValue,
  resolveCanonicalRole,
  resolveWorkspaceZone,
};
