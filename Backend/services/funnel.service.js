const mongoose = require('mongoose');
const Lead = require('../models/Lead');
const FunnelStage = require('../models/FunnelStage');
const LeadStageHistory = require('../models/LeadStageHistory');
const FunnelAutomationRule = require('../models/FunnelAutomationRule');
const LostReason = require('../models/LostReason');
const TransferRequest = require('../models/TransferRequest');
const SLAConfig = require('../models/SLAConfig');
const Company = require('../models/Company');
const User = require('../models/User');
const { getTenantLeadStages } = require('./countryWorkflow.service');
const {
  buildScopedClause,
  getManagedUserIds,
  getUserBranchIds,
  hasPermission,
  mergeFiltersWithAnd,
  toObjectIdString,
} = require('./accessControl.service');
const { createNotification } = require('./notification.service');
const { syncLeadAssignments } = require('./leadCollaboration.service');

const DEFAULT_STAGE_COLORS = [
  '#0f172a',
  '#2563eb',
  '#0f766e',
  '#7c3aed',
  '#9333ea',
  '#d97706',
  '#ea580c',
  '#4f46e5',
  '#0891b2',
  '#059669',
  '#be123c',
  '#475569',
];

const DEFAULT_LOST_REASONS = [
  'No response',
  'Budget mismatch',
  'Chose another consultancy',
  'Eligibility issue',
  'Deferred intake',
];

const normalizeKey = (value = '') =>
  String(value || '')
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '');

const formatStageName = (value = '') =>
  String(value || '')
    .replace(/_/g, ' ')
    .replace(/\b\w/g, (character) => character.toUpperCase());

const isObjectId = (value) => mongoose.Types.ObjectId.isValid(value);

const getLeadAssigneeIds = (lead) =>
  Array.from(
    new Set(
      [
        lead?.primaryAssigneeId,
        lead?.assignedCounsellor,
        lead?.assignedTo,
        ...(Array.isArray(lead?.assigneeIds) ? lead.assigneeIds : []),
      ]
        .map((value) => toObjectIdString(value))
        .filter(Boolean)
    )
  );

const buildLeadFilter = async (companyId, user, query = {}) => {
  const filterParts = [
    { companyId, deletedAt: null },
    await buildScopedClause(user, 'leads', {
      branchField: 'activeBranchId',
      assigneeFields: ['primaryAssigneeId', 'assignedCounsellor', 'assignedTo', 'assigneeIds'],
      creatorFields: ['createdByUser'],
      ownerFields: ['ownerUserId'],
    }),
  ];

  if (query.branchId && isObjectId(query.branchId)) {
    filterParts.push({
      $or: [{ activeBranchId: query.branchId }, { branchId: query.branchId }],
    });
  }
  if (query.stageId && isObjectId(query.stageId)) {
    filterParts.push({ currentFunnelStageId: query.stageId });
  }
  if (query.stageKey) {
    filterParts.push({ pipelineStage: normalizeKey(query.stageKey) });
  }
  if (query.search) {
    const pattern = { $regex: String(query.search).trim(), $options: 'i' };
    filterParts.push({
      $or: [
        { name: pattern },
        { firstName: pattern },
        { lastName: pattern },
        { email: pattern },
        { phone: pattern },
        { mobile: pattern },
      ],
    });
  }
  if (query.assigneeScope === 'my') {
    filterParts.push({
      $or: [
        { primaryAssigneeId: user._id },
        { assigneeIds: user._id },
        { assignedCounsellor: user._id },
      ],
    });
  }
  if (query.assigneeScope === 'primary') {
    filterParts.push({ primaryAssigneeId: user._id });
  }
  if (query.assigneeScope === 'team') {
    const managedUserIds = await getManagedUserIds(user);
    if (managedUserIds.length) {
      filterParts.push({
        $or: [
          { primaryAssigneeId: { $in: managedUserIds } },
          { assigneeIds: { $in: managedUserIds } },
        ],
      });
    }
  }
  if (query.assigneeScope === 'branch') {
    const branchIds = getUserBranchIds(user);
    if (branchIds.length) {
      filterParts.push({
        $or: [{ activeBranchId: { $in: branchIds } }, { branchId: { $in: branchIds } }],
      });
    }
  }
  if (query.source) {
    filterParts.push({ source: query.source });
  }
  if (query.priority) {
    filterParts.push({ priority: query.priority });
  }
  if (query.temperature) {
    filterParts.push({ leadTemperature: query.temperature });
  }
  if (query.reactivationOnly) {
    filterParts.push({ priority: 'reactivation_candidate' });
  }
  if (query.overdueOnly) {
    filterParts.push({ nextFollowUp: { $lt: new Date() } });
  }

  return mergeFiltersWithAnd(...filterParts);
};

