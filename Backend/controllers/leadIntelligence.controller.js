const Lead = require('../models/Lead');
const { sendError, sendSuccess } = require('../utils/responseHandler');
const {
  buildScopedClause,
  mergeFiltersWithAnd,
} = require('../services/accessControl.service');
const {
  deleteAssignmentRule,
  deleteCountryAssignmentRule,
  executeLeadRecommendation,
  getLeadIntelligenceOverview,
  getLeadIntelligenceProfile,
  getLeadIntelligenceSettings,
  listAssignmentRules,
  listCountryAssignmentRules,
  refreshLeadIntelligence,
  saveAssignmentRule,
  saveCountryAssignmentRule,
  saveLeadIntelligenceSettings,
} = require('../services/leadIntelligence.service');

const asyncHandler = (fn) => (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next);

const buildScopedLeadFilter = async (req, extra = {}) =>
  mergeFiltersWithAnd(
    { companyId: req.companyId, deletedAt: null },
    await buildScopedClause(req.user, 'leads', {
      branchField: 'activeBranchId',
      assigneeFields: ['primaryAssigneeId', 'assignedCounsellor', 'assignedTo', 'assigneeIds'],
      creatorFields: ['createdByUser'],
      ownerFields: ['ownerUserId'],
    }),
    extra
  );

exports.getOverview = asyncHandler(async (req, res) => {
  const extra = {};

  if (req.query.priority) {
    extra.priority = String(req.query.priority).trim();
  }
  if (req.query.temperature) {
    extra.leadTemperature = String(req.query.temperature).trim();
  }
  if (req.query.status) {
    extra.pipelineStage = String(req.query.status).trim();
  }
  if (req.query.branchId) {
    extra.activeBranchId = req.query.branchId;
  }

  const scopedFilter = await buildScopedLeadFilter(req, extra);
  const overview = await getLeadIntelligenceOverview({
    companyId: req.companyId,
    filter: scopedFilter,
  });

  sendSuccess(res, 200, 'Lead intelligence overview fetched successfully', overview);
});

exports.getSettings = asyncHandler(async (req, res) => {
  const [settings, countryRules, assignmentRules] = await Promise.all([
    getLeadIntelligenceSettings(req.companyId),
    listCountryAssignmentRules(req.companyId),
    listAssignmentRules(req.companyId),
  ]);

  sendSuccess(res, 200, 'Lead intelligence settings fetched successfully', {
    settings,
    countryRules,
    assignmentRules,
  });
});

exports.updateSettings = asyncHandler(async (req, res) => {
  const settings = await saveLeadIntelligenceSettings(
    req.companyId,
    req.body,
    req.user?._id || null
  );

  sendSuccess(res, 200, 'Lead intelligence settings saved successfully', { settings });
});

exports.getCountryRules = asyncHandler(async (req, res) => {
  const countryRules = await listCountryAssignmentRules(req.companyId);
  sendSuccess(res, 200, 'Country assignment rules fetched successfully', { countryRules });
});

exports.saveCountryRule = asyncHandler(async (req, res) => {
  const countryRule = await saveCountryAssignmentRule(
    req.companyId,
    {
      ...req.body,
      id: req.params.id || req.body.id,
    },
    req.user?._id || null
  );

  sendSuccess(res, 200, 'Country assignment rule saved successfully', { countryRule });
});

exports.deleteCountryRule = asyncHandler(async (req, res) => {
  const deleted = await deleteCountryAssignmentRule(req.companyId, req.params.id);
  if (!deleted) {
    return sendError(res, 404, 'Country assignment rule not found.');
  }
  return sendSuccess(res, 200, 'Country assignment rule deleted successfully');
});

exports.getAssignmentRules = asyncHandler(async (req, res) => {
  const assignmentRules = await listAssignmentRules(req.companyId);
  sendSuccess(res, 200, 'Assignment rules fetched successfully', { assignmentRules });
});

exports.saveAssignmentRule = asyncHandler(async (req, res) => {
  const assignmentRule = await saveAssignmentRule(
    req.companyId,
    {
      ...req.body,
      id: req.params.id || req.body.id,
    },
    req.user?._id || null
  );

  sendSuccess(res, 200, 'Assignment rule saved successfully', { assignmentRule });
});

exports.deleteAssignmentRule = asyncHandler(async (req, res) => {
  const deleted = await deleteAssignmentRule(req.companyId, req.params.id);
  if (!deleted) {
    return sendError(res, 404, 'Assignment rule not found.');
  }
  return sendSuccess(res, 200, 'Assignment rule deleted successfully');
});

exports.getLeadProfile = asyncHandler(async (req, res) => {
  const lead = await Lead.findOne(await buildScopedLeadFilter(req, { _id: req.params.id })).select('_id');
  if (!lead) {
    return sendError(res, 404, 'Lead not found.');
  }

  const profile = await getLeadIntelligenceProfile(req.companyId, req.params.id);
  sendSuccess(res, 200, 'Lead intelligence profile fetched successfully', profile);
});

exports.recalculateLead = asyncHandler(async (req, res) => {
  const lead = await Lead.findOne(await buildScopedLeadFilter(req, { _id: req.params.id }));
  if (!lead) {
    return sendError(res, 404, 'Lead not found.');
  }

  const intelligence = await refreshLeadIntelligence({
    companyId: req.companyId,
    lead,
    actorId: req.user?._id || null,
    persist: true,
    triggerType: 'ai_refresh',
  });

  sendSuccess(res, 200, 'Lead intelligence recalculated successfully', intelligence);
});

exports.executeRecommendation = asyncHandler(async (req, res) => {
  const lead = await Lead.findOne(await buildScopedLeadFilter(req, { _id: req.params.leadId })).select('_id');
  if (!lead) {
    return sendError(res, 404, 'Lead not found.');
  }

  const result = await executeLeadRecommendation({
    companyId: req.companyId,
    leadId: req.params.leadId,
    recommendationId: req.params.recommendationId,
    actorId: req.user?._id || null,
  });

  sendSuccess(res, 200, 'Lead intelligence recommendation executed successfully', result);
});
