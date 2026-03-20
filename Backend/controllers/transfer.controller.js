const Lead = require('../models/Lead');
const Branch = require('../models/Branch');
const User = require('../models/User');
const Company = require('../models/Company');
const SLAConfig = require('../models/SLAConfig');
const TransferRequest = require('../models/TransferRequest');
const AuditLog = require('../models/AuditLog');
const { sendSuccess, sendError } = require('../utils/responseHandler');
const { hasPermission } = require('../services/accessControl.service');
const { createNotification } = require('../services/notification.service');

const normalizeString = (value) => (value === null || typeof value === 'undefined' ? '' : String(value).trim());

const appendTransferHistory = (lead, transfer, actorId, status, approvedBy = null) => {
  lead.transferHistory = lead.transferHistory || [];
  lead.transferHistory.push({
    fromBranchId: transfer.fromBranchId,
    toBranchId: transfer.toBranchId,
    transferredBy: actorId,
    transferDate: new Date(),
    reason: transfer.reason,
    approvedBy,
    status,
  });
};

const applyTransferToLead = async (lead, transfer, actor) => {
  const targetBranch = await Branch.findOne({
    _id: transfer.toBranchId,
    companyId: lead.companyId,
    deletedAt: null,
  }).select('name');

  lead.branchId = transfer.toBranchId;
  lead.branchName = targetBranch?.name || lead.branchName;
  lead.assignedCounsellor = transfer.toAssigneeId || null;
  lead.assignedTo = transfer.toAssigneeId || null;
  lead.ownerUserId = transfer.toAssigneeId || actor?._id;
  lead.sharedWithBranchIds = [];
  if (transfer.toAssigneeId) {
    lead.assignmentHistory = lead.assignmentHistory || [];
    lead.assignmentHistory.push({
      counsellor: transfer.toAssigneeId,
      assignedAt: new Date(),
      assignedBy: actor?._id,
      reason: `Transferred to ${targetBranch?.name || 'branch'}`,
    });
  }

  appendTransferHistory(lead, transfer, actor?._id, 'completed', transfer.approvedBy || actor?._id);
  lead.activities.push({
    type: 'transfer_completed',
    description: `Lead transferred to ${targetBranch?.name || 'target branch'}`,
    performedBy: actor?._id,
    metadata: {
      transferRequestId: transfer._id,
      fromBranchId: transfer.fromBranchId,
      toBranchId: transfer.toBranchId,
      toAssigneeId: transfer.toAssigneeId,
      reason: transfer.reason,
    },
  });

  await lead.save();
};

exports.getTransferRequests = async (req, res) => {
  try {
    const query = { companyId: req.companyId };
    if (req.query.status) {
      query.status = req.query.status;
    }
    if (!req.user?.effectiveAccess?.isHeadOffice && req.user?.branchId) {
      query.$or = [
        { fromBranchId: req.user.branchId._id || req.user.branchId },
        { toBranchId: req.user.branchId._id || req.user.branchId },
      ];
    }

    const transfers = await TransferRequest.find(query)
      .populate('leadId', 'name firstName lastName serviceType entityType branchName')
      .populate('fromBranchId', 'name code')
      .populate('toBranchId', 'name code')
      .populate('requestedBy', 'name email')
      .populate('approvedBy', 'name email')
      .populate('toAssigneeId', 'name email role')
      .sort({ createdAt: -1 });

    return sendSuccess(res, 200, 'Transfer requests fetched successfully', { transfers });
  } catch (error) {
    return sendError(res, 500, 'Failed to fetch transfer requests', error.message);
  }
};

