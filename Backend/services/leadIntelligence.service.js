const mongoose = require('mongoose');
const Lead = require('../models/Lead');
const User = require('../models/User');
const Branch = require('../models/Branch');
const CallLog = require('../models/CallLog');
const OfficeVisit = require('../models/OfficeVisit');
const LeadScore = require('../models/LeadScore');
const LeadRecommendation = require('../models/LeadRecommendation');
const LeadIntelligenceSetting = require('../models/LeadIntelligenceSetting');
const AssignmentRule = require('../models/AssignmentRule');
const AssignmentDecisionLog = require('../models/AssignmentDecisionLog');
const BranchRoutingDecision = require('../models/BranchRoutingDecision');
const InterestedCountryAssignmentRule = require('../models/InterestedCountryAssignmentRule');
const {
  createLeadActivityLog,
  syncLeadAssignments,
  toObjectIdString,
  uniqIds,
} = require('./leadCollaboration.service');
const {
  AUTO_ASSIGNABLE_ROLE_KEYS,
  findBestCounsellorMatch,
  normalizeCountryList,
} = require('./counsellorMatching.service');
const { getTenantLeadStages } = require('./countryWorkflow.service');
const { normalizeRoleKey } = require('../constants/rbac');

const ACTIVE_STAGE_KEYS = ['new', 'contacted', 'qualified', 'interested'];
const POSITIVE_CALL_OUTCOMES = ['connected', 'interested', 'positive', 'follow up', 'needs follow-up'];
const POSITIVE_VISIT_OUTCOMES = ['interested', 'converted', 'needs follow-up', 'documents pending'];
const REACTIVATION_LOST_REASONS = ['delayed intake', 'no response', 'budget issue', 'documentation problem'];

const DEFAULT_SETTINGS = {
  scoringVersion: 'rule_v1',
  scoringWeights: {
    sourceQuality: 8,
    responseSpeed: 8,
    followUpDiscipline: 16,
    callOutcomes: 10,
    visitIntent: 10,
    documentProgress: 9,
    stageMomentum: 9,
    engagementRecency: 12,
    campaignQuality: 5,
    branchConversionHistory: 5,
    assigneeConversionHistory: 4,
    qualificationFit: 4,
  },
  sourceWeights: {
    referral: 92,
    'walk-in': 95,
    event: 82,
    website: 70,
    facebook: 63,
    instagram: 60,
    youtube: 58,
    tiktok: 54,
    other: 45,
  },
  priorityThresholds: {
    urgentScore: 82,
    highScore: 66,
    mediumScore: 45,
    staleDays: 10,
    reactivationDays: 21,
  },
  temperatureThresholds: {
    highIntent: 88,
    hot: 74,
    warm: 58,
    coolingDays: 7,
    staleDays: 14,
  },
  autoAssignmentMode: 'approval',
  branchRoutingMode: 'approval',
  recommendationMode: 'manual',
  explainabilityVisible: true,
  autoReassignOnCountryChange: false,
  allowCountryRuleOverwrite: false,
  staleLeadDays: 10,
  reactivationWindowDays: 21,
  fallbackAssignmentStrategy: 'lowest_active_load',
  fallbackBranchRoutingStrategy: 'best_conversion_history',
};

const clamp = (value, min = 0, max = 100) => Math.max(min, Math.min(max, value));

const toTitle = (value = '') =>
  String(value || '')
    .replace(/_/g, ' ')
    .replace(/\b\w/g, (character) => character.toUpperCase());

const roundTo = (value, precision = 1) => {
  const factor = 10 ** precision;
  return Math.round(Number(value || 0) * factor) / factor;
};

const normalizeString = (value) => {
  if (typeof value === 'undefined' || value === null) {
    return '';
  }
  return String(value).trim();
};

const normalizeCountryName = (value) => normalizeString(value).toLowerCase();

const getNow = () => new Date();

const getLeadCountryList = (lead) =>
  normalizeCountryList([
    ...(Array.isArray(lead?.preferredCountries) ? lead.preferredCountries : []),
    lead?.interestedCountry,
  ]);

const getLastActivityDate = (lead, callLogs = [], visitLogs = []) => {
  const candidates = [
    lead?.updatedAt,
    lead?.lastContactedAt,
    lead?.createdAt,
    ...(lead?.followUps || []).map((item) => item?.completedAt || item?.scheduledAt),
    ...(lead?.activities || []).map((item) => item?.createdAt),
    ...callLogs.map((item) => item?.callDate || item?.createdAt),
    ...visitLogs.map((item) => item?.visitDate || item?.createdAt),
  ].filter(Boolean);

  return candidates
    .map((value) => new Date(value))
    .filter((value) => !Number.isNaN(value.getTime()))
    .sort((left, right) => right.getTime() - left.getTime())[0] || null;
};

const getDaysSince = (value) => {
  if (!value) {
    return null;
  }
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return null;
  }
  return Math.max(0, roundTo((Date.now() - date.getTime()) / 86400000, 1));
};

const getRecentPositiveSignals = ({ callLogs = [], visitLogs = [], lead }) => {
  const connectedCalls = callLogs.filter((item) =>
    POSITIVE_CALL_OUTCOMES.some((entry) =>
      normalizeString(item?.outcome).toLowerCase().includes(entry)
    )
  ).length;
  const positiveVisits = visitLogs.filter((item) =>
    POSITIVE_VISIT_OUTCOMES.some((entry) =>
      normalizeString(item?.visitOutcome).toLowerCase().includes(entry)
    )
  ).length;
  const docsProgress =
    Number(lead?.metadata?.docsSubmittedCount || 0) +
    Number(lead?.metadata?.documentCount || 0) +
    (lead?.metadata?.documentChecklistComplete ? 1 : 0);

  return connectedCalls + positiveVisits + (docsProgress > 0 ? 1 : 0);
};

const getQualificationCompletenessScore = (lead) => {
  const checks = [
    Boolean(lead?.stream),
    Boolean(lead?.interestedCourse),
    Boolean(lead?.preferredStudyLevel || lead?.courseLevel),
    Boolean(lead?.education?.percentage || lead?.education?.gpa || lead?.overallScore),
    Boolean(lead?.englishTest?.score),
    Array.isArray(lead?.preferredCountries) && lead.preferredCountries.length > 0,
  ];
  const positiveCount = checks.filter(Boolean).length;
  return clamp(Math.round((positiveCount / checks.length) * 100));
};

const scoreFromResponseMinutes = (minutes) => {
  if (!Number.isFinite(Number(minutes))) {
    return 50;
  }
  const value = Number(minutes);
  if (value <= 30) return 100;
  if (value <= 120) return 84;
  if (value <= 720) return 68;
  if (value <= 1440) return 48;
  return 22;
};

const scoreFromRecencyDays = (days) => {
  if (days === null) return 35;
  if (days <= 1) return 100;
  if (days <= 3) return 82;
  if (days <= 7) return 62;
  if (days <= 14) return 34;
  return 12;
};

const buildLegacyCategory = (label) => {
  if (['high_intent', 'hot'].includes(label)) {
    return 'hot';
  }
  if (label === 'warm') {
    return 'warm';
  }
  return 'cold';
};

const mergeSettings = (settingsDoc = {}) => ({
  ...DEFAULT_SETTINGS,
  ...settingsDoc,
  scoringWeights: {
    ...DEFAULT_SETTINGS.scoringWeights,
    ...(settingsDoc.scoringWeights || {}),
  },
  sourceWeights: {
    ...DEFAULT_SETTINGS.sourceWeights,
    ...(settingsDoc.sourceWeights || {}),
  },
  priorityThresholds: {
    ...DEFAULT_SETTINGS.priorityThresholds,
    ...(settingsDoc.priorityThresholds || {}),
  },
  temperatureThresholds: {
    ...DEFAULT_SETTINGS.temperatureThresholds,
    ...(settingsDoc.temperatureThresholds || {}),
  },
});

const getLeadIntelligenceSettings = async (companyId) => {
  const settings = await LeadIntelligenceSetting.findOneAndUpdate(
    { companyId },
    {
      $setOnInsert: {
        companyId,
        ...DEFAULT_SETTINGS,
      },
    },
    {
      new: true,
      upsert: true,
      setDefaultsOnInsert: true,
    }
  ).lean();

  return mergeSettings(settings);
};

