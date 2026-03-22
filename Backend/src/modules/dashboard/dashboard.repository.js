const Student = require('../../../models/Student');
const Applicant = require('../../../models/Applicant');
const Lead = require('../../../models/Lead');
const Invoice = require('../../../models/Invoice');
const Branch = require('../../../models/Branch');
const TransferRequest = require('../../../models/TransferRequest');
const Commission = require('../../../models/Commission');
const University = require('../../../models/University');
const Course = require('../../../models/Course');
const BulkImportLog = require('../../../models/BulkImportLog');

const toMatchStage = (filter) => ({
  $and: Object.entries(filter).map(([key, value]) => ({ [key]: value })),
});

async function fetchOverview({
  companyObjectId,
  leadScope,
  studentScope,
  applicationScope,
  invoiceScope,
  transferScope,
  branchScope,
  branchFilter,
}) {
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

  return {
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
  };
}

async function fetchApplicationsByStatus(applicationScope) {
  return Applicant.aggregate([
    { $match: toMatchStage(applicationScope) },
    { $group: { _id: '$status', count: { $sum: 1 } } },
  ]);
}

module.exports = {
  fetchOverview,
  fetchApplicationsByStatus,
};
