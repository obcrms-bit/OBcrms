const Lead = require('../models/Lead');
const User = require('../models/User');
const FunnelStage = require('../models/FunnelStage');
const LostReason = require('../models/LostReason');
const FunnelAutomationRule = require('../models/FunnelAutomationRule');
const { sendSuccess, sendError } = require('../utils/responseHandler');
const { syncLeadAssignments } = require('../services/leadCollaboration.service');
const {
  buildAnalytics,
  buildBoardData,
  buildLeadFilter,
  createBulkTransferRequests,
  ensureDefaultFunnelSetup,
  getTenantFunnelStages,
  moveLeadToStage,
  reorderFunnelStages,
  saveAutomationRule,
  saveFunnelStage,
  saveLostReason,
} = require('../services/funnel.service');

const asyncHandler = (fn) => (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next);

const normalizeIdArray = (value) =>
  Array.from(
    new Set(
      (Array.isArray(value) ? value : String(value || '').split(','))
        .map((entry) => String(entry || '').trim())
        .filter(Boolean)
    )
  );

exports.getBoard = asyncHandler(async (req, res) => {
  const data = await buildBoardData({
    companyId: req.companyId,
    user: req.user,
    query: req.query,
  });

  sendSuccess(res, 200, 'Funnel board fetched successfully', data);
});

exports.getList = asyncHandler(async (req, res) => {
  await ensureDefaultFunnelSetup(req.companyId);

  const page = Math.max(Number(req.query.page || 1), 1);
  const limit = Math.max(Number(req.query.limit || 20), 1);
  const skip = (page - 1) * limit;
  const sortBy = String(req.query.sortBy || 'updatedAt');
  const sortOrder = String(req.query.sortOrder || 'desc') === 'asc' ? 1 : -1;
  const filter = await buildLeadFilter(req.companyId, req.user, req.query);

  const [leads, total, stages] = await Promise.all([
    Lead.find(filter)
      .populate('activeBranchId', 'name code')
      .populate('primaryAssigneeId', 'name email role primaryRoleKey avatar')
      .populate('assigneeIds', 'name email role primaryRoleKey avatar')
      .populate('currentFunnelStageId', 'name key color order isTerminal isWon isLost slaHours')
      .sort({ [sortBy]: sortOrder })
      .skip(skip)
      .limit(limit)
      .lean(),
    Lead.countDocuments(filter),
    getTenantFunnelStages(req.companyId),
  ]);

  sendSuccess(res, 200, 'Funnel list fetched successfully', {
    leads,
    stages,
    pagination: {
      total,
      page,
      limit,
      pages: Math.ceil(total / limit) || 1,
    },
  });
});

exports.getAnalytics = asyncHandler(async (req, res) => {
  const analytics = await buildAnalytics({
    companyId: req.companyId,
    user: req.user,
    query: req.query,
  });

  sendSuccess(res, 200, 'Funnel analytics fetched successfully', analytics);
});

exports.getSettings = asyncHandler(async (req, res) => {
  await ensureDefaultFunnelSetup(req.companyId);
  const [stages, lostReasons, automations] = await Promise.all([
    FunnelStage.find({ companyId: req.companyId }).sort({ order: 1, createdAt: 1 }).lean(),
    LostReason.find({ companyId: req.companyId }).sort({ order: 1, createdAt: 1 }).lean(),
    FunnelAutomationRule.find({ companyId: req.companyId })
      .populate('triggerStageId', 'name key')
      .sort({ order: 1, createdAt: 1 })
      .lean(),
  ]);

  sendSuccess(res, 200, 'Funnel settings fetched successfully', {
    stages,
    lostReasons,
    automations,
  });
});

exports.getStages = asyncHandler(async (req, res) => {
  const stages = await getTenantFunnelStages(req.companyId);
  sendSuccess(res, 200, 'Funnel stages fetched successfully', { stages });
});

exports.saveStage = asyncHandler(async (req, res) => {
  const stage = await saveFunnelStage(req.companyId, {
    ...req.body,
    id: req.params.id || req.body.id,
  });

  sendSuccess(res, 200, 'Funnel stage saved successfully', { stage });
});

exports.reorderStages = asyncHandler(async (req, res) => {
  const stages = await reorderFunnelStages(req.companyId, normalizeIdArray(req.body.stageIds));
  sendSuccess(res, 200, 'Funnel stages reordered successfully', { stages });
});

exports.getLostReasons = asyncHandler(async (req, res) => {
  await ensureDefaultFunnelSetup(req.companyId);
  const lostReasons = await LostReason.find({ companyId: req.companyId })
    .sort({ order: 1, createdAt: 1 })
    .lean();
  sendSuccess(res, 200, 'Lost reasons fetched successfully', { lostReasons });
});