exports.createTransferRequest = async (req, res) => {
  try {
    const { leadId, toBranchId, toAssigneeId, reason } = req.body;
    if (!leadId || !toBranchId || !normalizeString(reason)) {
      return sendError(res, 400, 'leadId, toBranchId, and reason are required');
    }

    const [lead, targetBranch, targetAssignee, company, slaConfig] = await Promise.all([
      Lead.findOne({ _id: leadId, companyId: req.companyId, deletedAt: null }),
      Branch.findOne({ _id: toBranchId, companyId: req.companyId, deletedAt: null }),
      toAssigneeId
        ? User.findOne({ _id: toAssigneeId, companyId: req.companyId, isActive: true }).select(
          'name email role branchId'
        )
        : null,
      Company.findById(req.companyId).lean(),
      SLAConfig.findOne({ companyId: req.companyId }).lean(),
    ]);

    if (!lead) {
      return sendError(res, 404, 'Lead not found');
    }
    if (!targetBranch) {
      return sendError(res, 404, 'Target branch not found');
    }
    if (lead.ownershipLocked && !hasPermission(req.user, 'leads', 'override')) {
      return sendError(res, 403, 'Lead ownership is locked and cannot be transferred');
    }
    if (toAssigneeId && !targetAssignee) {
      return sendError(res, 404, 'Target assignee not found');
    }

    const requiresApproval = Boolean(
      slaConfig?.transferApprovalRequired || company?.settings?.transferApprovalRequired
    );

    const transfer = await TransferRequest.create({
      companyId: req.companyId,
      leadId: lead._id,
      fromBranchId: lead.branchId,
      toBranchId,
      fromAssigneeId: lead.assignedCounsellor || lead.assignedTo || null,
      toAssigneeId: toAssigneeId || null,
      requestedBy: req.user._id,
      reason: normalizeString(reason),
      status: requiresApproval ? 'pending' : 'completed',
      requiresApproval,
      requestedAt: new Date(),
      completedAt: requiresApproval ? null : new Date(),
      history: [
        {
          status: requiresApproval ? 'pending' : 'completed',
          changedBy: req.user._id,
          changedAt: new Date(),
          notes: normalizeString(reason),
        },
      ],
    });

    lead.activities.push({
      type: requiresApproval ? 'transfer_requested' : 'transfer_completed',
      description: requiresApproval
        ? `Transfer requested to ${targetBranch.name}`
        : `Transferred to ${targetBranch.name}`,
      performedBy: req.user._id,
      metadata: {
        transferRequestId: transfer._id,
        toBranchId,
        toAssigneeId,
        reason: normalizeString(reason),
      },
    });

    if (requiresApproval) {
      appendTransferHistory(lead, transfer, req.user._id, 'pending');
      await lead.save();
      await createNotification({
        companyId: req.companyId,
        branchId: toBranchId,
        type: 'approval',
        title: 'Transfer approval required',
        message: `Transfer requested for ${lead.name || lead.firstName || 'lead'} to ${targetBranch.name}.`,
        entityType: 'transfer',
        entityId: transfer._id,
        link: '/transfers',
        metadata: {
          leadId: lead._id,
          fromBranchId: lead.branchId,
          toBranchId,
        },
      });
    } else {
      transfer.approvedBy = req.user._id;
      await transfer.save();
      await applyTransferToLead(lead, transfer, req.user);
      await createNotification({
        companyId: req.companyId,
        userId: transfer.requestedBy,
        branchId: toBranchId,
        type: 'system',
        title: 'Transfer completed',
        message: `${lead.name || lead.firstName || 'Lead'} moved to ${targetBranch.name}.`,
        entityType: 'transfer',
        entityId: transfer._id,
        link: '/transfers',
      });
    }

    await AuditLog.logAction({
      companyId: req.companyId,
      branchId: req.user?.branchId?._id || req.user?.branchId,
      userId: req.user._id,
      userName: req.user.name,
      userEmail: req.user.email,
      userRole: req.user.role,
      action: requiresApproval ? 'transfer_requested' : 'transfer_completed',
      actionType: 'transfer',
      module: 'transfers',
      resource: 'lead_transfer',
      resourceId: transfer._id,
      targetId: lead._id,
      resourceName: lead.name || lead.firstName,
      changes: {
        after: {
          fromBranchId: lead.branchId,
          toBranchId,
          toAssigneeId,
          requiresApproval,
        },
      },
    });

    return sendSuccess(
      res,
      201,
      requiresApproval ? 'Transfer request submitted successfully' : 'Lead transferred successfully',
      { transfer }
    );
  } catch (error) {
    return sendError(res, 400, 'Failed to create transfer request', error.message);
  }
};