const saveLeadIntelligenceSettings = async (companyId, payload = {}, actorId = null) => {
  const current = await getLeadIntelligenceSettings(companyId);
  const nextSettings = mergeSettings({
    ...current,
    ...payload,
    scoringWeights: {
      ...current.scoringWeights,
      ...(payload.scoringWeights || {}),
    },
    sourceWeights: {
      ...current.sourceWeights,
      ...(payload.sourceWeights || {}),
    },
    priorityThresholds: {
      ...current.priorityThresholds,
      ...(payload.priorityThresholds || {}),
    },
    temperatureThresholds: {
      ...current.temperatureThresholds,
      ...(payload.temperatureThresholds || {}),
    },
  });

  return LeadIntelligenceSetting.findOneAndUpdate(
    { companyId },
    {
      $set: {
        ...nextSettings,
        updatedBy: actorId || null,
      },
      $setOnInsert: {
        createdBy: actorId || null,
      },
    },
    {
      new: true,
      upsert: true,
      runValidators: true,
      setDefaultsOnInsert: true,
    }
  );
};

const getActiveCountryRule = async (companyId, countries = []) => {
  const normalizedCountryNames = normalizeCountryList(countries).map(normalizeCountryName);
  if (!normalizedCountryNames.length) {
    return null;
  }

  const rules = await InterestedCountryAssignmentRule.find({
    companyId,
    active: true,
  })
    .sort({ priorityOrder: 1, updatedAt: -1, createdAt: -1 })
    .lean();

  return (
    rules.find((rule) =>
      normalizedCountryNames.includes(normalizeCountryName(rule.countryName))
    ) || null
  );
};

const validateUsersAndBranch = async (companyId, payload = {}) => {
  const userIds = uniqIds([
    payload.primaryAssigneeId,
    ...(Array.isArray(payload.secondaryAssigneeIds) ? payload.secondaryAssigneeIds : []),
  ]);

  const [users, branch] = await Promise.all([
    userIds.length
      ? User.find({
        companyId,
        _id: { $in: userIds },
        isActive: true,
      })
        .select('_id')
        .lean()
      : [],
    payload.defaultBranchId
      ? Branch.findOne({
        companyId,
        _id: payload.defaultBranchId,
        deletedAt: null,
        isActive: true,
      })
        .select('_id')
        .lean()
      : null,
  ]);

  if (userIds.length !== users.length) {
    throw new Error('One or more assignees in the country rule do not belong to this tenant.');
  }

  if (payload.defaultBranchId && !branch) {
    throw new Error('Selected default branch does not belong to this tenant.');
  }
};

const listCountryAssignmentRules = async (companyId) =>
  InterestedCountryAssignmentRule.find({ companyId })
    .populate('defaultBranchId', 'name code')
    .populate('primaryAssigneeId', 'name email role primaryRoleKey')
    .populate('secondaryAssigneeIds', 'name email role primaryRoleKey')
    .sort({ priorityOrder: 1, countryName: 1 })
    .lean();

const saveCountryAssignmentRule = async (companyId, payload = {}, actorId = null) => {
  const countryName = normalizeString(payload.countryName || payload.countryCode);
  if (!countryName) {
    throw new Error('Country name is required.');
  }

  const normalizedPayload = {
    countryCode: normalizeString(payload.countryCode || '').toUpperCase(),
    countryName,
    defaultBranchId: payload.defaultBranchId || null,
    primaryAssigneeId: payload.primaryAssigneeId || null,
    secondaryAssigneeIds: uniqIds(payload.secondaryAssigneeIds || []),
    defaultRoleType: normalizeString(payload.defaultRoleType || ''),
    specialistTeamName: normalizeString(payload.specialistTeamName || ''),
    assignmentStrategy: payload.assignmentStrategy || 'primary_first',
    fallbackStrategy: payload.fallbackStrategy || 'lowest_active_load',
    priorityOrder: Number(payload.priorityOrder || 0),
    active: payload.active !== false,
    metadata: payload.metadata || {},
  };

  await validateUsersAndBranch(companyId, normalizedPayload);

  return InterestedCountryAssignmentRule.findOneAndUpdate(
    payload.id ? { companyId, _id: payload.id } : { companyId, countryName },
    {
      $set: {
        ...normalizedPayload,
        updatedBy: actorId || null,
      },
      $setOnInsert: {
        companyId,
        createdBy: actorId || null,
      },
    },
    {
      new: true,
      upsert: true,
      runValidators: true,
      setDefaultsOnInsert: true,
    }
  )
    .populate('defaultBranchId', 'name code')
    .populate('primaryAssigneeId', 'name email role primaryRoleKey')
    .populate('secondaryAssigneeIds', 'name email role primaryRoleKey');
};

const deleteCountryAssignmentRule = async (companyId, ruleId) =>
  InterestedCountryAssignmentRule.findOneAndDelete({ companyId, _id: ruleId });

const listAssignmentRules = async (companyId) =>
  AssignmentRule.find({ companyId }).sort({ updatedAt: -1, createdAt: -1 }).lean();

const saveAssignmentRule = async (companyId, payload = {}, actorId = null) => {
  if (!normalizeString(payload.name) || !normalizeString(payload.strategyType)) {
    throw new Error('Assignment rule name and strategy type are required.');
  }

  return AssignmentRule.findOneAndUpdate(
    payload.id ? { companyId, _id: payload.id } : { companyId, name: normalizeString(payload.name) },
    {
      $set: {
        name: normalizeString(payload.name),
        strategyType: normalizeString(payload.strategyType),
        ruleConfig: payload.ruleConfig || {},
        active: payload.active !== false,
        updatedBy: actorId || null,
        metadata: payload.metadata || {},
      },
      $setOnInsert: {
        companyId,
        createdBy: actorId || null,
      },
    },
    {
      new: true,
      upsert: true,
      runValidators: true,
      setDefaultsOnInsert: true,
    }
  );
};

const deleteAssignmentRule = async (companyId, ruleId) =>
  AssignmentRule.findOneAndDelete({ companyId, _id: ruleId });

const toObjectId = (value) => new mongoose.Types.ObjectId(String(value));

const getObjectIdArray = (items = []) =>
  uniqIds(items)
    .filter(Boolean)
    .map((value) => toObjectId(value));

const getBranchMetricsMap = async (companyId, branchIds = [], countries = []) => {
  const uniqueBranchIds = uniqIds(branchIds);
  if (!uniqueBranchIds.length) {
    return new Map();
  }

  const activeStatuses = [
    'new',
    'contacted',
    'qualified',
    'interested',
    'application_started',
    'documents_pending',
    'application_submitted',
    'offer_received',
    'visa_applied',
  ];
  const branchObjectIds = getObjectIdArray(uniqueBranchIds);

  const [backlogRows, conversionRows, branches] = await Promise.all([
    Lead.aggregate([
      {
        $match: {
          companyId: toObjectId(companyId),
          deletedAt: null,
          activeBranchId: { $in: branchObjectIds },
          pipelineStage: { $in: activeStatuses },
        },
      },
      {
        $group: {
          _id: '$activeBranchId',
          backlog: { $sum: 1 },
        },
      },
    ]),
    Lead.aggregate([
      {
        $match: {
          companyId: toObjectId(companyId),
          deletedAt: null,
          activeBranchId: { $in: branchObjectIds },
        },
      },
      {
        $group: {
          _id: '$activeBranchId',
          total: { $sum: 1 },
          converted: {
            $sum: {
              $cond: [
                {
                  $or: [
                    { $eq: ['$convertedToStudent', true] },
                    { $eq: ['$pipelineStage', 'enrolled'] },
                  ],
                },
                1,
                0,
              ],
            },
          },
        },
      },
    ]),
    Branch.find({
      companyId,
      _id: { $in: uniqueBranchIds },
      deletedAt: null,
      isActive: true,
    })
      .select('name code city country metadata')
      .lean(),
  ]);

  const backlogMap = new Map(backlogRows.map((row) => [String(row._id), Number(row.backlog || 0)]));
  const conversionMap = new Map(
    conversionRows.map((row) => [
      String(row._id),
      {
        total: Number(row.total || 0),
        converted: Number(row.converted || 0),
      },
    ])
  );

  return new Map(
    branches.map((branch) => {
      const branchId = String(branch._id);
      const conversion = conversionMap.get(branchId) || { total: 0, converted: 0 };
      const conversionRate = conversion.total
        ? roundTo((conversion.converted / conversion.total) * 100, 1)
        : 0;
      const branchCountryTags = normalizeCountryList(
        branch?.metadata?.supportedCountries || branch?.metadata?.countries || []
      ).map(normalizeCountryName);
      const countryBoost = countries.some((country) =>
        branchCountryTags.includes(normalizeCountryName(country))
      )
        ? 12
        : 0;

      return [
        branchId,
        {
          branch,
          backlog: backlogMap.get(branchId) || 0,
          conversionRate,
          score: roundTo(
            conversionRate * 0.65 + clamp(100 - (backlogMap.get(branchId) || 0) * 6) * 0.35 + countryBoost,
            1
          ),
        },
      ];
    })
  );
};

