const { sendSuccess, sendError } = require('../../../utils/responseHandler');
const dashboardService = require('./dashboard.service');

exports.getDashboardStats = async (req, res) => {
  try {
    const data = await dashboardService.getDashboardStats({
      companyId: req.companyId,
      user: req.user,
      branchId: req.query.branchId,
    });

    res.set('Cache-Control', 'private, max-age=15, stale-while-revalidate=30');
    return sendSuccess(res, 200, 'Dashboard stats retrieved', data);
  } catch (error) {
    return sendError(
      res,
      error.statusCode || 500,
      error.message || 'Failed to fetch dashboard stats',
      error.details || error.message
    );
  }
};