const ensureDefaultLostReasons = async (companyId) => {
  const existingCount = await LostReason.countDocuments({ companyId });
  if (existingCount) {
    return;
  }

  await LostReason.insertMany(
    DEFAULT_LOST_REASONS.map((label, index) => ({
      companyId,
      label,
      active: true,
      order: index + 1,
    }))
  );
};

const ensureDefaultFunnelStages = async (companyId) => {
  const existingCount = await FunnelStage.countDocuments({ companyId });
  if (existingCount) {
    return;
  }

  const stageBlueprints = await getTenantLeadStages(companyId);
  await FunnelStage.insertMany(
    stageBlueprints.map((stage, index) => ({
      companyId,
      key: normalizeKey(stage.key),
      name: stage.label || formatStageName(stage.key),
      order: Number(stage.order || index + 1),
      color: DEFAULT_STAGE_COLORS[index % DEFAULT_STAGE_COLORS.length],
      stageType:
        normalizeKey(stage.key) === 'lost'
          ? 'lost'
          : normalizeKey(stage.key) === 'enrolled'
            ? 'won'
            : normalizeKey(stage.key).includes('visa')
              ? 'visa'
              : normalizeKey(stage.key).includes('application')
                ? 'application'
                : 'lead',
      isTerminal: ['lost', 'enrolled', 'closed'].includes(normalizeKey(stage.key)),
      isWon: normalizeKey(stage.key) === 'enrolled',
      isLost: normalizeKey(stage.key) === 'lost',
      probability:
        normalizeKey(stage.key) === 'enrolled'
          ? 100
          : normalizeKey(stage.key) === 'lost'
            ? 0
            : Math.min(90, 10 + index * 8),
      slaHours: normalizeKey(stage.key) === 'new' ? 4 : normalizeKey(stage.key) === 'contacted' ? 24 : null,
      requiredActions: {
        noteRequired: false,
        followUpRequired: ['new', 'contacted'].includes(normalizeKey(stage.key)),
        assigneeRequired: index > 0,
        branchRequired: true,
        lostReasonRequired: normalizeKey(stage.key) === 'lost',
        conversionMetadataRequired: normalizeKey(stage.key) === 'enrolled',
      },
      isSystem: true,
      isActive: true,
    }))
  );
};

const ensureDefaultFunnelSetup = async (companyId) => {
  await Promise.all([
    ensureDefaultFunnelStages(companyId),
    ensureDefaultLostReasons(companyId),
  ]);
};

const getTenantFunnelStages = async (companyId) => {
  await ensureDefaultFunnelSetup(companyId);
  return FunnelStage.find({ companyId, isActive: true }).sort({ order: 1, createdAt: 1 }).lean();
};

const getStageByIdentifier = async (companyId, identifier) => {
  if (!identifier) {
    return null;
  }

  const filter = isObjectId(identifier)
    ? { companyId, _id: identifier, isActive: true }
    : { companyId, key: normalizeKey(identifier), isActive: true };

  return FunnelStage.findOne(filter);
};

