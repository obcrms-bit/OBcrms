const Branch = require('../../../models/Branch');
const { buildEffectiveAccess } = require('../../../services/accessControl.service');
const {
  resolveCanonicalRole,
  resolveWorkspaceZone,
} = require('../../../utils/workspaceRoles');

const normalizeBranch = (branchValue) => {
  if (!branchValue) {
    return null;
  }

  if (branchValue.name || branchValue.code || typeof branchValue.isHeadOffice !== 'undefined') {
    return {
      _id: branchValue._id || branchValue.id || branchValue,
      name: branchValue.name || '',
      code: branchValue.code || '',
      isHeadOffice: Boolean(branchValue.isHeadOffice),
    };
  }

  return null;
};

const serializeAuthUser = async (user, company = null, options = {}) => {
  const branch =
    normalizeBranch(options.branch || user.branchId) ||
    (user.branchId
      ? await Branch.findById(user.branchId).select('name code isHeadOffice').lean()
      : null);
  const effectiveAccess = options.effectiveAccess || (await buildEffectiveAccess(user));

  return {
    id: user._id,
    name: user.name,
    email: user.email,
    role: user.role,
    isSuperAdmin: user.role === 'super_admin',
    primaryRoleKey: effectiveAccess.roleKey,
    roleName: effectiveAccess.roleName,
    canonicalRole: resolveCanonicalRole(effectiveAccess.roleKey, user.primaryRoleKey, user.role),
    workspaceZone: resolveWorkspaceZone(effectiveAccess.roleKey, user.primaryRoleKey, user.role),
    companyId: user.companyId,
    tenantId: user.companyId,
    branchId: user.branchId || null,
    branch,
    countries: Array.isArray(user.countries) ? user.countries : [],
    isHeadOffice: effectiveAccess.isHeadOffice,
    managerEnabled: effectiveAccess.managerEnabled,
    effectivePermissions: effectiveAccess.permissions,
    fieldAccess: effectiveAccess.fieldAccess,
    permissionBundles: effectiveAccess.bundles,
    company: company
      ? {
        id: company._id,
        name: company.name,
        settings: company.settings,
        subscription: company.subscription,
      }
      : undefined,
    isActive: user.isActive,
  };
};

const serializeCompactUser = (user) => ({
  _id: user._id,
  id: user._id,
  name: user.name,
  email: user.email,
  role: user.role,
  primaryRoleKey: user.primaryRoleKey || user.role,
  branchId: user.branchId?._id || user.branchId || null,
  branch: normalizeBranch(user.branchId),
  avatar: user.avatar || '',
  jobTitle: user.jobTitle || '',
  department: user.department || '',
  isOnline: Boolean(user.isOnline),
  lastSeen: user.lastSeen || null,
  isHeadOffice: Boolean(user.isHeadOffice),
  managerEnabled: Boolean(user.managerEnabled),
  countries: Array.isArray(user.countries) ? user.countries : [],
  createdAt: user.createdAt || null,
});

module.exports = {
  normalizeBranch,
  serializeAuthUser,
  serializeCompactUser,
};
