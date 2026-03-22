import { normalizeRoleKey } from '@/src/services/access';

const CANONICAL_ROLE_MAP: Record<string, string> = {
  super_admin: 'SUPER_ADMIN',
  super_admin_manager: 'SUPER_ADMIN_MANAGER',
  head_office_admin: 'TENANT_ADMIN',
  tenant_admin: 'TENANT_ADMIN',
  admin: 'TENANT_ADMIN',
  branch_manager: 'BRANCH_MANAGER',
  branch_admin: 'BRANCH_ADMIN',
  manager: 'BRANCH_MANAGER',
  follow_up_team: 'COUNSELLOR',
  counselor: 'COUNSELLOR',
  counsellor: 'COUNSELLOR',
  accountant: 'FINANCE',
  finance: 'FINANCE',
  application_officer: 'OPERATIONS',
  frontdesk: 'OPERATIONS',
  sales: 'OPERATIONS',
  operations: 'OPERATIONS',
  agent: 'OPERATIONS',
};

export const getCanonicalRole = (user: any) =>
  CANONICAL_ROLE_MAP[normalizeRoleKey(user)] || 'OPERATIONS';

export const isPlatformUser = (user: any) =>
  ['super_admin', 'super_admin_manager'].includes(normalizeRoleKey(user));

export const isTenantUser = (user: any) => Boolean(user) && !isPlatformUser(user);

export const getWorkspaceZone = (user: any) =>
  isPlatformUser(user) ? 'platform' : 'tenant';

export const getDefaultWorkspacePath = (user: any) =>
  isPlatformUser(user) ? '/platform/dashboard' : '/tenant/dashboard';

export const getWorkspaceLabel = (user: any) =>
  isPlatformUser(user) ? 'Platform Control Center' : 'Tenant Workspace';
