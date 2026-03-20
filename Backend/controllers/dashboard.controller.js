const Student = require('../models/Student');
const Applicant = require('../models/Applicant');
const Lead = require('../models/Lead');
const Invoice = require('../models/Invoice');
const Branch = require('../models/Branch');
const TransferRequest = require('../models/TransferRequest');
const Commission = require('../models/Commission');
const University = require('../models/University');
const Course = require('../models/Course');
const BulkImportLog = require('../models/BulkImportLog');
const { sendSuccess, sendError } = require('../utils/responseHandler');
const mongoose = require('mongoose');
const { buildScopedClause, mergeFiltersWithAnd } = require('../services/accessControl.service');

const toMatchStage = (filter) => ({
  $and: Object.entries(filter).map(([key, value]) => ({ [key]: value })),
});

const buildOptionalBranchFilter = (branchId) =>
  mongoose.Types.ObjectId.isValid(branchId) ? { branchId: new mongoose.Types.ObjectId(branchId) } : {};

exports.getDashboardStats = async (req, res) => {
  try {
    const companyId = req.companyId;
    if (!companyId) return sendError(res, 401, 'Tenant context missing');

    const companyObjectId = new mongoose.Types.ObjectId(companyId);
    const scopedBranchId =
      req.query.branchId ||
      (req.user?.effectiveAccess?.isHeadOffice ? '' : req.user?.branchId?._id || req.user?.branchId || '');
    const branchFilter = buildOptionalBranchFilter(scopedBranchId);
    const leadScope = mergeFiltersWithAnd(
      { companyId: companyObjectId, deletedAt: null },
      branchFilter,
      await buildScopedClause(req.user, 'dashboards', {
        branchField: 'branchId',
        assigneeFields: ['assignedCounsellor', 'assignedTo'],
        creatorFields: ['createdByUser'],
        ownerFields: ['ownerUserId'],
      })
    );
    const studentScope = mergeFiltersWithAnd(
      { companyId: companyObjectId, deletedAt: null },
      branchFilter,
      await buildScopedClause(req.user, 'dashboards', {
        branchField: 'branchId',
        assigneeFields: ['assignedCounselor'],
        creatorFields: ['createdByUser'],
        ownerFields: ['assignedCounselor'],
      })
    );
    const applicationScope = mergeFiltersWithAnd(
      { companyId: companyObjectId },
      branchFilter,
      await buildScopedClause(req.user, 'applications', {
        branchField: 'branchId',
        assigneeFields: ['assignedOfficer'],
        creatorFields: ['createdByUser'],
      })
    );
    const invoiceScope = mergeFiltersWithAnd(
      { companyId: companyObjectId },
      branchFilter,
      await buildScopedClause(req.user, 'accounting', {
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
      await buildScopedClause(req.user, 'transfers', {
        branchField: 'fromBranchId',
        creatorFields: ['requestedBy'],
      })
    );
    const branchScope = mergeFiltersWithAnd(
      { companyId: companyObjectId, deletedAt: null },
      await buildScopedClause(req.user, 'branches', {
        branchField: '_id',
      })
    );

    const [
      totalStudents,
      totalLeads,
      totalApplications,
      totalInvoiced,
      totalBranches,
      pendingTransfers,
      pendingCommissions,
      universityCount,
      courseCount,
      importCount,
      branchPerformance,
      slaSummary,
    ] = await Promise.all([
      Student.countDocuments(studentScope),
      Lead.countDocuments(leadScope),
      Applicant.countDocuments(applicationScope),
      Invoice.aggregate([
        { $match: { ...invoiceScope, status: 'paid' } },
        { $group: { _id: null, total: { $sum: '$totalAmount' } } },
      ]),
      Branch.countDocuments(branchScope),
      TransferRequest.countDocuments({ ...transferScope, status: 'pending' }),
      Commission.countDocuments({ companyId: companyObjectId, status: 'pending', ...branchFilter }),
      University.countDocuments({ companyId: companyObjectId, isActive: true }),
      Course.countDocuments({ companyId: companyObjectId, isActive: true }),
      BulkImportLog.countDocuments({ companyId: companyObjectId }),
      Lead.aggregate([
        { $match: toMatchStage(leadScope) },
        {
          $group: {
            _id: {
              branchId: '$branchId',
              branchName: '$branchName',
            },
            leads: { $sum: 1 },
            converted: {
              $sum: {
                $cond: [{ $eq: ['$convertedToStudent', true] }, 1, 0],
              },
            },
            overdueFollowUps: {
              $sum: {
                $size: {
                  $filter: {
                    input: '$followUps',
                    as: 'followUp',
                    cond: { $eq: ['$$followUp.status', 'overdue'] },
                  },
                },
              },
            },
          },
        },
        { $sort: { '_id.branchName': 1 } },
      ]),
      Lead.aggregate([
        { $match: toMatchStage(leadScope) },
        {
          $group: {
            _id: null,
            avgFirstResponseMinutes: { $avg: '$slaMetrics.firstResponseMinutes' },
            avgFirstFollowUpMinutes: { $avg: '$slaMetrics.firstFollowUpMinutes' },
            overdueFollowUpCount: { $sum: '$slaMetrics.overdueFollowUpCount' },
            avgAgingDays: { $avg: '$slaMetrics.agingDays' },
          },
        },
      ]),
    ]);

    // Applications by status
    const applicationsByStatusAgg = await Applicant.aggregate([
      { $match: toMatchStage(applicationScope) },
      { $group: { _id: '$status', count: { $sum: 1 } } },
    ]);
    const applicationsByStatus = applicationsByStatusAgg.reduce((acc, { _id, count }) => {
      acc[_id] = count;
      return acc;
    }, {});

    const data = {
      totalStudents,
      totalLeads,
      totalApplications,
      revenue: totalInvoiced[0]?.total || 0,
      totalBranches,
      pendingTransfers,
      pendingCommissions,
      universityCount,
      courseCount,
      importCount,
      applicationsByStatus,
      branchPerformance: branchPerformance.map((item) => ({
        branchId: item._id?.branchId || null,
        branchName: item._id?.branchName || 'Unassigned',
        leads: item.leads,
        converted: item.converted,
        overdueFollowUps: item.overdueFollowUps,
      })),
      slaSummary: slaSummary[0] || {
        avgFirstResponseMinutes: 0,
        avgFirstFollowUpMinutes: 0,
        overdueFollowUpCount: 0,
        avgAgingDays: 0,
      },
    };

    return sendSuccess(res, 200, 'Dashboard stats retrieved', data);
  } catch (error) {
    return sendError(res, 500, 'Failed to fetch dashboard stats', error.message);
  }
};
