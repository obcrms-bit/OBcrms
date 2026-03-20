const mongoose = require('mongoose');
const Lead = require('../models/Lead');
const Applicant = require('../models/Applicant');
const Invoice = require('../models/Invoice');
const Agent = require('../models/Agent');
const Commission = require('../models/Commission');
const PublicLeadForm = require('../models/PublicLeadForm');
const QRCode = require('../models/QRCode');
const { sendSuccess, sendError } = require('../utils/responseHandler');
const { buildScopedClause, mergeFiltersWithAnd } = require('../services/accessControl.service');

const toObjectId = (value) =>
  mongoose.Types.ObjectId.isValid(value) ? new mongoose.Types.ObjectId(value) : null;

const buildOptionalBranchFilter = (branchId) => (toObjectId(branchId) ? { branchId: toObjectId(branchId) } : {});

exports.getReportSummary = async (req, res) => {
  try {
    const companyObjectId = new mongoose.Types.ObjectId(req.companyId);
    const scopedBranchId =
      req.query.branchId ||
      (req.user?.effectiveAccess?.isHeadOffice ? '' : req.user?.branchId?._id || req.user?.branchId || '');
    const branchFilter = buildOptionalBranchFilter(scopedBranchId);

    const leadScope = mergeFiltersWithAnd(
      { companyId: companyObjectId, deletedAt: null },
      branchFilter,
      await buildScopedClause(req.user, 'reports', {
        branchField: 'branchId',
        assigneeFields: ['assignedCounsellor', 'assignedTo'],
        creatorFields: ['createdByUser'],
        ownerFields: ['ownerUserId'],
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

    const [
      leadStatusFunnel,
      applicationStages,
      revenueAgg,
      staffPerformance,
      branchPerformance,
      agentPerformance,
      totals,
      sourcePerformance,
      publicFormTotals,
      qrTotals,
    ] =
      await Promise.all([
        Lead.aggregate([
          { $match: leadScope },
          { $group: { _id: '$pipelineStage', count: { $sum: 1 } } },
          { $sort: { count: -1, _id: 1 } },
        ]),
        Applicant.aggregate([
          { $match: applicationScope },
          { $group: { _id: '$stage', count: { $sum: 1 } } },
          { $sort: { count: -1, _id: 1 } },
        ]),
        Invoice.aggregate([
          { $match: invoiceScope },
          {
            $group: {
              _id: null,
              paidRevenue: {
                $sum: {
                  $cond: [{ $eq: ['$status', 'paid'] }, '$totalAmount', 0],
                },
              },
              outstandingRevenue: {
                $sum: {
                  $cond: [
                    { $in: ['$status', ['draft', 'sent', 'partially-paid', 'overdue']] },
                    '$totalAmount',
                    0,
                  ],
                },
              },
            },
          },
        ]),
        Lead.aggregate([
          { $match: leadScope },
          {
            $group: {
              _id: '$assignedCounsellor',
              leads: { $sum: 1 },
              converted: {
                $sum: { $cond: [{ $eq: ['$convertedToStudent', true] }, 1, 0] },
              },
              overdueFollowUps: { $sum: '$slaMetrics.overdueFollowUpCount' },
              avgLeadScore: { $avg: '$leadScore' },
            },
          },
          {
            $lookup: {
              from: 'users',
              localField: '_id',
              foreignField: '_id',
              as: 'user',
            },
          },
          { $unwind: { path: '$user', preserveNullAndEmptyArrays: true } },
          { $sort: { leads: -1 } },
        ]),
        Lead.aggregate([
          { $match: leadScope },
          {
            $group: {
              _id: { branchId: '$branchId', branchName: '$branchName' },
              leads: { $sum: 1 },
              converted: {
                $sum: { $cond: [{ $eq: ['$convertedToStudent', true] }, 1, 0] },
              },
              avgAgingDays: { $avg: '$slaMetrics.agingDays' },
              overdueFollowUps: { $sum: '$slaMetrics.overdueFollowUpCount' },
            },
          },
          { $sort: { leads: -1 } },
        ]),
        Lead.aggregate([
          { $match: leadScope },
          {
            $group: {
              _id: '$createdByAgentId',
              submissions: { $sum: 1 },
              converted: {
                $sum: { $cond: [{ $eq: ['$convertedToStudent', true] }, 1, 0] },
              },
            },
          },
          {
            $lookup: {
              from: 'agents',
              localField: '_id',
              foreignField: '_id',
              as: 'agent',
            },
          },
          { $unwind: { path: '$agent', preserveNullAndEmptyArrays: true } },
          {
            $lookup: {
              from: 'commissions',
              let: { agentId: '$_id' },
              pipeline: [
                { $match: { $expr: { $eq: ['$agentId', '$$agentId'] }, companyId: companyObjectId } },
                {
                  $group: {
                    _id: null,
                    totalCommission: { $sum: '$amount' },
                    pendingCommission: {
                      $sum: {
                        $cond: [{ $eq: ['$status', 'pending'] }, '$amount', 0],
                      },
                    },
                  },
                },
              ],
              as: 'commissionSummary',
            },
          },
          { $sort: { submissions: -1 } },
        ]),
        Promise.all([
          Lead.countDocuments(leadScope),
          Lead.countDocuments({ ...leadScope, convertedToStudent: true }),
          Applicant.countDocuments(applicationScope),
          Agent.countDocuments({ companyId: companyObjectId, isActive: true, ...branchFilter }),
          Commission.countDocuments({ companyId: companyObjectId, status: 'pending', ...branchFilter }),
        ]),
        Lead.aggregate([
          { $match: leadScope },
          {
            $group: {
              _id: { $ifNull: ['$sourceType', 'manual_entry'] },
              count: { $sum: 1 },
              converted: {
                $sum: { $cond: [{ $eq: ['$convertedToStudent', true] }, 1, 0] },
              },
            },
          },
          { $sort: { count: -1 } },
        ]),
        PublicLeadForm.aggregate([
          { $match: { companyId: companyObjectId, ...(branchFilter.branchId ? { branchId: branchFilter.branchId } : {}) } },
          {
            $group: {
              _id: null,
              forms: { $sum: 1 },
              views: { $sum: '$analytics.views' },
              submissions: { $sum: '$analytics.submissions' },
            },
          },
        ]),
        QRCode.aggregate([
          { $match: { companyId: companyObjectId, ...(branchFilter.branchId ? { branchId: branchFilter.branchId } : {}) } },
          {
            $group: {
              _id: null,
              qrCodes: { $sum: 1 },
              scans: { $sum: '$scanCount' },
              submissions: { $sum: '$submissionCount' },
            },
          },
        ]),
      ]);

    return sendSuccess(res, 200, 'Report summary fetched successfully', {
      totals: {
        leads: totals[0],
        converted: totals[1],
        applications: totals[2],
        activeAgents: totals[3],
        pendingCommissions: totals[4],
        paidRevenue: revenueAgg[0]?.paidRevenue || 0,
        outstandingRevenue: revenueAgg[0]?.outstandingRevenue || 0,
      },
      conversionRate: totals[0] ? Math.round((totals[1] / totals[0]) * 100) : 0,
      leadStatusFunnel: leadStatusFunnel.map((item) => ({
        stage: item._id || 'unassigned',
        count: item.count,
      })),
      applicationStages: applicationStages.map((item) => ({
        stage: item._id || 'draft',
        count: item.count,
      })),
      staffPerformance: staffPerformance.map((row) => ({
        userId: row._id || null,
        name: row.user?.name || 'Unassigned',
        role: row.user?.primaryRoleKey || row.user?.role || '',
        leads: row.leads,
        converted: row.converted,
        overdueFollowUps: row.overdueFollowUps,
        avgLeadScore: Math.round(row.avgLeadScore || 0),
      })),
      branchPerformance: branchPerformance.map((row) => ({
        branchId: row._id?.branchId || null,
        branchName: row._id?.branchName || 'Unassigned',
        leads: row.leads,
        converted: row.converted,
        overdueFollowUps: row.overdueFollowUps,
        avgAgingDays: Math.round(row.avgAgingDays || 0),
      })),
      agentPerformance: agentPerformance.map((row) => ({
        agentId: row._id || null,
        name: row.agent?.name || 'Direct / Internal',
        submissions: row.submissions,
        converted: row.converted,
        totalCommission: row.commissionSummary?.[0]?.totalCommission || 0,
        pendingCommission: row.commissionSummary?.[0]?.pendingCommission || 0,
      })),
      sourcePerformance: sourcePerformance.map((item) => ({
        sourceType: item._id || 'manual_entry',
        count: item.count,
        converted: item.converted,
      })),
      publicCapture: {
        forms: publicFormTotals[0]?.forms || 0,
        formViews: publicFormTotals[0]?.views || 0,
        formSubmissions: publicFormTotals[0]?.submissions || 0,
        qrCodes: qrTotals[0]?.qrCodes || 0,
        qrScans: qrTotals[0]?.scans || 0,
        qrSubmissions: qrTotals[0]?.submissions || 0,
      },
    });
  } catch (error) {
    return sendError(res, 500, 'Failed to fetch report summary', error.message);
  }
};