const validateStageTransition = async ({ lead, targetStage, payload = {} }) => {
  const errors = [];
  const rules = targetStage?.requiredActions || {};
  const pendingFollowUp = (lead.followUps || []).find(
    (item) => ['pending', 'overdue'].includes(item.status)
  );

  if (rules.noteRequired && !String(payload.notes || payload.reason || '').trim()) {
    errors.push('A note is required before moving to this Funnel stage.');
  }
  if (rules.followUpRequired && !payload.followUpAt && !pendingFollowUp && !lead.nextFollowUp) {
    errors.push('A follow-up date is required before moving to this Funnel stage.');
  }
  if (rules.assigneeRequired && !getLeadAssigneeIds(lead).length) {
    errors.push('At least one assignee is required before moving to this Funnel stage.');
  }
  if (rules.branchRequired && !toObjectIdString(lead.activeBranchId || lead.branchId)) {
    errors.push('An active branch is required before moving to this Funnel stage.');
  }
  if (
    (rules.lostReasonRequired || targetStage.isLost) &&
    !String(payload.lostReasonId || payload.lostReasonLabel || lead.lostReasonId || '').trim()
  ) {
    errors.push('A lost reason is required when moving to a lost Funnel stage.');
  }
  if (rules.conversionMetadataRequired && !payload.conversionMetadata) {
    errors.push('Conversion metadata is required before moving to this Funnel stage.');
  }
  if (
    rules.documentChecklistRequired &&
    !Boolean(payload.documentChecklistComplete || lead.metadata?.documentChecklistComplete)
  ) {
    errors.push('Document checklist completion is required before moving to this Funnel stage.');
  }

  return errors;
};

const createFollowUpFromAutomation = (actionConfig = {}, actorId = null) => ({
  scheduledAt:
    actionConfig.scheduledAt ||
    new Date(Date.now() + Number(actionConfig.offsetHours || 24) * 60 * 60 * 1000),
  scheduledBy: actorId || null,
  type: actionConfig.type || 'call',
  notes: actionConfig.notes || 'Auto-created by Funnel automation',
  status: 'pending',
  counsellorName: actionConfig.counsellorName || 'Automation',
});

const runStageAutomationRules = async ({ companyId, lead, stage, actor }) => {
  const rules = await FunnelAutomationRule.find({
    companyId,
    active: true,
    triggerEvent: 'enter_stage',
    $or: [{ triggerStageId: stage._id }, { triggerStageKey: stage.key }],
  }).sort({ order: 1, createdAt: 1 });

  let assignmentsChanged = false;

  for (const rule of rules) {
    const actionConfig = rule.actionConfig || {};

    switch (rule.actionType) {
    case 'assign_user':
      if (actionConfig.userId && isObjectId(actionConfig.userId)) {
        const userId = String(actionConfig.userId);
        lead.primaryAssigneeId = userId;
        lead.assignedCounsellor = userId;
        lead.assignedTo = userId;
        lead.assigneeIds = Array.from(new Set([...(lead.assigneeIds || []), userId]));
        assignmentsChanged = true;
      }
      break;
    case 'assign_branch':
      if (actionConfig.branchId && isObjectId(actionConfig.branchId)) {
        lead.activeBranchId = actionConfig.branchId;
        lead.branchId = actionConfig.branchId;
      }
      break;
    case 'create_reminder':
      lead.followUps = lead.followUps || [];
      lead.followUps.push(createFollowUpFromAutomation(actionConfig, actor?._id));
      break;
    case 'add_tag':
      if (actionConfig.tag) {
        lead.tags = Array.from(new Set([...(lead.tags || []), String(actionConfig.tag).trim()]));
      }
      break;
    case 'update_sla_status':
      lead.metadata = {
        ...(lead.metadata || {}),
        funnelSlaStatus: actionConfig.status || 'at_risk',
      };
      break;
    case 'send_internal_notification':
      if (actionConfig.userId && isObjectId(actionConfig.userId)) {
        await createNotification({
          companyId,
          branchId: lead.activeBranchId || lead.branchId || null,
          userId: actionConfig.userId,
          type: 'crm',
          title: actionConfig.title || `Lead entered ${stage.name}`,
          message:
            actionConfig.message ||
            `${lead.name || lead.firstName || 'Lead'} entered ${stage.name}.`,
          entityType: 'lead',
          entityId: lead._id,
          link: '/tenant/funnel',
        });
      }
      break;
    case 'create_task':
      lead.metadata = {
        ...(lead.metadata || {}),
        funnelTasks: [
          ...((lead.metadata && Array.isArray(lead.metadata.funnelTasks))
            ? lead.metadata.funnelTasks
            : []),
          {
            title: actionConfig.title || `Task for ${stage.name}`,
            createdAt: new Date().toISOString(),
            createdBy: actor?._id || null,
          },
        ],
      };
      break;
    default:
      break;
    }
  }

  if (assignmentsChanged) {
    await syncLeadAssignments(lead, {
      actorId: actor?._id || null,
      reason: 'Funnel automation assignment',
    });
  }
};

