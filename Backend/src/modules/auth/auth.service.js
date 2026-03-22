const { createHttpError } = require('../../shared/http/createHttpError');
const { findCompanyUsers } = require('./auth.repository');
const { serializeAuthUser, serializeCompactUser } = require('./auth.presenter');

async function getCurrentUserProfile({ user, company }) {
  if (!user) {
    throw createHttpError(401, 'Authentication required');
  }

  if (!user.isActive || !company) {
    throw createHttpError(404, 'User not found');
  }

  return serializeAuthUser(user, company, {
    branch: user.branchId,
    effectiveAccess: user.effectiveAccess,
  });
}

async function listCompanyUsers({ companyId, role, branchId, compact = false }) {
  if (!companyId) {
    throw createHttpError(401, 'Company context missing - unauthorized');
  }

  const users = await findCompanyUsers({
    companyId,
    role,
    branchId,
    compact,
  });

  if (compact) {
    return {
      users: users.map((user) => serializeCompactUser(user)),
    };
  }

  const enrichedUsers = await Promise.all(
    users.map(async (user) =>
      serializeAuthUser(user, null, {
        branch: user.branchId,
      })
    )
  );

  return {
    users: enrichedUsers,
  };
}

module.exports = {
  getCurrentUserProfile,
  listCompanyUsers,
};
