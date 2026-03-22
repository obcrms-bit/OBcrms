const legacyAuthController = require('../../../controllers/auth.controller');
const { sendSuccess, sendError } = require('../../../utils/responseHandler');
const authService = require('./auth.service');

exports.registerCompany = legacyAuthController.registerCompany;
exports.register = legacyAuthController.register;
exports.login = legacyAuthController.login;
exports.logout = legacyAuthController.logout;

exports.getMe = async (req, res) => {
  try {
    const profile = await authService.getCurrentUserProfile({
      user: req.user,
      company: req.company,
    });

    res.set('Cache-Control', 'private, max-age=30, stale-while-revalidate=60');
    return sendSuccess(res, 200, 'User profile retrieved', profile);
  } catch (error) {
    return sendError(
      res,
      error.statusCode || 500,
      error.message || 'Failed to get profile',
      error.details || error.message
    );
  }
};

exports.getCompanyUsers = async (req, res) => {
  try {
    const isCompactView = String(req.query.compact || '').toLowerCase() === 'dashboard';
    const data = await authService.listCompanyUsers({
      companyId: req.companyId,
      role: req.query.role,
      branchId: req.query.branchId,
      compact: isCompactView,
    });

    if (isCompactView) {
      res.set('Cache-Control', 'private, max-age=30, stale-while-revalidate=60');
    }

    return sendSuccess(res, 200, 'Company users retrieved', data);
  } catch (error) {
    return sendError(
      res,
      error.statusCode || 500,
      error.message || 'Failed to get company users',
      error.details || error.message
    );
  }
};