const moveLeadToStage = async ({
  companyId,
  lead,
  stageIdentifier,
  actor,
  payload = {},
  skipPermissionCheck = false,
}) => {
  const targetStage = await getStageByIdentifier(companyId, stageIdentifier);
  if (!targetStage) {
    throw new Error('Target Funnel stage not found');
  }

  if (
    !skipPermissionCheck &&
    !hasPermission(actor, 'leads', 'edit') &&
    !hasPermission(actor, 'leads', 'assign')
  ) {
    throw new Error('You do not have permission to move this lead in the Funnel.');
  }

  const validationErrors = await validateStageTransition({
    lead,
    targetStage,
    payload,
  });
  if (validationErrors.length) {
    const error = new Error(validationErrors.join(' '));
    error.validationErrors = validationErrors;
    throw error;
  }

  const fromStage =
    lead.currentFunnelStageId && isObjectId(lead.currentFunnelStageId)
      ? await FunnelStage.findOne({ companyId, _id: lead.currentFunnelStageId })
      : await getStageByIdentifier(companyId, lead.pipelineStage || lead.status);

  const previousStageKey = lead.pipelineStage || lead.status || '';
  const nextStageKey = targetStage.key;

  lead.currentFunnelStageId = targetStage._id;
  lead.status = nextStageKey;
  lead.pipelineStage = nextStageKey;
  lead.stage = Number(targetStage.order || lead.stage || 1);

  if (payload.followUpAt) {
    lead.followUps = lead.followUps || [];
    lead.followUps.push({
      scheduledAt: new Date(payload.followUpAt),
      scheduledBy: actor?._id || null,
      type: payload.followUpType || 'call',
      notes: payload.followUpNotes || `Scheduled while moving to ${targetStage.name}`,
      status: 'pending',
      counsellorName: actor?.name || '',
    });
  }

  if (targetStage.isLost) {
    if (payload.lostReasonId && isObjectId(payload.lostReasonId)) {
      const lostReason = await LostReason.findOne({
        companyId,
        _id: payload.lostReasonId,
        active: true,
      }).lean();
      lead.lostReasonId = lostReason?._id || null;
      lead.lostReasonLabel = lostReason?.label || payload.lostReasonLabel || '';
    } else {
      lead.lostReasonLabel = String(payload.lostReasonLabel || '').trim();
    }
  } else if (!targetStage.isLost) {
    lead.lostReasonId = null;
    lead.lostReasonLabel = '';
  }

  if (payload.notes) {
    lead.notes = lead.notes || [];
    lead.notes.push({
      content: String(payload.notes).trim(),
      createdBy: actor?._id || null,
      createdAt: new Date(),
    });
  }

  lead.activities = lead.activities || [];
  lead.activities.push({
    type: 'status_changed',
    description: `Funnel stage moved from ${fromStage?.name || formatStageName(previousStageKey)} to ${targetStage.name}`,
    performedBy: actor?._id || null,
    metadata: {
      fromStageKey: previousStageKey,
      toStageKey: nextStageKey,
      reason: payload.reason || '',
      notes: payload.notes || '',
      source: 'funnel_engine',
    },
  });

  await lead.save();

  await LeadStageHistory.create({
    companyId,
    leadId: lead._id,
    fromStageId: fromStage?._id || null,
    toStageId: targetStage._id,
    fromStageKey: previousStageKey,
    toStageKey: nextStageKey,
    movedBy: actor?._id || null,
    movedAt: new Date(),
    reason: String(payload.reason || '').trim(),
    notes: String(payload.notes || '').trim(),
    branchId: lead.activeBranchId || lead.branchId || null,
    metadata: {
      lostReasonId: lead.lostReasonId || null,
      lostReasonLabel: lead.lostReasonLabel || '',
      conversionMetadata: payload.conversionMetadata || null,
    },
  });

  await runStageAutomationRules({ companyId, lead, stage: targetStage, actor });
  await lead.save();

  return targetStage;
};

