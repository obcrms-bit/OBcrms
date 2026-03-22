const mongoose = require('mongoose');
const { buildScopedClause, mergeFiltersWithAnd } = require('../../../services/accessControl.service');
const { createHttpError } = require('../../shared/http/createHttpError');
const dashboardRepository = require('./dashboard.repository');

const buildOptionalBranchFilter = (branchId) =>
  mongoose.Types.ObjectId.isValid(branchId) ? { branchId: new mongoose.Types.ObjectId(branchId) } : {};

async function getDashboardStats({ companyId, user, branchId }) {
  if (!companyId) {
    throw createHttpError(401, 'Tenant context missing');
  }

  const companyObjectId = new mongoose.Types.ObjectId(companyId);
  const scopedBranchId =
    branchId ||
    (user?.effectiveAccess?.isHeadOffice ? '' : user?.branchId?._id || user?.branchId || '');
  const branchFilter = buildOptionalBranchFilter(scopedBranchId);

  const leadScope = mergeFiltersWithAnd(
    { companyId: companyObjectId, deletedAt: null },
    branchFilter,
    await buildScopedClause(user, 'dashboards', {
      branchField: 'branchId',
      assigneeFields: ['assignedCounsellor', 'assignedTo'],
      creatorFields: ['createdByUser'],
      ownerFields: ['ownerUserId'],
    })
  );

  const studentScope = mergeFiltersWithAnd(
    { companyId: companyObjectId, deletedAt: null },
    branchFilter,
    await buildScopedClause(user, 'dashboards', {
      branchField: 'branchId',
      assigneeFields: ['assignedCounselor'],
      creatorFields: ['createdByUser'],
      ownerFields: ['assignedCounselor'],
    })
  );

  const applicationScope = mergeFiltersWithAnd(
    { companyId: companyObjectId },
    branchFilter,
    await buildScopedClause(user, 'applications', {
      branchField: 'branchId',
      assigneeFields: ['assignedOfficer'],
      creatorFields: ['createdByUser'],
    })
  );

  const invoiceScope = mergeFiltersWithAnd(
    { companyId: companyObjectId },
    branchFilter,
    await buildScopedClause(user, 'accounting', {
      branchField: 'branchId',
      creatorFields: ['createdByUser'],
    })
  );

  const transferScope = mergeFiltersWithAnd(
    { companyId: companyObjectId },
    scopedBranchId && mongoose.Types.ObjectId.isValid(scopedBranchId)
      ? {
        $or: [
          { fromBranchId: new mongoose.Types.ObjectId(scopedBranchId) },
          { toBranchId: new mongoose.Types.ObjectId(scopedBranchId) },
        ],
      }
      : {},
    await buildScopedClause(user, 'transfers', {
      branchField: 'fromBranchId',
      creatorFields: ['requestedBy'],
    })
  );

  const branchScope = mergeFiltersWithAnd(
    { companyId: companyObjectId, deletedAt: null },
    await buildScopedClause(user, 'branches', {
      branchField: '_id',
    })
  );

  const [overview, applicationsByStatusAgg] = await Promise.all([
    dashboardRepository.fetchOverview({
      companyObjectId,
      leadScope,
      studentScope,
      applicationScope,
      invoiceScope,
      transferScope,
      branchScope,
      branchFilter,
    }),
    dashboardRepository.fetchApplicationsByStatus(applicationScope),
  ]);

  const applicationsByStatus = applicationsByStatusAgg.reduce((accumulator, entry) => {
    accumulator[entry._id] = entry.count;
    return accumulator;
  }, {});

  return {
    totalStudents: overview.totalStudents,
    totalLeads: overview.totalLeads,
    totalApplications: overview.totalApplications,
    revenue: overview.totalInvoiced[0]?.total || 0,
    totalBranches: overview.totalBranches,
    pendingTransfers: overview.pendingTransfers,
    pendingCommissions: overview.pendingCommissions,
    universityCount: overview.universityCount,
    courseCount: overview.courseCount,
    importCount: overview.importCount,
    applicationsByStatus,
    branchPerformance: overview.branchPerformance.map((item) => ({
      branchId: item._id?.branchId || null,
      branchName: item._id?.branchName || 'Unassigned',
      leads: item.leads,
      converted: item.converted,
      overdueFollowUps: item.overdueFollowUps,
    })),
    slaSummary: overview.slaSummary[0] || {
      avgFirstResponseMinutes: 0,
      avgFirstFollowUpMinutes: 0,
      overdueFollowUpCount: 0,
      avgAgingDays: 0,
    },
  };
}

module.exports = {
  getDashboardStats,
};