const getAssigneeMetricsMap = async (companyId, userIds = []) => {
  const uniqueUserIds = uniqIds(userIds);
  if (!uniqueUserIds.length) {
    return new Map();
  }

  const userObjectIds = getObjectIdArray(uniqueUserIds);
  const [loadRows, conversionRows, users] = await Promise.all([
    Lead.aggregate([
      {
        $match: {
          companyId: toObjectId(companyId),
          deletedAt: null,
          pipelineStage: { $nin: ['enrolled', 'lost'] },
        },
      },
      { $unwind: '$assigneeIds' },
      { $match: { assigneeIds: { $in: userObjectIds } } },
      {
        $group: {
          _id: '$assigneeIds',
          activeLoad: { $sum: 1 },
        },
      },
    ]),
    Lead.aggregate([
      {
        $match: {
          companyId: toObjectId(companyId),
          deletedAt: null,
          primaryAssigneeId: { $in: userObjectIds },
        },
      },
      {
        $group: {
          _id: '$primaryAssigneeId',
          total: { $sum: 1 },
          converted: {
            $sum: {
              $cond: [
                {
                  $or: [
                    { $eq: ['$convertedToStudent', true] },
                    { $eq: ['$pipelineStage', 'enrolled'] },
                  ],
                },
                1,
                0,
              ],
            },
          },
        },
      },
    ]),
    User.find({
      companyId,
      _id: { $in: uniqueUserIds },
      isActive: true,
    })
      .select('name email role primaryRoleKey branchId countries isHeadOffice avatar')
      .lean(),
  ]);

  const loadMap = new Map(loadRows.map((row) => [String(row._id), Number(row.activeLoad || 0)]));
  const conversionMap = new Map(
    conversionRows.map((row) => [
      String(row._id),
      {
        total: Number(row.total || 0),
        converted: Number(row.converted || 0),
      },
    ])
  );

  return new Map(
    users.map((user) => {
      const userId = String(user._id);
      const conversion = conversionMap.get(userId) || { total: 0, converted: 0 };
      return [
        userId,
        {
          user,
          activeLoad: loadMap.get(userId) || 0,
          conversionRate: conversion.total
            ? roundTo((conversion.converted / conversion.total) * 100, 1)
            : 0,
        },
      ];
    })
  );
};

const getRoundRobinPriorityMap = async (companyId, userIds = []) => {
  const uniqueUserIds = uniqIds(userIds);
  if (!uniqueUserIds.length) {
    return new Map();
  }

  const rows = await AssignmentDecisionLog.aggregate([
    {
      $match: {
        companyId: toObjectId(companyId),
        assignedUserId: { $in: getObjectIdArray(uniqueUserIds) },
      },
    },
    {
      $group: {
        _id: '$assignedUserId',
        lastAssignedAt: { $max: '$createdAt' },
      },
    },
  ]);

  return new Map(
    rows.map((row) => [String(row._id), row.lastAssignedAt ? new Date(row.lastAssignedAt) : null])
  );
};

const getCandidateRoleWeight = (user) => {
  const roleKey = normalizeRoleKey(user?.primaryRoleKey || user?.role);
  if (roleKey === 'follow_up_team') {
    return 100;
  }
  if (['branch_manager', 'branch_admin', 'head_office_admin'].includes(roleKey)) {
    return 88;
  }
  if (roleKey === 'application_officer') {
    return 72;
  }
  return AUTO_ASSIGNABLE_ROLE_KEYS.has(roleKey) ? 80 : 50;
};

const pickCandidateByStrategy = async ({
  companyId,
  strategy,
  candidates,
  lead,
  branchId,
}) => {
  if (!candidates.length) {
    return null;
  }

  if (strategy === 'round_robin') {
    const lastAssignedMap = await getRoundRobinPriorityMap(
      companyId,
      candidates.map((candidate) => candidate.user._id)
    );
    return candidates
      .slice()
      .sort((left, right) => {
        const leftDate = lastAssignedMap.get(String(left.user._id));
        const rightDate = lastAssignedMap.get(String(right.user._id));
        if (!leftDate && rightDate) return -1;
        if (leftDate && !rightDate) return 1;
        if (leftDate && rightDate && leftDate.getTime() !== rightDate.getTime()) {
          return leftDate.getTime() - rightDate.getTime();
        }
        return String(left.user.name || '').localeCompare(String(right.user.name || ''));
      })[0];
  }

  const targetCountries = getLeadCountryList(lead).map(normalizeCountryName);
  const ranked = candidates
    .map((candidate) => {
      const userCountries = normalizeCountryList(candidate.user.countries || []).map(normalizeCountryName);
      const countryMatch = targetCountries.some((country) => userCountries.includes(country)) ? 100 : 0;
      const branchMatch = branchId && String(candidate.user.branchId || '') === String(branchId) ? 100 : 0;
      const roleWeight = getCandidateRoleWeight(candidate.user);
      const workloadScore = clamp(100 - candidate.activeLoad * 7);
      const priorityQueueScore =
        countryMatch * 0.3 +
        branchMatch * 0.15 +
        workloadScore * 0.25 +
        candidate.conversionRate * 0.2 +
        roleWeight * 0.1;

      return {
        ...candidate,
        countryMatch,
        branchMatch,
        roleWeight,
        workloadScore,
        priorityQueueScore: roundTo(priorityQueueScore, 1),
      };
    })
    .sort((left, right) => {
      if (strategy === 'best_conversion_history' && right.conversionRate !== left.conversionRate) {
        return right.conversionRate - left.conversionRate;
      }
      if (strategy === 'lowest_active_load' && left.activeLoad !== right.activeLoad) {
        return left.activeLoad - right.activeLoad;
      }
      if (strategy === 'priority_queue' && right.priorityQueueScore !== left.priorityQueueScore) {
        return right.priorityQueueScore - left.priorityQueueScore;
      }
      if (right.countryMatch !== left.countryMatch) {
        return right.countryMatch - left.countryMatch;
      }
      if (right.branchMatch !== left.branchMatch) {
        return right.branchMatch - left.branchMatch;
      }
      if (left.activeLoad !== right.activeLoad) {
        return left.activeLoad - right.activeLoad;
      }
      if (right.conversionRate !== left.conversionRate) {
        return right.conversionRate - left.conversionRate;
      }
      return String(left.user.name || '').localeCompare(String(right.user.name || ''));
    });

  return ranked[0];
};