const buildBoardData = async ({ companyId, user, query = {} }) => {
  const [stages, filter] = await Promise.all([
    getTenantFunnelStages(companyId),
    buildLeadFilter(companyId, user, query),
  ]);

  const leads = await Lead.find(filter)
    .populate('primaryAssigneeId', 'name email avatar role primaryRoleKey')
    .populate('assigneeIds', 'name email avatar role primaryRoleKey')
    .populate('activeBranchId', 'name code')
    .populate('currentFunnelStageId', 'name key color order isTerminal isWon isLost slaHours')
    .sort({ updatedAt: -1 })
    .lean();

  const result = stages.reduce((accumulator, stage) => {
    accumulator[stage.key] = {
      stage,
      leads: [],
      count: 0,
      overdueFollowUpCount: 0,
      totalEstimatedValue: 0,
    };
    return accumulator;
  }, {});

  leads.forEach((lead) => {
    const stageKey = normalizeKey(lead.pipelineStage || lead.status || lead.currentFunnelStageId?.key);
    if (!result[stageKey]) {
      return;
    }

    const isOverdue = lead.nextFollowUp && new Date(lead.nextFollowUp) < new Date();
    result[stageKey].leads.push({
      ...lead,
      activeBranch: lead.activeBranchId || null,
      primaryAssignee: lead.primaryAssigneeId || null,
      assignees: lead.assigneeIds || [],
      transferStatus: Array.isArray(lead.transferHistory) && lead.transferHistory.length
        ? lead.transferHistory[lead.transferHistory.length - 1]?.status || 'completed'
        : '',
      urgency: isOverdue ? 'overdue' : lead.priority || 'medium',
    });
    result[stageKey].count += 1;
    result[stageKey].totalEstimatedValue += Number(lead.budget || 0);
    if (isOverdue) {
      result[stageKey].overdueFollowUpCount += 1;
    }
  });

  return {
    board: result,
    stages,
    totals: {
      totalLeads: leads.length,
      overdueLeads: leads.filter((lead) => lead.nextFollowUp && new Date(lead.nextFollowUp) < new Date()).length,
    },
  };
};

