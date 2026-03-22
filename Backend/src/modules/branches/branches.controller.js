const { sendSuccess, sendError } = require('../../../utils/responseHandler');
const branchesService = require('./branches.service');

exports.createBranch = async (req, res) => {
  try {
    const branch = await branchesService.createBranch({
      companyId: req.companyId,
      payload: req.body,
      user: req.user,
    });

    return sendSuccess(res, 201, 'Branch created successfully', branch);
  } catch (error) {
    return sendError(
      res,
      error.statusCode || 400,
      error.message || 'Failed to create branch',
      error.details || error.message
    );
  }
};

exports.getBranches = async (req, res) => {
  try {
    const branches = await branchesService.getBranches({
      companyId: req.companyId,
      user: req.user,
    });

    res.set('Cache-Control', 'private, max-age=60, stale-while-revalidate=300');
    return sendSuccess(res, 200, 'Branches retrieved successfully', branches);
  } catch (error) {
    return sendError(
      res,
      error.statusCode || 500,
      error.message || 'Failed to fetch branches',
      error.details || error.message
    );
  }
};

exports.updateBranch = async (req, res) => {
  try {
    const branch = await branchesService.updateBranch({
      companyId: req.companyId,
      branchId: req.params.id,
      payload: req.body,
      user: req.user,
    });

    return sendSuccess(res, 200, 'Branch updated successfully', branch);
  } catch (error) {
    return sendError(
      res,
      error.statusCode || 400,
      error.message || 'Failed to update branch',
      error.details || error.message
    );
  }
};

exports.deleteBranch = async (req, res) => {
  try {
    await branchesService.deleteBranch({
      companyId: req.companyId,
      branchId: req.params.id,
      user: req.user,
    });

    return sendSuccess(res, 200, 'Branch deleted successfully');
  } catch (error) {
    return sendError(
      res,
      error.statusCode || 400,
      error.message || 'Failed to delete branch',
      error.details || error.message
    );
  }
};