exports.saveLostReason = asyncHandler(async (req, res) => {
  const lostReason = await saveLostReason(req.companyId, {
    ...req.body,
    id: req.params.id || req.body.id,
  });
  sendSuccess(res, 200, 'Lost reason saved successfully', { lostReason });
});

exports.getAutomations = asyncHandler(async (req, res) => {
  await ensureDefaultFunnelSetup(req.companyId);
  const automations = await FunnelAutomationRule.find({ companyId: req.companyId })
    .populate('triggerStageId', 'name key')
    .sort({ order: 1, createdAt: 1 })
    .lean();
  sendSuccess(res, 200, 'Funnel automations fetched successfully', { automations });
});

exports.saveAutomation = asyncHandler(async (req, res) => {
  const automation = await saveAutomationRule(req.companyId, {
    ...req.body,
    id: req.params.id || req.body.id,
  });
  sendSuccess(res, 200, 'Funnel automation saved successfully', { automation });
});

exports.moveLead = asyncHandler(async (req, res) => {
  const lead = await Lead.findOne({
    _id: req.params.id,
    companyId: req.companyId,
    deletedAt: null,
  });
  if (!lead) {
    return sendError(res, 404, 'Lead not found');
  }

  try {
    const stage = await moveLeadToStage({
      companyId: req.companyId,
      lead,
      stageIdentifier: req.body.stageId || req.body.stageKey || req.body.status,
      actor: req.user,
      payload: req.body,
    });

    const updatedLead = await Lead.findById(lead._id)
      .populate('activeBranchId', 'name code')
      .populate('primaryAssigneeId', 'name email role primaryRoleKey avatar')
      .populate('assigneeIds', 'name email role primaryRoleKey avatar')
      .populate('currentFunnelStageId', 'name key color order isTerminal isWon isLost slaHours');

    return sendSuccess(res, 200, 'Lead moved through Funnel successfully', {
      lead: updatedLead,
      stage,
    });
  } catch (error) {
    return sendError(res, 400, error.message, error.validationErrors || error.stack);
  }
});

exports.bulkMove = asyncHandler(async (req, res) => {
  const leadIds = normalizeIdArray(req.body.leadIds);
  const leads = await Lead.find({
    _id: { $in: leadIds },
    companyId: req.companyId,
    deletedAt: null,
  });

  const moved = [];
  const failed = [];
  for (const lead of leads) {
    try {
      const stage = await moveLeadToStage({
        companyId: req.companyId,
        lead,
        stageIdentifier: req.body.stageId || req.body.stageKey,
        actor: req.user,
        payload: req.body,
      });
      moved.push({ leadId: lead._id, stageId: stage._id, stageKey: stage.key });
    } catch (error) {
      failed.push({ leadId: lead._id, message: error.message });
    }
  }

  sendSuccess(res, 200, 'Bulk Funnel move completed', {
    moved,
    failed,
  });
});

exports.bulkAssign = asyncHandler(async (req, res) => {
  const leadIds = normalizeIdArray(req.body.leadIds);
  const userIds = normalizeIdArray(req.body.userIds);
  const primaryAssigneeId = String(req.body.primaryAssigneeId || userIds[0] || '').trim();

  const users = await User.find({
    companyId: req.companyId,
    _id: { $in: [...userIds, primaryAssigneeId].filter(Boolean) },
    isActive: true,
  }).lean();
  if ([...userIds, primaryAssigneeId].filter(Boolean).length !== users.length) {
    return sendError(res, 400, 'One or more assignees do not belong to this tenant.');
  }

  const leads = await Lead.find({
    _id: { $in: leadIds },
    companyId: req.companyId,
    deletedAt: null,
  });

  for (const lead of leads) {
    lead.assigneeIds = Array.from(new Set([...userIds, primaryAssigneeId].filter(Boolean)));
    lead.primaryAssigneeId = primaryAssigneeId || null;
    lead.assignedCounsellor = primaryAssigneeId || null;
    lead.assignedTo = primaryAssigneeId || null;
    lead.ownerUserId = primaryAssigneeId || lead.createdByUser || lead.ownerUserId || null;
    await lead.save();
    await syncLeadAssignments(lead, {
      actorId: req.user?._id,
      reason: 'Bulk Funnel assignment',
    });
  }

  sendSuccess(res, 200, 'Bulk Funnel assignment completed', {
    updatedLeadCount: leads.length,
  });
});

exports.bulkTransfer = asyncHandler(async (req, res) => {
  try {
    const transfers = await createBulkTransferRequests({
      companyId: req.companyId,
      leadIds: normalizeIdArray(req.body.leadIds),
      toBranchId: req.body.toBranchId,
      toAssigneeId: req.body.toAssigneeId || null,
      reason: req.body.reason,
      actor: req.user,
    });

    return sendSuccess(res, 200, 'Bulk transfer requests created successfully', {
      transfers,
    });
  } catch (error) {
    return sendError(res, 400, error.message);
  }
});