const buildAnalytics = async ({ companyId, user, query = {} }) => {
  const [stages, filter, stageHistory] = await Promise.all([
    getTenantFunnelStages(companyId),
    buildLeadFilter(companyId, user, query),
    LeadStageHistory.find({ companyId }).lean(),
  ]);

  const leads = await Lead.find(filter)
    .populate('activeBranchId', 'name')
    .populate('primaryAssigneeId', 'name')
    .lean();

  const totalLeads = leads.length || 1;
  const stageCounts = stages.map((stage) => {
    const items = leads.filter(
      (lead) => normalizeKey(lead.pipelineStage || lead.status) === stage.key
    );
    return {
      stageId: stage._id,
      stageKey: stage.key,
      stageName: stage.name,
      count: items.length,
      conversionRate: stage.isWon ? Number(((items.length / totalLeads) * 100).toFixed(1)) : 0,
      overdueCount: items.filter((lead) => lead.nextFollowUp && new Date(lead.nextFollowUp) < new Date()).length,
      averageAgingDays: items.length
        ? Number(
          (
            items.reduce(
              (sum, lead) => sum + (Date.now() - new Date(lead.updatedAt).getTime()) / 86400000,
              0
            ) / items.length
          ).toFixed(1)
        )
        : 0,
    };
  });

  const branchMap = new Map();
  leads.forEach((lead) => {
    const key = toObjectIdString(lead.activeBranchId) || 'unassigned';
    const current = branchMap.get(key) || {
      branchId: lead.activeBranchId?._id || null,
      branchName: lead.activeBranchId?.name || 'Unassigned',
      leadCount: 0,
      convertedCount: 0,
    };
    current.leadCount += 1;
    if (lead.convertedToStudent || normalizeKey(lead.pipelineStage || lead.status) === 'enrolled') {
      current.convertedCount += 1;
    }
    branchMap.set(key, current);
  });

  const assigneeMap = new Map();
  leads.forEach((lead) => {
    const key = toObjectIdString(lead.primaryAssigneeId) || 'unassigned';
    const current = assigneeMap.get(key) || {
      assigneeId: lead.primaryAssigneeId?._id || null,
      assigneeName: lead.primaryAssigneeId?.name || 'Unassigned',
      leadCount: 0,
      convertedCount: 0,
    };
    current.leadCount += 1;
    if (lead.convertedToStudent || normalizeKey(lead.pipelineStage || lead.status) === 'enrolled') {
      current.convertedCount += 1;
    }
    assigneeMap.set(key, current);
  });

  const lostReasonMap = new Map();
  leads
    .filter((lead) => normalizeKey(lead.pipelineStage || lead.status) === 'lost')
    .forEach((lead) => {
      const key = lead.lostReasonLabel || 'Unspecified';
      lostReasonMap.set(key, (lostReasonMap.get(key) || 0) + 1);
    });

  const sourceMap = new Map();
  leads.forEach((lead) => {
    const key = lead.source || 'unknown';
    const current = sourceMap.get(key) || {
      source: key,
      leadCount: 0,
      convertedCount: 0,
    };
    current.leadCount += 1;
    if (lead.convertedToStudent || normalizeKey(lead.pipelineStage || lead.status) === 'enrolled') {
      current.convertedCount += 1;
    }
    sourceMap.set(key, current);
  });

  const conversionTimes = stageHistory
    .filter((entry) => normalizeKey(entry.toStageKey) === 'enrolled')
    .map((entry) => {
      const lead = leads.find((item) => toObjectIdString(item._id) === toObjectIdString(entry.leadId));
      if (!lead) {
        return null;
      }
      return (new Date(entry.movedAt).getTime() - new Date(lead.createdAt).getTime()) / 86400000;
    })
    .filter((value) => typeof value === 'number' && Number.isFinite(value));

  return {
    totals: {
      totalLeads: leads.length,
      convertedLeads: leads.filter((lead) => normalizeKey(lead.pipelineStage || lead.status) === 'enrolled').length,
      lostLeads: leads.filter((lead) => normalizeKey(lead.pipelineStage || lead.status) === 'lost').length,
      overdueLeads: leads.filter((lead) => lead.nextFollowUp && new Date(lead.nextFollowUp) < new Date()).length,
      averageTimeToConversionDays: conversionTimes.length
        ? Number(
          (conversionTimes.reduce((sum, value) => sum + value, 0) / conversionTimes.length).toFixed(1)
        )
        : 0,
    },
    stageCounts,
    branchPerformance: Array.from(branchMap.values()).map((item) => ({
      ...item,
      conversionRate: item.leadCount ? Number(((item.convertedCount / item.leadCount) * 100).toFixed(1)) : 0,
    })),
    assigneePerformance: Array.from(assigneeMap.values()).map((item) => ({
      ...item,
      conversionRate: item.leadCount ? Number(((item.convertedCount / item.leadCount) * 100).toFixed(1)) : 0,
    })),
    lostReasonAnalytics: Array.from(lostReasonMap.entries()).map(([label, count]) => ({
      label,
      count,
    })),
    sourceAnalytics: Array.from(sourceMap.values()).map((item) => ({
      ...item,
      conversionRate: item.leadCount ? Number(((item.convertedCount / item.leadCount) * 100).toFixed(1)) : 0,
    })),
  };
};

const saveFunnelStage = async (companyId, payload = {}) => {
  await ensureDefaultFunnelSetup(companyId);
  const key = normalizeKey(payload.key || payload.name);
  if (!key) {
    throw new Error('Funnel stage key is required');
  }

  return FunnelStage.findOneAndUpdate(
    payload.id ? { companyId, _id: payload.id } : { companyId, key },
    {
      $set: {
        key,
        name: String(payload.name || formatStageName(key)).trim(),
        order: Number(payload.order || 0),
        color: payload.color || '#1d4ed8',
        stageType: payload.stageType || 'lead',
        isTerminal: payload.isTerminal === true,
        isWon: payload.isWon === true,
        isLost: payload.isLost === true,
        probability:
          payload.probability === null || payload.probability === ''
            ? null
            : Number(payload.probability || 0),
        slaHours:
          payload.slaHours === null || payload.slaHours === ''
            ? null
            : Number(payload.slaHours || 0),
        requiredActions: payload.requiredActions || {},
        visibleBranchIds: Array.isArray(payload.visibleBranchIds) ? payload.visibleBranchIds : [],
        allowedRoleKeys: Array.isArray(payload.allowedRoleKeys) ? payload.allowedRoleKeys : [],
        isSystem: payload.isSystem === true,
        isActive: payload.isActive !== false,
        metadata: payload.metadata || {},
      },
      $setOnInsert: {
        companyId,
      },
    },
    {
      upsert: true,
      new: true,
      runValidators: true,
    }
  );
};