const buildBranchSuggestion = async ({
  companyId,
  lead,
  settings,
  countryRule = null,
  persist = false,
}) => {
  const countries = getLeadCountryList(lead);
  if (countryRule?.defaultBranchId) {
    const branch = await Branch.findOne({
      companyId,
      _id: countryRule.defaultBranchId,
      deletedAt: null,
      isActive: true,
    })
      .select('name code city country')
      .lean();

    if (branch) {
      const suggestion = {
        branchId: branch._id,
        branch,
        strategyUsed: 'country_rule',
        confidence: 0.94,
        explanation: `${countryRule.countryName} rule directs this lead to ${branch.name}.`,
        reason: `Suggested Branch: ${branch.name} because the ${countryRule.countryName} mapping is active and configured for country-based routing.`,
      };

      if (persist) {
        await BranchRoutingDecision.create({
          companyId,
          leadId: lead._id,
          recommendedBranchId: branch._id,
          routingReason: suggestion.reason,
          metadata: {
            confidence: suggestion.confidence,
            strategyUsed: suggestion.strategyUsed,
          },
        });
      }

      return suggestion;
    }
  }

  const branches = await Branch.find({
    companyId,
    deletedAt: null,
    isActive: true,
  })
    .select('name code city country metadata')
    .lean();
  const metricsMap = await getBranchMetricsMap(
    companyId,
    branches.map((branch) => branch._id),
    countries
  );

  const rankedBranches = branches
    .map((branch) => {
      const metrics = metricsMap.get(String(branch._id)) || {
        backlog: 0,
        conversionRate: 0,
        score: 0,
      };
      return {
        branchId: branch._id,
        branch,
        backlog: metrics.backlog,
        conversionRate: metrics.conversionRate,
        score: metrics.score,
      };
    })
    .sort((left, right) => right.score - left.score);

  const topBranch = rankedBranches[0] || null;
  if (!topBranch) {
    return null;
  }

  const strategyUsed = settings.fallbackBranchRoutingStrategy || 'best_conversion_history';
  const suggestion = {
    branchId: topBranch.branchId,
    branch: topBranch.branch,
    strategyUsed,
    confidence: clamp((topBranch.score || 0) / 100, 0.2, 0.88),
    explanation: `${topBranch.branch.name} ranks highest after considering backlog and historical conversion performance.`,
    reason: `Suggested Branch: ${topBranch.branch.name} because it combines a ${topBranch.conversionRate}% conversion rate with a backlog of ${topBranch.backlog}.`,
  };

  if (persist) {
    await BranchRoutingDecision.create({
      companyId,
      leadId: lead._id,
      recommendedBranchId: topBranch.branchId,
      routingReason: suggestion.reason,
      metadata: {
        confidence: suggestion.confidence,
        strategyUsed,
        conversionRate: topBranch.conversionRate,
        backlog: topBranch.backlog,
      },
    });
  }

  return suggestion;
};

const buildAssignmentSuggestion = async ({
  companyId,
  lead,
  settings,
  countryRule = null,
}) => {
  const targetCountries = getLeadCountryList(lead);
  const branchId = toObjectIdString(lead.activeBranchId || lead.branchId);

  const explicitUserIds = uniqIds([
    countryRule?.primaryAssigneeId,
    ...(Array.isArray(countryRule?.secondaryAssigneeIds) ? countryRule.secondaryAssigneeIds : []),
  ]);

  let users = [];
  if (explicitUserIds.length) {
    users = await User.find({
      companyId,
      _id: { $in: explicitUserIds },
      isActive: true,
    })
      .select('name email role primaryRoleKey branchId countries isHeadOffice avatar')
      .lean();
  } else {
    users = await User.find({
      companyId,
      isActive: true,
      $or: [
        { primaryRoleKey: { $in: Array.from(AUTO_ASSIGNABLE_ROLE_KEYS) } },
        { role: { $in: ['counselor', 'counsellor', 'manager', 'branch_admin', 'tenant_admin', 'admin', 'follow_up_team', 'branch_manager', 'application_officer'] } },
      ],
    })
      .select('name email role primaryRoleKey branchId countries isHeadOffice avatar')
      .lean();
  }

  if (!users.length && targetCountries.length) {
    const fallback = await findBestCounsellorMatch({
      companyId,
      branchId,
      preferredCountries: targetCountries,
    });
    if (fallback?.counsellor?._id) {
      return {
        primaryAssigneeId: fallback.counsellor._id,
        secondaryAssigneeIds: [],
        strategyUsed: 'destination_specialist',
        confidence: 0.74,
        explanation: `Suggested Assignee: ${fallback.counsellor.name} because they already specialise in ${fallback.matchedCountries.join(', ')} leads.`,
        reason: `Assigned to ${fallback.counsellor.name} using destination specialist fallback.`,
      };
    }
  }

  const metricsMap = await getAssigneeMetricsMap(
    companyId,
    users.map((user) => user._id)
  );

  const candidates = users
    .map((user) => {
      const metrics = metricsMap.get(String(user._id));
      if (!metrics) {
        return null;
      }
      return {
        user,
        activeLoad: metrics.activeLoad,
        conversionRate: metrics.conversionRate,
      };
    })
    .filter(Boolean);

  if (!candidates.length) {
    return null;
  }

  const strategy =
    countryRule?.assignmentStrategy && countryRule.assignmentStrategy !== 'primary_first'
      ? countryRule.assignmentStrategy
      : settings.fallbackAssignmentStrategy || 'lowest_active_load';

  let primaryCandidate = null;
  if (countryRule?.primaryAssigneeId) {
    primaryCandidate =
      candidates.find(
        (candidate) =>
          String(candidate.user._id) === String(countryRule.primaryAssigneeId)
      ) || null;
  }

  if (!primaryCandidate) {
    primaryCandidate = await pickCandidateByStrategy({
      companyId,
      strategy,
      candidates,
      lead,
      branchId,
    });
  }

  if (!primaryCandidate) {
    return null;
  }

  const secondaryAssigneeIds = uniqIds([
    ...(Array.isArray(countryRule?.secondaryAssigneeIds) ? countryRule.secondaryAssigneeIds : []),
  ]).filter((value) => value !== String(primaryCandidate.user._id));

  return {
    primaryAssigneeId: primaryCandidate.user._id,
    secondaryAssigneeIds,
    strategyUsed: countryRule?.assignmentStrategy || strategy,
    confidence: clamp(
      primaryCandidate.conversionRate
        ? primaryCandidate.conversionRate / 100
        : 0.58 + (primaryCandidate.activeLoad <= 3 ? 0.12 : 0),
      0.25,
      0.9
    ),
    explanation: `Suggested Assignee: ${primaryCandidate.user.name} because workload is ${primaryCandidate.activeLoad} active leads and conversion history is ${primaryCandidate.conversionRate}%.`,
    reason: `Assigned using ${toTitle(countryRule?.assignmentStrategy || strategy)} strategy.`,
  };
};

const buildScoreLabel = ({ score, lead, positiveSignals, daysSinceActivity }) => {
  if (normalizeString(lead?.pipelineStage || lead?.status).toLowerCase() === 'lost') {
    return 'at_risk';
  }
  if (daysSinceActivity !== null && daysSinceActivity >= 14) {
    return 'at_risk';
  }
  if (score >= 86 && positiveSignals >= 2) {
    return 'high_intent';
  }
  if (score >= 72) {
    return 'hot';
  }
  if (score >= 52) {
    return 'warm';
  }
  return 'cold';
};

const buildTemperature = ({ score, daysSinceActivity, positiveSignals, overdueFollowUps, settings }) => {
  if (daysSinceActivity !== null && daysSinceActivity >= settings.temperatureThresholds.staleDays) {
    return 'stale';
  }
  if (overdueFollowUps > 0 || (daysSinceActivity !== null && daysSinceActivity >= settings.temperatureThresholds.coolingDays)) {
    return 'cooling';
  }
  if (score >= settings.temperatureThresholds.highIntent && positiveSignals >= 2) {
    return 'high_intent';
  }
  if (score >= settings.temperatureThresholds.hot) {
    return 'hot';
  }
  if (score >= settings.temperatureThresholds.warm) {
    return 'warm';
  }
  if (positiveSignals > 0 || (daysSinceActivity !== null && daysSinceActivity <= 3)) {
    return 'warming';
  }
  return 'cold';
};

const buildPriority = ({
  score,
  overdueFollowUps,
  daysSinceActivity,
  hasAssignee,
  isReactivationCandidate,
  settings,
}) => {
  if (isReactivationCandidate) {
    return 'reactivation_candidate';
  }
  if (daysSinceActivity !== null && daysSinceActivity >= settings.priorityThresholds.staleDays) {
    return 'stale';
  }
  if (overdueFollowUps > 0 || (!hasAssignee && score >= settings.priorityThresholds.highScore)) {
    return 'urgent';
  }
  if (score >= settings.priorityThresholds.urgentScore) {
    return 'urgent';
  }
  if (score >= settings.priorityThresholds.highScore) {
    return 'high';
  }
  if (score >= settings.priorityThresholds.mediumScore) {
    return 'medium';
  }
  return 'low';
};

const buildFactorEntries = (weights, values, explanations = {}) => {
  const totalWeight = Object.values(weights).reduce((sum, value) => sum + Number(value || 0), 0) || 1;
  return Object.entries(weights).map(([key, weight]) => ({
    key,
    label: toTitle(key),
    weight: Number(weight || 0),
    value: roundTo(values[key] || 0, 1),
    contribution: roundTo(((values[key] || 0) * Number(weight || 0)) / totalWeight, 1),
    explanation: explanations[key] || '',
  }));
};

