const User = require('../models/User');
const Role = require('../models/Role');
const PermissionBundle = require('../models/PermissionBundle');
const {
  ACCESS_SCOPES,
  getRoleTemplate,
  mergeFieldAccess,
  mergePermissionSets,
  normalizeRoleKey,
} = require('../constants/rbac');

const EFFECTIVE_ACCESS_CACHE_TTL_MS = 15 * 1000;
const effectiveAccessCache = new Map();

const MODULE_ACTION_ALIASES = {
  dashboards: 'dashboards',
  dashboard: 'dashboards',
  accounting: 'accounting',
  invoices: 'accounting',
  finance: 'accounting',
  lead: 'leads',
  leads: 'leads',
  followups: 'followups',
  followup: 'followups',
  transfers: 'transfers',
  users: 'users',
  branches: 'branches',
  universities: 'universities',
  courses: 'courses',
  imports: 'imports',
  sla: 'sla',
  audit: 'audit',
  notifications: 'notifications',
  notification: 'notifications',
  commissions: 'commissions',
  applications: 'applications',
  reports: 'reports',
  report: 'reports',
  branding: 'branding',
  billing: 'billing',
  automations: 'automations',
  automation: 'automations',
  integrations: 'integrations',
  integration: 'integrations',
  publicforms: 'publicforms',
  public_form: 'publicforms',
  publicformsettings: 'publicforms',
  qrcodes: 'qrcodes',
  qr: 'qrcodes',
  websiteintegration: 'websiteintegration',
  website_integrations: 'websiteintegration',
};

const toObjectIdString = (value) => {
  if (!value) {
    return null;
  }
  return String(value._id || value);
};

const uniq = (items) => Array.from(new Set(items.filter(Boolean).map(String)));

const getEffectiveAccessCacheKey = (user) =>
  [
    toObjectIdString(user?._id),
    toObjectIdString(user?.companyId),
    normalizeRoleKey(user?.primaryRoleKey || user?.role),
    toObjectIdString(user?.roleId),
    Array.isArray(user?.permissionBundleIds)
      ? user.permissionBundleIds.map((value) => toObjectIdString(value)).sort().join(',')
      : '',
    String(Boolean(user?.isHeadOffice)),
    String(Boolean(user?.managerEnabled)),
    user?.updatedAt ? new Date(user.updatedAt).getTime() : '',
  ].join(':');

const pruneEffectiveAccessCache = () => {
  const now = Date.now();
  for (const [key, entry] of effectiveAccessCache.entries()) {
    if (!entry || entry.expiresAt <= now) {
      effectiveAccessCache.delete(key);
    }
  }
};

const normalizePermissions = (permissions = []) =>
  permissions
    .filter((permission) => permission?.module)
    .map((permission) => ({
      module: String(permission.module).trim().toLowerCase(),
      actions: uniq(permission.actions || []).map((value) => value.toLowerCase()),
      scopes: uniq(permission.scopes || []).map((value) => value.toLowerCase()),
    }));

const resolveModuleKey = (moduleKey) =>
  MODULE_ACTION_ALIASES[String(moduleKey || '').trim().toLowerCase()] ||
  String(moduleKey || '').trim().toLowerCase();

const resolveRoleAndBundles = async (user) => {
  const normalizedRoleKey = normalizeRoleKey(user.primaryRoleKey || user.role);
  const [roleDoc, permissionBundles] = await Promise.all([
    user.roleId
      ? Role.findOne({ _id: user.roleId, companyId: user.companyId, isActive: true }).lean()
      : Role.findOne({ companyId: user.companyId, key: normalizedRoleKey, isActive: true }).lean(),
    Array.isArray(user.permissionBundleIds) && user.permissionBundleIds.length
      ? PermissionBundle.find({
        _id: { $in: user.permissionBundleIds },
        companyId: user.companyId,
        isActive: true,
        $or: [{ expiresAt: null }, { expiresAt: { $gt: new Date() } }],
      }).lean()
      : [],
  ]);

  const template = getRoleTemplate(normalizedRoleKey);

  return {
    normalizedRoleKey,
    template,
    roleDoc,
    permissionBundles,
  };
};

const buildEffectiveAccess = async (user) => {
  const cacheKey = getEffectiveAccessCacheKey(user);
  const cachedEntry = effectiveAccessCache.get(cacheKey);
  if (cachedEntry && cachedEntry.expiresAt > Date.now()) {
    return cachedEntry.value;
  }

  const { normalizedRoleKey, template, roleDoc, permissionBundles } = await resolveRoleAndBundles(user);
  const effectivePermissions = normalizePermissions(
    mergePermissionSets(
      template?.permissions || [],
      roleDoc?.permissions || [],
      permissionBundles.flatMap((bundle) => bundle.permissions || []),
      user.permissions || []
    )
  );

  const fieldAccess = mergeFieldAccess(
    template?.fieldAccess || {},
    roleDoc?.fieldAccess || {},
    ...permissionBundles.map((bundle) => bundle.fieldAccess || {}),
    user.fieldAccessOverrides || {}
  );

  const effectiveAccess = {
    roleKey: normalizedRoleKey,
    roleName: roleDoc?.name || template?.name || user.role,
    isHeadOffice: Boolean(user.isHeadOffice || roleDoc?.isHeadOffice || template?.isHeadOffice),
    managerEnabled: Boolean(user.managerEnabled || roleDoc?.managerEnabled || template?.managerEnabled),
    permissions: effectivePermissions,
    fieldAccess,
    bundles: permissionBundles.map((bundle) => ({
      _id: bundle._id,
      key: bundle.key,
      name: bundle.name,
    })),
  };

  if (effectiveAccessCache.size > 500) {
    pruneEffectiveAccessCache();
  }

  effectiveAccessCache.set(cacheKey, {
    value: effectiveAccess,
    expiresAt: Date.now() + EFFECTIVE_ACCESS_CACHE_TTL_MS,
  });

  return effectiveAccess;
};