exports.approveTransferRequest = async (req, res) => {
  try {
    const transfer = await TransferRequest.findOne({
      _id: req.params.id,
      companyId: req.companyId,
      status: 'pending',
    });
    if (!transfer) {
      return sendError(res, 404, 'Pending transfer request not found');
    }

    const lead = await Lead.findOne({ _id: transfer.leadId, companyId: req.companyId, deletedAt: null });
    if (!lead) {
      return sendError(res, 404, 'Lead not found');
    }

    transfer.status = 'approved';
    transfer.approvedBy = req.user._id;
    transfer.actedAt = new Date();
    transfer.completedBy = req.user._id;
    transfer.completedAt = new Date();
    transfer.history.push({
      status: 'approved',
      changedBy: req.user._id,
      changedAt: new Date(),
      notes: normalizeString(req.body.notes),
    });
    await transfer.save();

    await applyTransferToLead(lead, transfer, req.user);

    transfer.status = 'completed';
    transfer.history.push({
      status: 'completed',
      changedBy: req.user._id,
      changedAt: new Date(),
      notes: 'Transfer applied',
    });
    await transfer.save();

    await createNotification({
      companyId: req.companyId,
      userId: transfer.requestedBy,
      branchId: transfer.toBranchId,
      type: 'approval',
      title: 'Transfer approved',
      message: `Transfer for ${lead.name || lead.firstName || 'lead'} was approved.`,
      entityType: 'transfer',
      entityId: transfer._id,
      link: '/transfers',
    });

    return sendSuccess(res, 200, 'Transfer request approved successfully', { transfer });
  } catch (error) {
    return sendError(res, 400, 'Failed to approve transfer request', error.message);
  }
};

exports.rejectTransferRequest = async (req, res) => {
  try {
    const { rejectionReason } = req.body;
    const transfer = await TransferRequest.findOne({
      _id: req.params.id,
      companyId: req.companyId,
      status: 'pending',
    });
    if (!transfer) {
      return sendError(res, 404, 'Pending transfer request not found');
    }

    transfer.status = 'rejected';
    transfer.rejectedBy = req.user._id;
    transfer.rejectionReason = normalizeString(rejectionReason);
    transfer.actedAt = new Date();
    transfer.history.push({
      status: 'rejected',
      changedBy: req.user._id,
      changedAt: new Date(),
      notes: normalizeString(rejectionReason),
    });
    await transfer.save();

    const lead = await Lead.findOne({ _id: transfer.leadId, companyId: req.companyId, deletedAt: null });
    if (lead) {
      appendTransferHistory(lead, transfer, req.user._id, 'rejected');
      lead.activities.push({
        type: 'transfer_rejected',
        description: 'Transfer request rejected',
        performedBy: req.user._id,
        metadata: {
          transferRequestId: transfer._id,
          rejectionReason: transfer.rejectionReason,
        },
      });
      await lead.save();
    }

    await createNotification({
      companyId: req.companyId,
      userId: transfer.requestedBy,
      branchId: transfer.fromBranchId,
      type: 'approval',
      title: 'Transfer rejected',
      message: `Transfer request was rejected${transfer.rejectionReason ? `: ${transfer.rejectionReason}` : '.'}`,
      entityType: 'transfer',
      entityId: transfer._id,
      link: '/transfers',
    });

    return sendSuccess(res, 200, 'Transfer request rejected successfully', { transfer });
  } catch (error) {
    return sendError(res, 400, 'Failed to reject transfer request', error.message);
  }
};

exports.cancelTransferRequest = async (req, res) => {
  try {
    const transfer = await TransferRequest.findOne({
      _id: req.params.id,
      companyId: req.companyId,
      status: 'pending',
    });
    if (!transfer) {
      return sendError(res, 404, 'Pending transfer request not found');
    }

    if (
      String(transfer.requestedBy || '') !== String(req.user._id) &&
      !hasPermission(req.user, 'transfers', 'manage')
    ) {
      return sendError(res, 403, 'You do not have permission to cancel this request');
    }

    transfer.status = 'cancelled';
    transfer.actedAt = new Date();
    transfer.history.push({
      status: 'cancelled',
      changedBy: req.user._id,
      changedAt: new Date(),
      notes: normalizeString(req.body.notes),
    });
    await transfer.save();

    return sendSuccess(res, 200, 'Transfer request cancelled successfully', { transfer });
  } catch (error) {
    return sendError(res, 400, 'Failed to cancel transfer request', error.message);
  }
};