const buildRecommendationList = ({
  lead,
  routingSuggestion,
  assignmentSuggestion,
  score,
  label,
  priority,
  temperature,
  signalSnapshot,
  settings,
}) => {
  const recommendations = [];
  const currentStage = normalizeString(lead?.pipelineStage || lead?.status).toLowerCase();
  const hasPendingFollowUp = (lead?.followUps || []).some((item) =>
    ['pending', 'overdue'].includes(normalizeString(item?.status).toLowerCase())
  );

  if (!hasPendingFollowUp || signalSnapshot.overdueFollowUps > 0) {
    recommendations.push({
      recommendationType: 'schedule_followup',
      recommendationValue: {
        withinHours: signalSnapshot.overdueFollowUps > 0 ? 2 : 24,
        suggestedType: 'call',
      },
      explanation:
        signalSnapshot.overdueFollowUps > 0
          ? 'Urgent action recommended because at least one follow-up is overdue.'
          : 'Suggested next action is to create the next follow-up before the lead cools down.',
      confidence: signalSnapshot.overdueFollowUps > 0 ? 0.92 : 0.74,
      metadata: {
        recommendedNextAction: 'Schedule follow-up',
        actionMode: settings.recommendationMode,
      },
    });
  }

  if (!lead?.primaryAssigneeId && assignmentSuggestion?.primaryAssigneeId) {
    recommendations.push({
      recommendationType: 'assign_user',
      recommendationValue: {
        primaryAssigneeId: assignmentSuggestion.primaryAssigneeId,
        secondaryAssigneeIds: assignmentSuggestion.secondaryAssigneeIds || [],
      },
      explanation: assignmentSuggestion.explanation,
      confidence: assignmentSuggestion.confidence,
      metadata: {
        recommendedNextAction: 'Assign lead owner',
        actionMode: settings.autoAssignmentMode,
        strategyUsed: assignmentSuggestion.strategyUsed,
      },
    });
  }

  if (
    routingSuggestion?.branchId &&
    String(routingSuggestion.branchId) !== String(lead?.activeBranchId || lead?.branchId || '')
  ) {
    recommendations.push({
      recommendationType: lead?.activeBranchId ? 'recommend_transfer' : 'assign_branch',
      recommendationValue: {
        branchId: routingSuggestion.branchId,
      },
      explanation: routingSuggestion.reason,
      confidence: routingSuggestion.confidence,
      metadata: {
        recommendedNextAction: lead?.activeBranchId ? 'Transfer branch' : 'Assign branch',
        actionMode: settings.branchRoutingMode,
        strategyUsed: routingSuggestion.strategyUsed,
      },
    });
  }

  if (score >= 72 && ACTIVE_STAGE_KEYS.includes(currentStage)) {
    recommendations.push({
      recommendationType: 'move_stage',
      recommendationValue: {
        stageKey: currentStage === 'qualified' ? 'interested' : 'qualified',
      },
      explanation:
        label === 'high_intent'
          ? 'Move the lead forward because intent is high and recent engagement signals are strong.'
          : 'The lead has enough momentum to advance to the next working stage.',
      confidence: label === 'high_intent' ? 0.84 : 0.67,
      metadata: {
        recommendedNextAction: 'Advance Funnel stage',
        actionMode: settings.recommendationMode,
      },
    });
  }

  if (signalSnapshot.documentProgressScore < 55 && score >= 58) {
    recommendations.push({
      recommendationType: 'request_documents',
      recommendationValue: {
        checklist: 'Initial document pack',
      },
      explanation:
        'Document progress is weak compared with engagement, so a structured document follow-up is recommended.',
      confidence: 0.69,
      metadata: {
        recommendedNextAction: 'Request documents',
        actionMode: settings.recommendationMode,
      },
    });
  }

  if (signalSnapshot.visitCount === 0 && score >= 70) {
    recommendations.push({
      recommendationType: 'recommend_visit',
      recommendationValue: {
        reason: 'High score with no office visit logged yet.',
      },
      explanation:
        'Recommend an office visit because the lead shows strong intent but does not yet have a recorded in-person interaction.',
      confidence: 0.63,
      metadata: {
        recommendedNextAction: 'Schedule office visit',
        actionMode: settings.recommendationMode,
      },
    });
  }

  if (priority === 'reactivation_candidate') {
    recommendations.push({
      recommendationType: 'recommend_reactivation',
      recommendationValue: {
        channel: signalSnapshot.positiveCallCount > 0 ? 'call' : 'whatsapp',
      },
      explanation:
        'Reactivation recommended because the lead had earlier positive intent but has now gone silent beyond the configured window.',
      confidence: 0.81,
      metadata: {
        recommendedNextAction: 'Reactivate lead',
        actionMode: settings.recommendationMode,
      },
    });
  }

  if (temperature === 'stale' && score < 40) {
    recommendations.push({
      recommendationType: 'recommend_lost',
      recommendationValue: {
        reason: 'consistent_inactivity',
      },
      explanation:
        'Consider marking this lead lost if inactivity continues, because the lead is stale and low-intent based on current evidence.',
      confidence: 0.55,
      metadata: {
        recommendedNextAction: 'Review for loss',
        actionMode: settings.recommendationMode,
      },
    });
  }

  return recommendations.slice(0, 6);
};

const buildInsights = (leads = []) => {
  if (!leads.length) {
    return [];
  }

  const sourceMap = new Map();
  const branchMap = new Map();
  const assigneeMap = new Map();
  let overdueHotLeads = 0;

  leads.forEach((lead) => {
    const sourceKey = normalizeString(lead.source || 'Unknown');
    const branchKey = normalizeString(lead.activeBranchId?.name || lead.branchName || 'Unassigned');
    const assigneeKey = normalizeString(lead.primaryAssigneeId?.name || 'Unassigned');
    const isConverted = Boolean(lead.convertedToStudent || normalizeString(lead.pipelineStage) === 'enrolled');
    const isHot = ['hot', 'high_intent'].includes(normalizeString(lead.aiScoreLabel || lead.metadata?.leadIntelligence?.label));
    const isOverdue = Boolean(lead.nextFollowUp && new Date(lead.nextFollowUp) < new Date());

    if (isHot && isOverdue) {
      overdueHotLeads += 1;
    }

    const sourceCurrent = sourceMap.get(sourceKey) || { total: 0, converted: 0 };
    sourceCurrent.total += 1;
    if (isConverted) {
      sourceCurrent.converted += 1;
    }
    sourceMap.set(sourceKey, sourceCurrent);

    const branchCurrent = branchMap.get(branchKey) || { total: 0, converted: 0, stale: 0 };
    branchCurrent.total += 1;
    if (isConverted) {
      branchCurrent.converted += 1;
    }
    if (normalizeString(lead.priority) === 'stale') {
      branchCurrent.stale += 1;
    }
    branchMap.set(branchKey, branchCurrent);

    const assigneeCurrent = assigneeMap.get(assigneeKey) || { total: 0, converted: 0 };
    assigneeCurrent.total += 1;
    if (isConverted) {
      assigneeCurrent.converted += 1;
    }
    assigneeMap.set(assigneeKey, assigneeCurrent);
  });

  const bestSource = Array.from(sourceMap.entries())
    .map(([label, item]) => ({
      label,
      rate: item.total ? roundTo((item.converted / item.total) * 100, 1) : 0,
      total: item.total,
    }))
    .sort((left, right) => right.rate - left.rate)[0];

  const bestBranch = Array.from(branchMap.entries())
    .map(([label, item]) => ({
      label,
      rate: item.total ? roundTo((item.converted / item.total) * 100, 1) : 0,
      stale: item.stale,
    }))
    .sort((left, right) => right.rate - left.rate)[0];

  const bestAssignee = Array.from(assigneeMap.entries())
    .map(([label, item]) => ({
      label,
      rate: item.total ? roundTo((item.converted / item.total) * 100, 1) : 0,
    }))
    .sort((left, right) => right.rate - left.rate)[0];

  const insights = [];
  if (bestSource?.label) {
    insights.push({
      type: 'source_quality',
      title: `${bestSource.label} leads are converting best`,
      description: `${bestSource.label} is currently converting at ${bestSource.rate}% across ${bestSource.total} tracked leads.`,
      severity: 'info',
    });
  }
  if (bestBranch?.label) {
    insights.push({
      type: 'branch_performance',
      title: `${bestBranch.label} is leading branch conversion`,
      description: `${bestBranch.label} is converting at ${bestBranch.rate}% and has ${bestBranch.stale} stale leads needing review.`,
      severity: bestBranch.stale > 3 ? 'warning' : 'info',
    });
  }
  if (bestAssignee?.label && bestAssignee.label !== 'Unassigned') {
    insights.push({
      type: 'assignee_performance',
      title: `${bestAssignee.label} is strong on active conversions`,
      description: `${bestAssignee.label} currently leads the accessible cohort with a ${bestAssignee.rate}% conversion rate.`,
      severity: 'info',
    });
  }
  if (overdueHotLeads > 0) {
    insights.push({
      type: 'followup_risk',
      title: 'Hot leads are waiting on follow-up',
      description: `${overdueHotLeads} hot or high-intent leads already have overdue follow-ups and need urgent action.`,
      severity: 'critical',
    });
  }

  return insights.slice(0, 6);
};