const getPermissionMatch = (permissions = [], moduleKey, action) => {
  const normalizedModule = resolveModuleKey(moduleKey);
  const normalizedAction = String(action || 'view').trim().toLowerCase();

  return permissions.find((permission) => {
    if (permission.module !== normalizedModule) {
      return false;
    }

    return (
      permission.actions.includes('manage') ||
      permission.actions.includes(normalizedAction) ||
      permission.actions.includes('full_access')
    );
  });
};

const hasPermission = (user, moduleKey, action = 'view') => {
  if (!user) {
    return false;
  }

  if (['super_admin', 'head_office_admin'].includes(normalizeRoleKey(user.primaryRoleKey || user.role))) {
    return true;
  }

  const permissions = user.effectiveAccess?.permissions || [];
  return Boolean(getPermissionMatch(permissions, moduleKey, action));
};

const getFieldAccessLevel = (user, fieldKey, fallback = 'read-write') => {
  const normalizedField = String(fieldKey || '').trim();
  if (!normalizedField) {
    return fallback;
  }
  return user?.effectiveAccess?.fieldAccess?.[normalizedField] || fallback;
};

const getUserBranchIds = (user) =>
  uniq([
    user.branchId,
    ...(Array.isArray(user.additionalBranchIds) ? user.additionalBranchIds : []),
    ...(Array.isArray(user.accessibleBranchIds) ? user.accessibleBranchIds : []),
  ]);

const getManagedUserIds = async (user) => {
  if (!user || !user.effectiveAccess?.managerEnabled) {
    return [];
  }

  const managerId = toObjectIdString(user._id);
  const users = await User.find({
    companyId: user.companyId,
    isActive: true,
    $or: [{ supervisor: managerId }, { reportsTo: managerId }],
  })
    .select('_id')
    .lean();

  return users.map((item) => toObjectIdString(item._id));
};

const buildScopedClause = async (
  user,
  moduleKey,
  {
    branchField = 'branchId',
    assigneeFields = [],
    creatorFields = [],
    ownerFields = [],
    allowTenantFallback = true,
  } = {}
) => {
  if (!user) {
    return { _id: null };
  }

  if (user.effectiveAccess?.isHeadOffice) {
    return {};
  }

  const permission = getPermissionMatch(user.effectiveAccess?.permissions || [], moduleKey, 'view');
  if (!permission && allowTenantFallback && ['super_admin', 'admin'].includes(String(user.role || '').toLowerCase())) {
    return {};
  }

  const scopes = permission?.scopes || [];
  if (scopes.includes(ACCESS_SCOPES.TENANT) || scopes.includes(ACCESS_SCOPES.HEAD_OFFICE)) {
    return {};
  }

  const branchIds = getUserBranchIds(user);
  const managedUserIds = await getManagedUserIds(user);
  const orClauses = [];
  const userId = toObjectIdString(user._id);

  if (scopes.includes(ACCESS_SCOPES.OWN) || scopes.includes(ACCESS_SCOPES.CREATED_BY_ME)) {
    creatorFields.forEach((field) => {
      orClauses.push({ [field]: userId });
    });
    ownerFields.forEach((field) => {
      orClauses.push({ [field]: userId });
    });
  }

  if (scopes.includes(ACCESS_SCOPES.ASSIGNED_TO_ME)) {
    assigneeFields.forEach((field) => {
      orClauses.push({ [field]: userId });
    });
  }

  if (scopes.includes(ACCESS_SCOPES.TEAM) && managedUserIds.length) {
    assigneeFields.forEach((field) => {
      orClauses.push({ [field]: { $in: managedUserIds } });
    });
    creatorFields.forEach((field) => {
      orClauses.push({ [field]: { $in: managedUserIds } });
    });
    ownerFields.forEach((field) => {
      orClauses.push({ [field]: { $in: managedUserIds } });
    });
  }

  if (
    (scopes.includes(ACCESS_SCOPES.OWN_BRANCH) || scopes.includes(ACCESS_SCOPES.ASSIGNED_TO_BRANCH)) &&
    branchField &&
    branchIds.length
  ) {
    orClauses.push({ [branchField]: { $in: branchIds } });
  }

  if (!orClauses.length && branchField && branchIds.length) {
    orClauses.push({ [branchField]: { $in: branchIds } });
  }

  return orClauses.length ? { $or: orClauses } : { _id: null };
};

const mergeFiltersWithAnd = (...filters) => {
  const validFilters = filters.filter((filter) => filter && Object.keys(filter).length);
  if (!validFilters.length) {
    return {};
  }
  if (validFilters.length === 1) {
    return validFilters[0];
  }
  return { $and: validFilters };
};

module.exports = {
  buildEffectiveAccess,
  buildScopedClause,
  getFieldAccessLevel,
  getManagedUserIds,
  getPermissionMatch,
  getUserBranchIds,
  hasPermission,
  mergeFiltersWithAnd,
  normalizePermissions,
  resolveModuleKey,
  toObjectIdString,
};
