const Student = require('../models/Student');
const Applicant = require('../models/Applicant');
const Lead = require('../models/Lead');
const Invoice = require('../models/Invoice');
const { sendSuccess, sendError } = require('../utils/responseHandler');
const mongoose = require('mongoose');

exports.getDashboardStats = async (req, res) => {
  try {
    const companyId = req.companyId;
    if (!companyId) return sendError(res, 401, 'Tenant context missing');

    const companyObjectId = new mongoose.Types.ObjectId(companyId);

    const [totalStudents, totalLeads, totalApplications, totalInvoiced] = await Promise.all([
      Student.countDocuments({ companyId }),
      Lead.countDocuments({ companyId }),
      Applicant.countDocuments({ companyId }),
      Invoice.aggregate([
        { $match: { companyId: companyObjectId, status: 'paid' } },
        { $group: { _id: null, total: { $sum: '$totalAmount' } } },
      ]),
    ]);

    // Applications by status
    const applicationsByStatusAgg = await Applicant.aggregate([
      { $match: { companyId: companyObjectId } },
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
      applicationsByStatus,
    };

    return sendSuccess(res, 200, 'Dashboard stats retrieved', data);
  } catch (error) {
    return sendError(res, 500, 'Failed to fetch dashboard stats', error.message);
  }
};