const applySuggestedAssignment = async ({
  companyId,
  lead,
  assignmentSuggestion,
  routingSuggestion,
  actorId = null,
  triggerType = 'ai_refresh',
}) => {
  if (!lead || !assignmentSuggestion) {
    return null;
  }

  const currentAssignees = uniqIds([
    lead.primaryAssigneeId,
    ...(Array.isArray(lead.assigneeIds) ? lead.assigneeIds : []),
  ]);

  lead.primaryAssigneeId = assignmentSuggestion.primaryAssigneeId || lead.primaryAssigneeId || null;
  lead.assignedCounsellor = lead.primaryAssigneeId || null;
  lead.assignedTo = lead.primaryAssigneeId || null;
  lead.assigneeIds = uniqIds([
    lead.primaryAssigneeId,
    ...currentAssignees,
    ...(assignmentSuggestion.secondaryAssigneeIds || []),
  ]);

  if (routingSuggestion?.branchId) {
    lead.activeBranchId = routingSuggestion.branchId;
    lead.branchId = routingSuggestion.branchId;
  }

  await lead.save();
  await syncLeadAssignments(lead, {
    actorId,
    reason: assignmentSuggestion.reason,
  });

  return AssignmentDecisionLog.create({
    companyId,
    leadId: lead._id,
    triggerType,
    assignedUserId: assignmentSuggestion.primaryAssigneeId || null,
    assignedBranchId: routingSuggestion?.branchId || lead.activeBranchId || null,
    assignedUserIds: uniqIds([
      assignmentSuggestion.primaryAssigneeId,
      ...(assignmentSuggestion.secondaryAssigneeIds || []),
    ]),
    strategyUsed: assignmentSuggestion.strategyUsed || 'manual',
    decisionReason: assignmentSuggestion.reason,
    metadata: {
      explanation: assignmentSuggestion.explanation,
      routingReason: routingSuggestion?.reason || '',
    },
  });
};

