const mongoose = require('mongoose');
const AuditLog = require('../../../models/AuditLog');
const { buildScopedClause, mergeFiltersWithAnd } = require('../../../services/accessControl.service');
const { createHttpError } = require('../../shared/http/createHttpError');
const branchesRepository = require('./branches.repository');

async function logBranchAction(action, branch, context) {
  await AuditLog.logAction({
    companyId: context.companyId,
    userId: context.user._id,
    userName: context.user.name,
    userRole: context.user.role,
    action,
    resource: 'branch',
    resourceId: branch._id,
    resourceName: branch.name,
  });
}

async function createBranch({ companyId, payload, user }) {
  if (!companyId) {
    throw createHttpError(401, 'Tenant context missing');
  }

  const branch = await branchesRepository.createBranch({
    companyId,
    payload,
  });

  await logBranchAction('create', branch, { companyId, user });
  return branch;
}

async function getBranches({ companyId, user }) {
  if (!companyId) {
    throw createHttpError(401, 'Tenant context missing');
  }

  const query = mergeFiltersWithAnd(
    { companyId: new mongoose.Types.ObjectId(companyId), deletedAt: null },
    await buildScopedClause(user, 'branches', {
      branchField: '_id',
    })
  );

  return branchesRepository.findBranches(query);
}

async function updateBranch({ companyId, branchId, payload, user }) {
  if (!companyId) {
    throw createHttpError(401, 'Tenant context missing');
  }

  const branch = await branchesRepository.updateBranch({
    companyId,
    branchId,
    payload,
  });

  if (!branch) {
    throw createHttpError(404, 'Branch not found');
  }

  await logBranchAction('update', branch, { companyId, user });
  return branch;
}

async function deleteBranch({ companyId, branchId, user }) {
  if (!companyId) {
    throw createHttpError(401, 'Tenant context missing');
  }

  const branch = await branchesRepository.softDeleteBranch({
    companyId,
    branchId,
  });

  if (!branch) {
    throw createHttpError(404, 'Branch not found');
  }

  await logBranchAction('delete', branch, { companyId, user });
  return branch;
}

module.exports = {
  createBranch,
  getBranches,
  updateBranch,
  deleteBranch,
};
