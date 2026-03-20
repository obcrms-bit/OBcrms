const Commission = require('../models/Commission');
const Agent = require('../models/Agent');
const Lead = require('../models/Lead');
const Student = require('../models/Student');
const AuditLog = require('../models/AuditLog');
const { sendSuccess, sendError } = require('../utils/responseHandler');
const { hasPermission } = require('../services/accessControl.service');

exports.getCommissions = async (req, res) => {
  try {
    const query = { companyId: req.companyId };
    if (!hasPermission(req.user, 'commissions', 'manage') && !hasPermission(req.user, 'commissions', 'approve')) {
      query.agentUserId = req.user._id;
    }
    if (req.query.status) {
      query.status = req.query.status;
    }

    const commissions = await Commission.find(query)
      .populate('agentId', 'name email')
      .populate('leadId', 'name firstName lastName branchName')
      .populate('studentId', 'fullName branchName')
      .sort({ createdAt: -1 });

    return sendSuccess(res, 200, 'Commissions fetched successfully', { commissions });
  } catch (error) {
    return sendError(res, 500, 'Failed to fetch commissions', error.message);
  }
};

exports.createCommission = async (req, res) => {
  try {
    const {
      agentId,
      leadId,
      studentId,
      commissionType,
      commissionAmount,
      notes,
    } = req.body;

    const agent = await Agent.findOne({ _id: agentId, companyId: req.companyId, isActive: true });
    if (!agent) {
      return sendError(res, 404, 'Agent not found');
    }

    const [lead, student] = await Promise.all([
      leadId ? Lead.findOne({ _id: leadId, companyId: req.companyId }) : null,
      studentId ? Student.findOne({ _id: studentId, companyId: req.companyId }) : null,
    ]);

    const branchId = lead?.branchId || student?.branchId || agent.branchId || null;

    const commission = await Commission.create({
      companyId: req.companyId,
      branchId,
      agentId: agent._id,
      agentUserId: agent.userId || null,
      leadId: lead?._id || null,
      studentId: student?._id || null,
      commissionType: commissionType || 'custom',
      amount: Number(commissionAmount || 0),
      notes,
      status: 'pending',
    });

    await AuditLog.logAction({
      companyId: req.companyId,
      branchId,
      userId: req.user._id,
      userName: req.user.name,
      userEmail: req.user.email,
      userRole: req.user.role,
      action: 'commission_created',
      actionType: 'commission',
      module: 'commissions',
      resource: 'commission',
      resourceId: commission._id,
      targetId: commission._id,
      resourceName: commissionType || 'commission',
      changes: { after: req.body },
    });

    return sendSuccess(res, 201, 'Commission created successfully', { commission });
  } catch (error) {
    return sendError(res, 400, 'Failed to create commission', error.message);
  }
};

exports.updateCommissionStatus = async (req, res) => {
  try {
    const commission = await Commission.findOne({ _id: req.params.id, companyId: req.companyId });
    if (!commission) {
      return sendError(res, 404, 'Commission not found');
    }

    commission.status = req.body.status || commission.status;
    if (commission.status === 'approved') {
      commission.approvedBy = req.user._id;
      commission.approvedAt = new Date();
    }
    if (commission.status === 'paid') {
      commission.paidAt = new Date();
    }
    if (req.body.notes) {
      commission.notes = req.body.notes;
    }
    await commission.save();

    return sendSuccess(res, 200, 'Commission status updated successfully', { commission });
  } catch (error) {
    return sendError(res, 400, 'Failed to update commission status', error.message);
  }
};