const refreshLeadIntelligence = async ({
  companyId,
  lead,
  actorId = null,
  persist = true,
  triggerType = 'ai_refresh',
}) => {
  if (!lead?._id) {
    throw new Error('Lead document is required to calculate intelligence.');
  }

  const [settings, callLogs, visitLogs, latestScoreDoc] = await Promise.all([
    getLeadIntelligenceSettings(companyId),
    CallLog.find({ leadId: lead._id }).sort({ callDate: -1, createdAt: -1 }).limit(20).lean(),
    OfficeVisit.find({ leadId: lead._id }).sort({ visitDate: -1, createdAt: -1 }).limit(20).lean(),
    LeadScore.findOne({ companyId, leadId: lead._id }).sort({ calculatedAt: -1 }).lean(),
  ]);

  const countryRule = await getActiveCountryRule(companyId, getLeadCountryList(lead));
  const [routingSuggestion, assignmentSuggestion, stageDefinitions] = await Promise.all([
    buildBranchSuggestion({ companyId, lead, settings, countryRule, persist: false }),
    buildAssignmentSuggestion({ companyId, lead, settings, countryRule }),
    getTenantLeadStages(companyId),
  ]);

  const lastActivityAt = getLastActivityDate(lead, callLogs, visitLogs);
  const daysSinceActivity = getDaysSince(lastActivityAt);
  const totalFollowUps = Array.isArray(lead.followUps) ? lead.followUps.length : 0;
  const completedFollowUps = (lead.followUps || []).filter((item) => item.status === 'completed').length;
  const overdueFollowUps = (lead.followUps || []).filter((item) => item.status === 'overdue').length;
  const positiveCallCount = callLogs.filter((item) =>
    POSITIVE_CALL_OUTCOMES.some((entry) =>
      normalizeString(item.outcome).toLowerCase().includes(entry)
    )
  ).length;
  const visitCount = visitLogs.length;
  const positiveVisitCount = visitLogs.filter((item) =>
    POSITIVE_VISIT_OUTCOMES.some((entry) =>
      normalizeString(item.visitOutcome).toLowerCase().includes(entry)
    )
  ).length;
  const positiveSignals = getRecentPositiveSignals({ callLogs, visitLogs, lead });
  const qualificationFitScore = getQualificationCompletenessScore(lead);
  const documentProgressScore = lead?.metadata?.documentChecklistComplete
    ? 100
    : clamp(Number(lead?.metadata?.docsSubmittedCount || lead?.metadata?.documentCount || 0) * 25 + 25);

  const stageIndex = stageDefinitions.findIndex(
    (stage) => stage.key === normalizeString(lead.pipelineStage || lead.status).toLowerCase()
  );
  const stageMomentumScore =
    stageIndex >= 0 && stageDefinitions.length > 1
      ? clamp(Math.round((stageIndex / (stageDefinitions.length - 1)) * 100))
      : ACTIVE_STAGE_KEYS.includes(normalizeString(lead.pipelineStage || lead.status).toLowerCase())
        ? 45
        : 20;

  const branchMetricsMap = routingSuggestion?.branchId
    ? await getBranchMetricsMap(companyId, [routingSuggestion.branchId], getLeadCountryList(lead))
    : new Map();
  const assigneeMetricsMap = assignmentSuggestion?.primaryAssigneeId
    ? await getAssigneeMetricsMap(companyId, [assignmentSuggestion.primaryAssigneeId])
    : new Map();

  const branchMetric = routingSuggestion?.branchId
    ? branchMetricsMap.get(String(routingSuggestion.branchId))
    : null;
  const assigneeMetric = assignmentSuggestion?.primaryAssigneeId
    ? assigneeMetricsMap.get(String(assignmentSuggestion.primaryAssigneeId))
    : null;

  const factorValues = {
    sourceQuality:
      settings.sourceWeights[normalizeString(lead.source).toLowerCase()] ||
      settings.sourceWeights.other,
    responseSpeed: scoreFromResponseMinutes(lead?.slaMetrics?.firstResponseMinutes),
    followUpDiscipline:
      totalFollowUps > 0
        ? clamp(Math.round((completedFollowUps / totalFollowUps) * 100) - overdueFollowUps * 12)
        : 38,
    callOutcomes: callLogs.length > 0 ? clamp(positiveCallCount * 24 + 30) : 35,
    visitIntent: visitCount > 0 ? clamp(positiveVisitCount * 28 + 36) : 30,
    documentProgress: documentProgressScore,
    stageMomentum: stageMomentumScore,
    engagementRecency: scoreFromRecencyDays(daysSinceActivity),
    campaignQuality: normalizeString(lead.campaign) ? 62 : 45,
    branchConversionHistory: branchMetric?.conversionRate || 48,
    assigneeConversionHistory: assigneeMetric?.conversionRate || 46,
    qualificationFit: qualificationFitScore,
  };

  const factorExplanations = {
    sourceQuality: `${toTitle(lead.source || 'other')} currently maps to a source-quality baseline of ${factorValues.sourceQuality}.`,
    responseSpeed: `First response timing contributes ${factorValues.responseSpeed} based on ${lead?.slaMetrics?.firstResponseMinutes ?? 'missing'} recorded minutes.`,
    followUpDiscipline: `${completedFollowUps} of ${totalFollowUps || 0} follow-ups are completed with ${overdueFollowUps} overdue.`,
    callOutcomes: `${positiveCallCount} positive call outcomes were found in ${callLogs.length} recent calls.`,
    visitIntent: `${positiveVisitCount} positive office visits were found in ${visitCount} recent visit records.`,
    documentProgress: `Document progress score is ${documentProgressScore} based on checklist and submission metadata.`,
    stageMomentum: `Stage momentum is ${stageMomentumScore} from the current Funnel stage position.`,
    engagementRecency: `Engagement recency contributes ${factorValues.engagementRecency} with last activity ${daysSinceActivity ?? 'unknown'} days ago.`,
    campaignQuality: normalizeString(lead.campaign)
      ? `${lead.campaign} currently receives a neutral campaign-quality score until more conversion history is available.`
      : 'Campaign value is missing, so the campaign factor stays conservative.',
    branchConversionHistory: branchMetric
      ? `The suggested branch is converting at ${branchMetric.conversionRate}%.`
      : 'Branch history is missing, so the branch factor is neutral.',
    assigneeConversionHistory: assigneeMetric
      ? `The suggested assignee is converting at ${assigneeMetric.conversionRate}%.`
      : 'Assignee history is missing, so the assignee factor is neutral.',
    qualificationFit: `Qualification completeness contributes ${qualificationFitScore} based on profile completeness.`,
  };

  const totalWeight =
    Object.values(settings.scoringWeights).reduce((sum, value) => sum + Number(value || 0), 0) || 1;
  const score = clamp(
    Math.round(
      Object.entries(settings.scoringWeights).reduce(
        (sum, [key, weight]) => sum + (factorValues[key] || 0) * Number(weight || 0),
        0
      ) / totalWeight
    )
  );

  const scoreDelta = latestScoreDoc ? score - Number(latestScoreDoc.score || 0) : 0;
  const label = buildScoreLabel({ score, lead, positiveSignals, daysSinceActivity });

  const reactivationReason =
    daysSinceActivity !== null &&
    daysSinceActivity >= settings.reactivationWindowDays &&
    positiveSignals > 0 &&
    (!lead?.status || lead.status !== 'enrolled')
      ? normalizeString(lead.lostReasonLabel).toLowerCase() && !REACTIVATION_LOST_REASONS.some((reason) =>
        normalizeString(lead.lostReasonLabel).toLowerCase().includes(reason)
      )
        ? ''
        : 'Lead had prior positive engagement but is now inactive.'
      : '';

  const isReactivationCandidate = Boolean(reactivationReason);
  const temperature = buildTemperature({
    score,
    daysSinceActivity,
    positiveSignals,
    overdueFollowUps,
    settings,
  });
  const priority = buildPriority({
    score,
    overdueFollowUps,
    daysSinceActivity,
    hasAssignee: Boolean(lead.primaryAssigneeId || lead.assignedCounsellor || lead.assignedTo),
    isReactivationCandidate,
    settings,
  });
  const confidence = clamp(
    roundTo(
      0.32 +
        (callLogs.length > 0 ? 0.12 : 0) +
        (visitLogs.length > 0 ? 0.12 : 0) +
        (totalFollowUps > 0 ? 0.12 : 0) +
        (lead?.slaMetrics?.firstResponseMinutes ? 0.08 : 0) +
        (lead?.metadata?.documentChecklistComplete ? 0.08 : 0),
      2
    ),
    0.25,
    0.92
  );

  const signalSnapshot = {
    daysSinceActivity,
    positiveSignals,
    totalFollowUps,
    completedFollowUps,
    overdueFollowUps,
    positiveCallCount,
    visitCount,
    positiveVisitCount,
    qualificationFitScore,
    documentProgressScore,
    scoreDelta,
    reactivationReason,
  };

  const recommendations = buildRecommendationList({
    lead,
    routingSuggestion,
    assignmentSuggestion,
    score,
    label,
    priority,
    temperature,
    signalSnapshot,
    settings,
  });
  const factorEntries = buildFactorEntries(
    settings.scoringWeights,
    factorValues,
    factorExplanations
  );

  const explanationSummary = [
    `${toTitle(label)} lead because score is ${score}/100.`,
    routingSuggestion?.reason || null,
    assignmentSuggestion?.explanation || null,
    overdueFollowUps > 0
      ? `${overdueFollowUps} follow-up${overdueFollowUps > 1 ? 's are' : ' is'} overdue.`
      : null,
    isReactivationCandidate ? reactivationReason : null,
  ]
    .filter(Boolean)
    .join(' ');

  if (persist) {
    lead.aiScore = score;
    lead.aiScoreLabel = label;
    lead.aiConfidence = confidence;
    lead.leadTemperature = temperature;
    lead.priority = priority;
    lead.leadScore = score;
    lead.leadCategory = buildLegacyCategory(label);
    lead.lastAiScoredAt = getNow();
    lead.metadata = {
      ...(lead.metadata || {}),
      leadIntelligence: {
        score,
        label,
        temperature,
        priority,
        confidence,
        scoringVersion: settings.scoringVersion,
        explanationSummary,
        recommendedNextAction:
          recommendations[0]?.metadata?.recommendedNextAction || 'Review lead',
        scoreDelta,
        isReactivationCandidate,
        reactivationReason,
        routingSuggestion: routingSuggestion
          ? {
            branchId: routingSuggestion.branchId,
            branchName: routingSuggestion.branch?.name || '',
            strategyUsed: routingSuggestion.strategyUsed,
            reason: routingSuggestion.reason,
          }
          : null,
        assignmentSuggestion: assignmentSuggestion
          ? {
            primaryAssigneeId: assignmentSuggestion.primaryAssigneeId,
            secondaryAssigneeIds: assignmentSuggestion.secondaryAssigneeIds,
            strategyUsed: assignmentSuggestion.strategyUsed,
            explanation: assignmentSuggestion.explanation,
          }
          : null,
        factors: factorEntries,
        signalSnapshot,
      },
    };

    await lead.save();

    await LeadScore.create({
      companyId,
      leadId: lead._id,
      score,
      label,
      confidence,
      scoringVersion: settings.scoringVersion,
      scoringFactors: {
        explanationSummary,
        factors: factorEntries,
        signalSnapshot,
      },
      calculatedAt: getNow(),
    });

    await LeadRecommendation.deleteMany({
      companyId,
      leadId: lead._id,
      status: 'suggested',
      'metadata.origin': 'lead_intelligence_current',
    });

    if (recommendations.length) {
      await LeadRecommendation.insertMany(
        recommendations.map((recommendation) => ({
          companyId,
          leadId: lead._id,
          ...recommendation,
          generatedAt: getNow(),
          metadata: {
            ...(recommendation.metadata || {}),
            origin: 'lead_intelligence_current',
          },
        }))
      );
    }

    if (routingSuggestion) {
      await BranchRoutingDecision.create({
        companyId,
        leadId: lead._id,
        recommendedBranchId: routingSuggestion.branchId,
        routingReason: routingSuggestion.reason,
        metadata: {
          confidence: routingSuggestion.confidence,
          strategyUsed: routingSuggestion.strategyUsed,
        },
      });
    }

    await createLeadActivityLog({
      companyId,
      leadId: lead._id,
      branchId: lead.activeBranchId || lead.branchId || null,
      type: 'score_updated',
      message: `AI lead score refreshed to ${score} (${toTitle(label)}) with ${toTitle(priority)} priority`,
      createdBy: actorId || null,
      metadata: {
        score,
        label,
        priority,
        temperature,
        recommendedNextAction:
          recommendations[0]?.metadata?.recommendedNextAction || 'Review lead',
      },
    });
  }

  return {
    score,
    label,
    temperature,
    priority,
    confidence,
    explanationSummary,
    factorEntries,
    signalSnapshot,
    routingSuggestion,
    assignmentSuggestion,
    recommendations,
    settings,
  };
};

