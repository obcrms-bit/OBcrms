const User = require('../../../models/User');

async function findCompanyUsers({ companyId, role, branchId, compact = false }) {
  const query = {
    companyId,
    isActive: true,
  };

  if (role) {
    query.role = String(role).toLowerCase();
  }

  if (branchId) {
    query.branchId = branchId;
  }

  return User.find(query)
    .select(
      compact
        ? 'name email role primaryRoleKey branchId avatar jobTitle department isOnline lastSeen isHeadOffice managerEnabled countries createdAt'
        : 'name email role primaryRoleKey branchId avatar jobTitle department isOnline lastSeen isHeadOffice managerEnabled countries permissionBundleIds roleId permissions fieldAccessOverrides updatedAt'
    )
    .populate('branchId', 'name code isHeadOffice')
    .sort({ name: 1 })
    .lean();
}

module.exports = {
  findCompanyUsers,
};