const reorderFunnelStages = async (companyId, orderedStageIds = []) => {
  await Promise.all(
    orderedStageIds.map((stageId, index) =>
      FunnelStage.updateOne({ companyId, _id: stageId }, { $set: { order: index + 1 } })
    )
  );
  return getTenantFunnelStages(companyId);
};

const saveLostReason = async (companyId, payload = {}) => {
  const label = String(payload.label || '').trim();
  if (!label) {
    throw new Error('Lost reason label is required');
  }

  return LostReason.findOneAndUpdate(
    payload.id ? { companyId, _id: payload.id } : { companyId, label },
    {
      $set: {
        label,
        active: payload.active !== false,
        order: Number(payload.order || 0),
        metadata: payload.metadata || {},
      },
      $setOnInsert: {
        companyId,
      },
    },
    {
      upsert: true,
      new: true,
      runValidators: true,
    }
  );
};

const saveAutomationRule = async (companyId, payload = {}) => {
  if (!payload.name || !payload.actionType) {
    throw new Error('Automation rule name and action type are required');
  }

  return FunnelAutomationRule.findOneAndUpdate(
    payload.id ? { companyId, _id: payload.id } : { companyId, name: payload.name },
    {
      $set: {
        name: String(payload.name).trim(),
        triggerStageId: payload.triggerStageId || null,
        triggerStageKey: normalizeKey(payload.triggerStageKey || payload.triggerStage || ''),
        triggerEvent: payload.triggerEvent || 'enter_stage',
        actionType: payload.actionType,
        actionConfig: payload.actionConfig || {},
        order: Number(payload.order || 0),
        active: payload.active !== false,
        metadata: payload.metadata || {},
      },
      $setOnInsert: {
        companyId,
      },
    },
    {
      upsert: true,
      new: true,
      runValidators: true,
    }
  );
};

const createBulkTransferRequests = async ({
  companyId,
  leadIds = [],
  toBranchId,
  toAssigneeId = null,
  reason,
  actor,
}) => {
  if (!isObjectId(toBranchId) || !String(reason || '').trim()) {
    throw new Error('Destination branch and reason are required');
  }

  const [company, slaConfig, leads] = await Promise.all([
    Company.findById(companyId).lean(),
    SLAConfig.findOne({ companyId }).lean(),
    Lead.find({
      companyId,
      _id: { $in: leadIds.filter(isObjectId) },
      deletedAt: null,
    }),
  ]);

  const requiresApproval = Boolean(
    slaConfig?.transferApprovalRequired || company?.settings?.transferApprovalRequired
  );

  const transfers = [];
  for (const lead of leads) {
    const transfer = await TransferRequest.create({
      companyId,
      leadId: lead._id,
      fromBranchId: lead.activeBranchId || lead.branchId,
      toBranchId,
      fromAssigneeId: lead.primaryAssigneeId || lead.assignedCounsellor || null,
      toAssigneeId: toAssigneeId || null,
      requestedBy: actor._id,
      reason: String(reason).trim(),
      status: requiresApproval ? 'pending' : 'completed',
      requiresApproval,
      requestedAt: new Date(),
      completedAt: requiresApproval ? null : new Date(),
      history: [
        {
          status: requiresApproval ? 'pending' : 'completed',
          changedBy: actor._id,
          changedAt: new Date(),
          notes: String(reason).trim(),
        },
      ],
    });
    transfers.push(transfer);
  }

  return transfers;
};

module.exports = {
  buildAnalytics,
  buildBoardData,
  buildLeadFilter,
  createBulkTransferRequests,
  ensureDefaultFunnelSetup,
  getStageByIdentifier,
  getTenantFunnelStages,
  moveLeadToStage,
  reorderFunnelStages,
  saveAutomationRule,
  saveFunnelStage,
  saveLostReason,
  validateStageTransition,
};