const maybeApplyCountryAssignment = async ({
  companyId,
  lead,
  actorId = null,
  triggerType = 'country_selected',
  allowOverwrite = false,
}) => {
  const settings = await getLeadIntelligenceSettings(companyId);
  const countryRule = await getActiveCountryRule(companyId, getLeadCountryList(lead));
  if (!countryRule) {
    return { applied: false, countryRule: null };
  }

  const currentHasAssignments = Boolean(
    lead.primaryAssigneeId ||
      lead.assignedCounsellor ||
      (Array.isArray(lead.assigneeIds) && lead.assigneeIds.length)
  );
  const shouldAutoApply =
    settings.autoAssignmentMode === 'automatic' ||
    settings.branchRoutingMode === 'automatic';
  const canOverwrite =
    allowOverwrite ||
    !currentHasAssignments ||
    settings.allowCountryRuleOverwrite ||
    (settings.autoReassignOnCountryChange && triggerType === 'country_changed');

  if (!shouldAutoApply || !canOverwrite) {
    return { applied: false, countryRule };
  }

  const assignmentSuggestion = await buildAssignmentSuggestion({
    companyId,
    lead,
    settings,
    countryRule,
  });
  const routingSuggestion = await buildBranchSuggestion({
    companyId,
    lead,
    settings,
    countryRule,
    persist: false,
  });

  if (!assignmentSuggestion && !routingSuggestion) {
    return { applied: false, countryRule };
  }

  await applySuggestedAssignment({
    companyId,
    lead,
    assignmentSuggestion,
    routingSuggestion,
    actorId,
    triggerType,
  });

  return {
    applied: true,
    countryRule,
    assignmentSuggestion,
    routingSuggestion,
  };
};

const getLeadIntelligenceProfile = async (companyId, leadId) => {
  const [lead, scoreHistory, recommendations, assignmentLogs, routingDecisions, settings] =
    await Promise.all([
      Lead.findOne({ _id: leadId, companyId, deletedAt: null })
        .populate('activeBranchId', 'name code')
        .populate('primaryAssigneeId', 'name email role primaryRoleKey avatar')
        .lean(),
      LeadScore.find({ companyId, leadId }).sort({ calculatedAt: -1 }).limit(12).lean(),
      LeadRecommendation.find({ companyId, leadId })
        .sort({ generatedAt: -1, createdAt: -1 })
        .limit(20)
        .lean(),
      AssignmentDecisionLog.find({ companyId, leadId })
        .populate('assignedUserId', 'name email role primaryRoleKey')
        .populate('assignedBranchId', 'name code')
        .sort({ createdAt: -1 })
        .limit(12)
        .lean(),
      BranchRoutingDecision.find({ companyId, leadId })
        .populate('recommendedBranchId', 'name code')
        .populate('acceptedBy', 'name email')
        .sort({ createdAt: -1 })
        .limit(12)
        .lean(),
      getLeadIntelligenceSettings(companyId),
    ]);

  if (!lead) {
    throw new Error('Lead not found');
  }

  return {
    lead,
    latestScore: scoreHistory[0] || null,
    scoreHistory,
    recommendations,
    assignmentLogs,
    routingDecisions,
    currentIntelligence: lead.metadata?.leadIntelligence || null,
    settings: {
      scoringVersion: settings.scoringVersion,
      explainabilityVisible: settings.explainabilityVisible,
      autoAssignmentMode: settings.autoAssignmentMode,
      branchRoutingMode: settings.branchRoutingMode,
      recommendationMode: settings.recommendationMode,
    },
  };
};

const getLeadIntelligenceOverview = async ({ companyId, filter = {} }) => {
  const leads = await Lead.find({
    companyId,
    deletedAt: null,
    ...filter,
  })
    .populate('activeBranchId', 'name code')
    .populate('primaryAssigneeId', 'name email role primaryRoleKey')
    .sort({ aiScore: -1, updatedAt: -1 })
    .limit(250)
    .lean();

  const topPriorityLeads = leads
    .filter((lead) => ['urgent', 'high', 'stale', 'reactivation_candidate'].includes(normalizeString(lead.priority)))
    .slice(0, 12);
  const hotLeads = leads.filter((lead) =>
    ['hot', 'high_intent'].includes(normalizeString(lead.leadTemperature || lead.metadata?.leadIntelligence?.temperature))
  );
  const urgentLeads = leads.filter((lead) => normalizeString(lead.priority) === 'urgent');
  const staleLeads = leads.filter((lead) =>
    ['stale', 'reactivation_candidate'].includes(normalizeString(lead.priority))
  );
  const reactivationCandidates = leads.filter((lead) =>
    normalizeString(lead.priority) === 'reactivation_candidate'
  );
  const needsReassignment = leads.filter((lead) => !lead.primaryAssigneeId);

  const scoreDistribution = ['high_intent', 'hot', 'warm', 'cold', 'at_risk'].map((label) => ({
    label,
    count: leads.filter(
      (lead) => normalizeString(lead.aiScoreLabel || lead.metadata?.leadIntelligence?.label) === label
    ).length,
  }));

  const activeRecommendations = await LeadRecommendation.find({
    companyId,
    status: 'suggested',
  })
    .sort({ generatedAt: -1 })
    .limit(25)
    .lean();

  return {
    widgets: {
      hotLeads: hotLeads.length,
      urgentLeads: urgentLeads.length,
      staleLeads: staleLeads.length,
      reactivationCandidates: reactivationCandidates.length,
      needsReassignment: needsReassignment.length,
      routingSuggestions: activeRecommendations.filter((item) =>
        ['assign_branch', 'recommend_transfer'].includes(item.recommendationType)
      ).length,
    },
    scoreDistribution,
    topPriorityLeads,
    activeRecommendations,
    insights: buildInsights(leads),
  };
};

const executeLeadRecommendation = async ({
  companyId,
  leadId,
  recommendationId,
  actorId = null,
}) => {
  const [lead, recommendation] = await Promise.all([
    Lead.findOne({ _id: leadId, companyId, deletedAt: null }),
    LeadRecommendation.findOne({ _id: recommendationId, companyId, leadId }),
  ]);

  if (!lead) {
    throw new Error('Lead not found.');
  }
  if (!recommendation) {
    throw new Error('Recommendation not found.');
  }

  const value = recommendation.recommendationValue || {};

  switch (recommendation.recommendationType) {
  case 'assign_user':
  case 'reassign_user':
    lead.primaryAssigneeId = value.primaryAssigneeId || lead.primaryAssigneeId || null;
    lead.assignedCounsellor = lead.primaryAssigneeId || null;
    lead.assignedTo = lead.primaryAssigneeId || null;
    lead.assigneeIds = uniqIds([
      lead.primaryAssigneeId,
      ...(Array.isArray(lead.assigneeIds) ? lead.assigneeIds : []),
      ...(Array.isArray(value.secondaryAssigneeIds) ? value.secondaryAssigneeIds : []),
    ]);
    await lead.save();
    await syncLeadAssignments(lead, {
      actorId,
      reason: recommendation.explanation,
    });
    break;
  case 'assign_branch':
  case 'recommend_transfer':
    if (value.branchId) {
      lead.activeBranchId = value.branchId;
      lead.branchId = value.branchId;
      await lead.save();
    }
    break;
  case 'schedule_followup':
    lead.followUps = lead.followUps || [];
    lead.followUps.push({
      scheduledAt: new Date(Date.now() + Number(value.withinHours || 24) * 3600000),
      scheduledBy: actorId || null,
      type: value.suggestedType || 'call',
      notes: recommendation.explanation,
      status: 'pending',
      counsellorName: '',
    });
    await lead.save();
    break;
  case 'move_stage':
    if (value.stageKey) {
      lead.status = value.stageKey;
      lead.pipelineStage = value.stageKey;
      await lead.save();
    }
    break;
  default:
    break;
  }

  recommendation.status = 'executed';
  recommendation.resolvedAt = getNow();
  await recommendation.save();

  await createLeadActivityLog({
    companyId,
    leadId: lead._id,
    branchId: lead.activeBranchId || lead.branchId || null,
    type: 'assignment_changed',
    message: `Lead intelligence recommendation executed: ${toTitle(recommendation.recommendationType)}`,
    createdBy: actorId || null,
    metadata: {
      recommendationType: recommendation.recommendationType,
      recommendationId: recommendation._id,
    },
  });

  return {
    lead,
    recommendation,
  };
};

module.exports = {
  DEFAULT_SETTINGS,
  deleteAssignmentRule,
  deleteCountryAssignmentRule,
  executeLeadRecommendation,
  getLeadIntelligenceOverview,
  getLeadIntelligenceProfile,
  getLeadIntelligenceSettings,
  listAssignmentRules,
  listCountryAssignmentRules,
  maybeApplyCountryAssignment,
  refreshLeadIntelligence,
  saveAssignmentRule,
  saveCountryAssignmentRule,
  saveLeadIntelligenceSettings,
};
