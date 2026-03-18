const Branch = require('../models/Branch');
const AuditLog = require('../models/AuditLog');
const { sendSuccess, sendError } = require('../utils/responseHandler');
const mongoose = require('mongoose');

exports.createBranch = async (req, res) => {
  try {
    const branch = await Branch.create({
      ...req.body,
      companyId: new mongoose.Types.ObjectId(req.companyId),
    });

    await AuditLog.logAction({
      companyId: req.companyId,
      userId: req.user._id,
      userName: req.user.name,
      userRole: req.user.role,
      action: 'create',
      resource: 'branch',
      resourceId: branch._id,
      resourceName: branch.name,
    });

    return sendSuccess(res, 201, 'Branch created successfully', branch);
  } catch (error) {
    return sendError(res, 400, 'Failed to create branch', error.message);
  }
};

exports.getBranches = async (req, res) => {
  try {
    const companyObjectId = new mongoose.Types.ObjectId(req.companyId);
    const branches = await Branch.find({ companyId: companyObjectId }).sort({ name: 1 });
    return sendSuccess(res, 200, 'Branches retrieved successfully', branches);
  } catch (error) {
    return sendError(res, 500, 'Failed to fetch branches', error.message);
  }
};

exports.updateBranch = async (req, res) => {
  try {
    const branch = await Branch.findOneAndUpdate(
      { _id: req.params.id, companyId: new mongoose.Types.ObjectId(req.companyId) },
      { $set: req.body },
      { new: true, runValidators: true }
    );

    if (!branch) return sendError(res, 404, 'Branch not found');

    await AuditLog.logAction({
      companyId: req.companyId,
      userId: req.user._id,
      userName: req.user.name,
      userRole: req.user.role,
      action: 'update',
      resource: 'branch',
      resourceId: branch._id,
      resourceName: branch.name,
    });

    return sendSuccess(res, 200, 'Branch updated successfully', branch);
  } catch (error) {
    return sendError(res, 400, 'Failed to update branch', error.message);
  }
};

exports.deleteBranch = async (req, res) => {
  try {
    // We could do soft delete if we add deletedAt to schema,
    // but for now let's just use isActive or hard delete.
    // Based on model, there's no deletedAt, so we use isActive or findByIdAndDelete.
    const branch = await Branch.findOneAndDelete({
      _id: req.params.id,
      companyId: new mongoose.Types.ObjectId(req.companyId),
    });

    if (!branch) return sendError(res, 404, 'Branch not found');

    await AuditLog.logAction({
      companyId: req.companyId,
      userId: req.user._id,
      userName: req.user.name,
      userRole: req.user.role,
      action: 'delete',
      resource: 'branch',
      resourceId: branch._id,
      resourceName: branch.name,
    });

    return sendSuccess(res, 200, 'Branch deleted successfully');
  } catch (error) {
    return sendError(res, 400, 'Failed to delete branch', error.message);
  }
};
