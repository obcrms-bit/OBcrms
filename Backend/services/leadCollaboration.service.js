const mongoose = require('mongoose');
const LeadAssignment = require('../models/LeadAssignment');
const LeadBranchTransfer = require('../models/LeadBranchTransfer');
const LeadActivityLog = require('../models/LeadActivityLog');

const toObjectIdString = (value) => {
  if (!value) {
    return '';
  }
  return String(value._id || value);
};

const uniqIds = (values = []) =>
  Array.from(
    new Set(
      values
        .map((value) => toObjectIdString(value))
        .filter(Boolean)
    )
  );

const toObjectId = (value) =>
  mongoose.Types.ObjectId.isValid(value) ? new mongoose.Types.ObjectId(value) : null;

const resolvePrimaryAssigneeId = (lead) =>
  toObjectIdString(
    lead?.primaryAssigneeId || lead?.assignedCounsellor || lead?.assignedTo || lead?.ownerUserId
  );

const resolveAssigneeIds = (lead) => {
  const primaryAssigneeId = resolvePrimaryAssigneeId(lead);
  return uniqIds([...(Array.isArray(lead?.assigneeIds) ? lead.assigneeIds : []), primaryAssigneeId]);
};

const buildAssignmentPayloads = (lead, actorId = null, note = '') => {
  const primaryAssigneeId = resolvePrimaryAssigneeId(lead);
  const assigneeIds = resolveAssigneeIds(lead);

  return assigneeIds.map((userId) => ({
    companyId: lead.companyId,
    leadId: lead._id,
    userId: toObjectId(userId),
    branchId: toObjectId(lead.activeBranchId || lead.branchId) || null,
    assignmentType: userId === primaryAssigneeId ? 'primary' : 'collaborator',
    isPrimary: userId === primaryAssigneeId,
    assignedAt: new Date(),
    assignedBy: toObjectId(actorId) || null,
    active: true,
    unassignedAt: null,
    unassignedBy: null,
    note: note || '',
  }));
};

const syncLeadAssignments = async (lead, { actorId = null, reason = '' } = {}) => {
  if (!lead?._id || !lead?.companyId) {
    return [];
  }

  const desiredAssignments = buildAssignmentPayloads(lead, actorId, reason);
  const desiredUserIds = desiredAssignments.map((entry) => toObjectIdString(entry.userId));
  const existingAssignments = await LeadAssignment.find({
    companyId: lead.companyId,
    leadId: lead._id,
    active: true,
  });

  const existingByUserId = new Map(
    existingAssignments.map((assignment) => [toObjectIdString(assignment.userId), assignment])
  );

  const updates = desiredAssignments.map(async (payload) => {
    const userId = toObjectIdString(payload.userId);
    const existing = existingByUserId.get(userId);

    if (existing) {
      existing.branchId = payload.branchId;
      existing.assignmentType = payload.assignmentType;
      existing.isPrimary = payload.isPrimary;
      existing.assignedBy = payload.assignedBy;
      existing.note = payload.note;
      existing.active = true;
      existing.unassignedAt = null;
      existing.unassignedBy = null;
      return existing.save();
    }

    return LeadAssignment.create(payload);
  });

  const removals = existingAssignments
    .filter((assignment) => !desiredUserIds.includes(toObjectIdString(assignment.userId)))
    .map((assignment) => {
      assignment.active = false;
      assignment.unassignedAt = new Date();
      assignment.unassignedBy = toObjectId(actorId) || null;
      return assignment.save();
    });

  await Promise.all([...updates, ...removals]);

  return LeadAssignment.find({
    companyId: lead.companyId,
    leadId: lead._id,
    active: true,
  })
    .populate('userId', 'name email role primaryRoleKey avatar branchId')
    .populate('assignedBy', 'name email')
    .sort({ isPrimary: -1, assignedAt: 1 });
};

const createLeadActivityLog = async ({
  companyId,
  leadId,
  branchId = null,
  type,
  message,
  createdBy = null,
  metadata = {},
  createdAt = null,
}) => {
  if (!companyId || !leadId || !type || !message) {
    return null;
  }

  try {
    return await LeadActivityLog.create({
      companyId,
      leadId,
      branchId: branchId || null,
      type,
      message,
      createdBy: createdBy || null,
      metadata,
      createdAt: createdAt || new Date(),
    });
  } catch (error) {
    console.error('Lead activity log sync error:', error.message);
    return null;
  }
};

const syncLeadTransferRecord = async ({
  companyId,
  leadId,
  sourceTransferRequestId = null,
  fromBranchId = null,
  toBranchId,
  transferReason,
  transferStatus,
  requestedBy,
  approvedBy = null,
  toAssigneeId = null,
  requestedAt = null,
  transferredAt = null,
  metadata = {},
}) => {
  if (!companyId || !leadId || !toBranchId || !transferReason || !requestedBy) {
    return null;
  }

  const filter =
    sourceTransferRequestId && mongoose.Types.ObjectId.isValid(sourceTransferRequestId)
      ? {
        companyId,
        sourceTransferRequestId,
      }
      : {
        companyId,
        leadId,
        toBranchId,
        requestedBy,
        transferReason,
      };

  return LeadBranchTransfer.findOneAndUpdate(
    filter,
    {
      $set: {
        companyId,
        leadId,
        sourceTransferRequestId: toObjectId(sourceTransferRequestId) || null,
        fromBranchId: toObjectId(fromBranchId) || null,
        toBranchId: toObjectId(toBranchId),
        transferReason,
        transferStatus,
        requestedBy: toObjectId(requestedBy),
        approvedBy: toObjectId(approvedBy) || null,
        toAssigneeId: toObjectId(toAssigneeId) || null,
        requestedAt: requestedAt || new Date(),
        transferredAt:
          transferredAt || (transferStatus === 'completed' ? new Date() : null),
        metadata,
      },
    },
    {
      upsert: true,
      new: true,
      setDefaultsOnInsert: true,
    }
  );
};

module.exports = {
  createLeadActivityLog,
  resolveAssigneeIds,
  resolvePrimaryAssigneeId,
  syncLeadAssignments,
  syncLeadTransferRecord,
  toObjectIdString,
  uniqIds,
};
