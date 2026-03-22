const mongoose = require('mongoose');
const Lead = require('../models/Lead');
const Student = require('../models/Student');
const Activity = require('../models/Activity');
const Branch = require('../models/Branch');
const CountryWorkflow = require('../models/CountryWorkflow');
const User = require('../models/User');
const LeadAssignment = require('../models/LeadAssignment');
const LeadBranchTransfer = require('../models/LeadBranchTransfer');
const LeadActivityLog = require('../models/LeadActivityLog');
const { sendSuccess, sendError } = require('../utils/responseHandler');
const { calculateLeadScore } = require('../utils/leadScoring');
const { runReminderSweep } = require('../services/followUpReminder.service');
const {
  getPrimaryCountryWorkflow,
  getTenantLeadStages,
} = require('../services/countryWorkflow.service');
const {
  findBestCounsellorMatch,
  normalizeCountryList,
} = require('../services/counsellorMatching.service');
const {
  buildScopedClause,
  getManagedUserIds,
  getUserBranchIds,
  hasPermission,
  mergeFiltersWithAnd,
  toObjectIdString,
} = require('../services/accessControl.service');
const { runAutomationEvent } = require('../services/automation.service');
const {
  createLeadActivityLog,
  resolveAssigneeIds,
  resolvePrimaryAssigneeId,
  syncLeadAssignments,
} = require('../services/leadCollaboration.service');
const { buildBoardData, getStageByIdentifier, moveLeadToStage } = require('../services/funnel.service');

const PIPELINE_STATUSES = [
  'new',
  'contacted',
  'qualified',
  'counselling_scheduled',
  'counselling_done',
  'application_started',
  'documents_pending',
  'application_submitted',
  'offer_received',
  'visa_applied',
  'enrolled',
  'lost',
];

const FOLLOW_UP_METHODS = ['call', 'whatsapp', 'email', 'in_person', 'meeting', 'sms', 'other'];
const FOLLOW_UP_OUTCOMES = [
  'next_followup_needed',
  'converted_to_student',
  'closed_not_interested',
  'no_response',
  'other',
];

const asyncHandler = (fn) => (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next);

const normalizeString = (value) => {
  if (typeof value === 'undefined' || value === null) {
    return undefined;
  }
  const nextValue = String(value).trim();
  return nextValue ? nextValue : '';
};

const normalizeLowerString = (value) => {
  const nextValue = normalizeString(value);
  return typeof nextValue === 'string' ? nextValue.toLowerCase() : nextValue;
};

const normalizeBoolean = (value) => {
  if (typeof value === 'boolean') {
    return value;
  }
  if (value === null || typeof value === 'undefined' || value === '') {
    return undefined;
  }
  return ['1', 'true', 'yes', 'on'].includes(String(value).toLowerCase());
};

const normalizeNumber = (value) => {
  if (value === null || typeof value === 'undefined' || value === '') {
    return undefined;
  }
  const nextValue = Number(value);
  return Number.isFinite(nextValue) ? nextValue : undefined;
};

const normalizeDate = (value) => {
  if (!value) {
    return undefined;
  }
  const nextValue = new Date(value);
  return Number.isNaN(nextValue.getTime()) ? undefined : nextValue;
};

const formatLeadName = (lead) =>
  lead?.fullName || lead?.name || `${lead?.firstName || ''} ${lead?.lastName || ''}`.trim();

const getEntityLabel = (record) =>
  record?.serviceType === 'test_prep' ? 'Student' : 'Client';

const splitName = (value) => {
  const normalizedValue = normalizeString(value);
  if (!normalizedValue) {
    return {};
  }

  const parts = normalizedValue.split(/\s+/);
  const firstName = parts.shift() || '';
  const lastName = parts.join(' ');

  return {
    name: normalizedValue,
    firstName,
    lastName,
  };
};

const normalizeObjectIdArray = (value) =>
  Array.from(
    new Set(
      (Array.isArray(value) ? value : String(value || '').split(','))
        .map((entry) => normalizeString(entry))
        .filter(Boolean)
    )
  );

const hasFullLeadAccess = (user) =>
  Boolean(
    user?.effectiveAccess?.isHeadOffice ||
      hasPermission(user, 'leads', 'manage') ||
      hasPermission(user, 'leads', 'assign')
  );

const shouldAutoAssignToSelf = (user) =>
  ['agent', 'follow_up_team', 'counselor', 'counsellor'].includes(
    user?.effectiveAccess?.roleKey || user?.primaryRoleKey || user?.role
  );

const buildLeadAssigneeList = (lead) => {
  const items = [];
  const seen = new Set();

  [lead?.primaryAssigneeId, ...(Array.isArray(lead?.assigneeIds) ? lead.assigneeIds : []), lead?.assignedCounsellor]
    .filter(Boolean)
    .forEach((assignee) => {
      const id = toObjectIdString(assignee);
      if (!id || seen.has(id)) {
        return;
      }
      seen.add(id);
      items.push(assignee);
    });

  return items;
};

const serializeLeadCollaboration = (lead) => {
  if (!lead) {
    return lead;
  }

  const baseLead = lead?.toObject ? lead.toObject() : { ...lead };
  const primaryAssignee =
    baseLead.primaryAssigneeId || baseLead.assignedCounsellor || baseLead.assignedTo || null;
  const assignees = buildLeadAssigneeList(baseLead);

  return {
    ...baseLead,
    tenantId: baseLead.companyId,
    activeBranchId: baseLead.activeBranchId || baseLead.branchId || null,
    activeBranch: baseLead.activeBranchId || baseLead.branchId || null,
    primaryAssigneeId: primaryAssignee?._id || primaryAssignee || null,
    primaryAssignee,
    assigneeIds: assignees,
    assignees,
    assigneeCount: assignees.length,
    hasTransfers: Boolean(baseLead.transferHistory?.length),
    transferCount: Array.isArray(baseLead.transferHistory) ? baseLead.transferHistory.length : 0,
    activityLogs: baseLead.activityLogs || baseLead.activities || [],
  };
};

const fetchLeadCollaboration = async (companyId, leadId) =>
  Promise.all([
    LeadAssignment.find({
      companyId,
      leadId,
      active: true,
    })
      .populate('userId', 'name email role primaryRoleKey avatar branchId')
      .populate('assignedBy', 'name email')
      .sort({ isPrimary: -1, assignedAt: 1 })
      .lean(),
    LeadBranchTransfer.find({
      companyId,
      leadId,
    })
      .populate('fromBranchId', 'name code')
      .populate('toBranchId', 'name code')
      .populate('requestedBy', 'name email')
      .populate('approvedBy', 'name email')
      .populate('toAssigneeId', 'name email role primaryRoleKey')
      .sort({ createdAt: -1 })
      .lean(),
  ]);

const sanitizeQualification = (qualification) => ({
  country: normalizeString(qualification?.country) || '',
  institution: normalizeString(qualification?.institution) || '',
  degree: normalizeString(qualification?.degree) || '',
  course: normalizeString(qualification?.course) || '',
  gradeType: normalizeString(qualification?.gradeType) || '',
  point: normalizeString(qualification?.point) || '',
  percentageValue: normalizeString(
    qualification?.percentageValue || qualification?.percentage || qualification?.gradeValue
  ) || '',
  universityTitle: normalizeString(qualification?.universityTitle) || '',
  level: normalizeString(qualification?.level) || '',
  passedYear: normalizeString(qualification?.passedYear) || '',
  startedAt: normalizeDate(qualification?.startedAt || qualification?.fromDate),
  completedAt: normalizeDate(qualification?.completedAt || qualification?.toDate),
  resultDate: normalizeDate(qualification?.resultDate),
});

const sanitizeLeadPayload = (rawPayload = {}) => {
  const rawName = normalizeString(rawPayload.name || rawPayload.fullName);
  const rawFirstName = normalizeString(rawPayload.firstName);
  const rawLastName = normalizeString(rawPayload.lastName);
  const nameParts = rawName
    ? splitName(rawName)
    : {
      name: [rawFirstName, rawLastName].filter(Boolean).join(' ') || undefined,
      firstName: rawFirstName,
      lastName: rawLastName || '',
    };

  const preferredCountries = Array.isArray(rawPayload.preferredCountries)
    ? rawPayload.preferredCountries.map((value) => normalizeString(value)).filter(Boolean)
    : rawPayload.preferredCountries
      ? String(rawPayload.preferredCountries)
        .split(',')
        .map((value) => normalizeString(value))
        .filter(Boolean)
      : undefined;

  const tags = Array.isArray(rawPayload.tags)
    ? rawPayload.tags.map((value) => normalizeString(value)).filter(Boolean)
    : rawPayload.tags
      ? String(rawPayload.tags)
        .split(',')
        .map((value) => normalizeString(value))
        .filter(Boolean)
      : undefined;

  const phone = normalizeString(rawPayload.phone);
  const mobile = normalizeString(rawPayload.mobile);
  const preferredStudyLevel = normalizeString(rawPayload.preferredStudyLevel || rawPayload.courseLevel);
  const primaryAssigneeId =
    normalizeString(
      rawPayload.primaryAssigneeId ||
        rawPayload.assignedCounsellor ||
        rawPayload.assignedTo ||
        rawPayload.assignee
    ) || undefined;
  const assigneeIds = normalizeObjectIdArray(
    rawPayload.assigneeIds || rawPayload.assignees || primaryAssigneeId || []
  );
  const assignedCounsellor =
    primaryAssigneeId || undefined;

  const payload = {
    ...nameParts,
    email: normalizeLowerString(rawPayload.email),
    phone: phone || mobile || undefined,
    mobile: mobile || phone || undefined,
    whatsappNumber: normalizeString(rawPayload.whatsappNumber) || undefined,
    fullAddress:
      normalizeString(rawPayload.fullAddress || rawPayload.addressText || rawPayload.address) ||
      undefined,
    dob: normalizeDate(rawPayload.dob || rawPayload.dateOfBirth),
    gender: normalizeLowerString(rawPayload.gender),
    guardianName: normalizeString(rawPayload.guardianName) || undefined,
    guardianContact: normalizeString(rawPayload.guardianContact) || undefined,
    maritalStatus: normalizeLowerString(rawPayload.maritalStatus),
    appliedCountryBefore: normalizeBoolean(
      rawPayload.appliedCountryBefore || rawPayload.hasAppliedCountryBefore
    ),
    howDidYouKnowUs: normalizeString(rawPayload.howDidYouKnowUs) || undefined,
    source: normalizeLowerString(rawPayload.source),
    sourceType: normalizeLowerString(rawPayload.sourceType) || undefined,
    sourceMeta:
      rawPayload.sourceMeta && typeof rawPayload.sourceMeta === 'object'
        ? rawPayload.sourceMeta
        : undefined,
    campaign: normalizeString(rawPayload.campaign) || undefined,
    branchId: normalizeString(rawPayload.branchId || rawPayload.activeBranchId) || undefined,
    activeBranchId: normalizeString(rawPayload.activeBranchId || rawPayload.branchId) || undefined,
    branchName: normalizeString(rawPayload.branchName) || undefined,
    serviceType: normalizeLowerString(rawPayload.serviceType) || undefined,
    entityType: normalizeLowerString(rawPayload.entityType) || undefined,
    stream: normalizeString(rawPayload.stream) || undefined,
    interestedFor: normalizeString(rawPayload.interestedFor) || undefined,
    courseLevel: preferredStudyLevel || undefined,
    preferredLocation: normalizeString(rawPayload.preferredLocation) || undefined,
    interestedCourse: normalizeString(rawPayload.interestedCourse) || undefined,
    preferredCountries,
    preferredStudyLevel: preferredStudyLevel || undefined,
    preferredIntake: normalizeString(rawPayload.preferredIntake) || undefined,
    budget: normalizeNumber(rawPayload.budget),
    preparationClass: normalizeString(rawPayload.preparationClass) || undefined,
    overallScore: normalizeString(rawPayload.overallScore) || undefined,
    workExperience: normalizeString(rawPayload.workExperience) || undefined,
    tags,
    status: normalizeLowerString(rawPayload.status || rawPayload.pipelineStage),
    pipelineStage: normalizeLowerString(rawPayload.pipelineStage || rawPayload.status),
    recordType: normalizeLowerString(rawPayload.recordType),
    assignedCounsellor,
    assignedTo: assignedCounsellor,
    primaryAssigneeId: primaryAssigneeId || undefined,
    assigneeIds: assigneeIds.length ? assigneeIds : undefined,
    formId: normalizeString(rawPayload.formId) || undefined,
    address: rawPayload.address && typeof rawPayload.address === 'object' ? rawPayload.address : undefined,
    education: rawPayload.education
      ? {
        lastDegree: normalizeString(rawPayload.education.lastDegree) || undefined,
        institution: normalizeString(rawPayload.education.institution) || undefined,
        percentage: normalizeNumber(rawPayload.education.percentage),
        passingYear: normalizeNumber(rawPayload.education.passingYear),
        gpa: normalizeNumber(rawPayload.education.gpa),
      }
      : undefined,
    englishTest: rawPayload.englishTest
      ? {
        type: normalizeLowerString(rawPayload.englishTest.type) || 'none',
        score: normalizeNumber(rawPayload.englishTest.score),
        dateTaken: normalizeDate(rawPayload.englishTest.dateTaken),
      }
      : undefined,
    qualifications: Array.isArray(rawPayload.qualifications)
      ? rawPayload.qualifications.map(sanitizeQualification).filter((item) =>
        Object.values(item).some(Boolean)
      )
      : undefined,
  };

  return payload;
};

const getValidationErrors = (payload, { isUpdate = false } = {}) => {
  const errors = [];

  if (!isUpdate && !normalizeString(payload.name || payload.firstName)) {
    errors.push('Lead name is required.');
  }
  if (!isUpdate && !normalizeString(payload.mobile || payload.phone)) {
    errors.push('Mobile number is required.');
  }
  if (!isUpdate && !normalizeString(payload.interestedFor)) {
    errors.push('Interested For is required.');
  }
  if (!isUpdate && !normalizeString(payload.courseLevel || payload.preferredStudyLevel)) {
    errors.push('Course Level is required.');
  }
  if (!isUpdate && !normalizeString(payload.stream)) {
    errors.push('Stream is required.');
  }
  if (!isUpdate && !normalizeString(payload.branchName) && !normalizeString(payload.branchId)) {
    errors.push('Branch Name is required.');
  }
  if (payload.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(payload.email)) {
    errors.push('Email address is invalid.');
  }
  if (payload.serviceType && !['consultancy', 'test_prep'].includes(payload.serviceType)) {
    errors.push('Service type must be consultancy or test_prep.');
  }

  return errors;
};

const formatStageLabel = (value) =>
  String(value || '')
    .replace(/_/g, ' ')
    .replace(/\b\w/g, (char) => char.toUpperCase());

const getStageNumber = (status, workflowStages = []) => {
  const matchedWorkflowStage = workflowStages.find((stage) => stage.key === status);
  if (matchedWorkflowStage) {
    return Number(matchedWorkflowStage.order || 1);
  }

  switch (status) {
  case 'new':
    return 1;
  case 'contacted':
  case 'qualified':
    return 2;
  case 'counselling_scheduled':
  case 'counselling_done':
    return 3;
  case 'application_started':
  case 'documents_pending':
  case 'application_submitted':
  case 'offer_received':
    return 4;
  case 'visa_applied':
    return 5;
  case 'enrolled':
  case 'lost':
    return 6;
  default:
    return 1;
  }
};

const resolveLeadWorkflow = async (companyId, preferredCountries = []) => {
  const normalizedCountries = normalizeCountryList(preferredCountries);
  if (!normalizedCountries.length) {
    return { workflow: null, workflowStages: await getTenantLeadStages(companyId) };
  }

  const workflow = await getPrimaryCountryWorkflow(companyId, normalizedCountries);
  const workflowStages =
    workflow?.leadStages?.length ? workflow.leadStages : await getTenantLeadStages(companyId);

  return { workflow, workflowStages };
};

const getScopedLeadFilter = async (req, extra = {}) =>
  mergeFiltersWithAnd(
    { companyId: req.companyId, deletedAt: null },
    await buildScopedClause(req.user, 'leads', {
      branchField: 'branchId',
      assigneeFields: ['assignedCounsellor', 'assignedTo', 'primaryAssigneeId', 'assigneeIds'],
      creatorFields: ['createdByUser'],
      ownerFields: ['ownerUserId'],
    }),
    extra
  );

const canWriteLead = (user, lead) => {
  if (hasFullLeadAccess(user)) {
    return true;
  }

  if (
    lead.ownershipLocked &&
    !hasPermission(user, 'leads', 'override') &&
    !hasPermission(user, 'leads', 'unlock')
  ) {
    return String(lead.ownerUserId || lead.assignedCounsellor || '') === String(user?._id || '');
  }

  const userBranchIds = getUserBranchIds(user);
  const leadBranchId = toObjectIdString(lead.branchId);
  const leadAssigneeIds = resolveAssigneeIds(lead);

  if (
    leadAssigneeIds.includes(String(user?._id || '')) ||
    String(lead.primaryAssigneeId || lead.assignedCounsellor || lead.assignedTo || '') ===
      String(user?._id || '')
  ) {
    return true;
  }
  if (String(lead.createdByUser || lead.ownerUserId || '') === String(user?._id || '')) {
    return true;
  }
  if (leadBranchId && userBranchIds.includes(leadBranchId) && hasPermission(user, 'leads', 'edit')) {
    return true;
  }

  return false;
};

const populateLead = (query) =>
  query
    .populate('assignedCounsellor', 'name email phone role')
    .populate('primaryAssigneeId', 'name email phone role primaryRoleKey avatar branchId')
    .populate('assigneeIds', 'name email phone role primaryRoleKey avatar branchId')
    .populate('studentId', 'fullName email phone status')
    .populate('branchId', 'name location')
    .populate('activeBranchId', 'name location code')
    .populate('currentFunnelStageId', 'name key color order isTerminal isWon isLost slaHours')
    .populate('lostReasonId', 'label')
    .populate('activities.performedBy', 'name email')
    .populate('assignmentHistory.counsellor', 'name email')
    .populate('assignmentHistory.assignedBy', 'name email')
    .populate('notes.createdBy', 'name email')
    .populate('followUps.scheduledBy', 'name email')
    .populate('followUps.completedBy', 'name email')
    .populate('followUps.convertedStudentId', 'fullName email phone');

const DASHBOARD_LEAD_SELECT =
  'firstName lastName name branchName dob createdAt status pipelineStage';

const DASHBOARD_FOLLOW_UP_SELECT =
  'firstName lastName name email phone mobile source branchName stream status pipelineStage assignedCounsellor followUps nextFollowUp lastContactedAt convertedToStudent';

const populateDashboardFollowUps = (query) =>
  query.populate('assignedCounsellor', 'name').lean();

const logActivity = async (companyId, entityId, action, description, performedBy, meta = {}) => {
  try {
    await Activity.create({
      companyId,
      module: 'crm',
      entityType: 'lead',
      entityId,
      action,
      description,
      performedBy,
      performedByName: meta.performedByName,
      metadata: meta,
    });

    await createLeadActivityLog({
      companyId,
      leadId: entityId,
      type: action,
      message: description,
      createdBy: performedBy,
      metadata: meta,
    });
  } catch (error) {
    console.error('Activity log error:', error.message);
  }
};

const addLeadActivity = (lead, type, description, performedBy, metadata = {}) => {
  lead.activities = lead.activities || [];
  lead.activities.push({ type, description, performedBy, metadata });
};

const buildAutoFollowUp = (workflow, actorId, counsellorName = '') => {
  if (!workflow?.followUpRules?.initialHours) {
    return null;
  }

  const scheduledAt = new Date(Date.now() + workflow.followUpRules.initialHours * 60 * 60 * 1000);
  return {
    scheduledAt,
    scheduledBy: actorId,
    type: 'call',
    notes: `Auto-scheduled by ${workflow.country} workflow`,
    status: 'pending',
    counsellorName,
  };
};

const applyBranchQueryFilter = (req, filter) => {
  if (!req.query.branchId || !mongoose.Types.ObjectId.isValid(req.query.branchId)) {
    return filter;
  }

  return mergeFiltersWithAnd(filter, { branchId: req.query.branchId });
};

const syncLeadFollowUps = (lead) => {
  const now = new Date();
  let changed = false;

  for (const followUp of lead.followUps || []) {
    if (
      ['pending', 'overdue'].includes(followUp.status) &&
      followUp.scheduledAt &&
      new Date(followUp.scheduledAt) <= now
    ) {
      if (followUp.status !== 'overdue') {
        followUp.status = 'overdue';
        followUp.reminderMeta = followUp.reminderMeta || {};
        followUp.reminderMeta.isOverdue = true;
        changed = true;
      }
    }
  }

  const nextFollowUp = (lead.followUps || [])
    .filter((item) => ['pending', 'overdue'].includes(item.status))
    .sort((left, right) => new Date(left.scheduledAt) - new Date(right.scheduledAt))[0];
  const nextFollowUpDate = nextFollowUp ? new Date(nextFollowUp.scheduledAt) : null;
  if (String(lead.nextFollowUp || '') !== String(nextFollowUpDate || '')) {
    lead.nextFollowUp = nextFollowUpDate;
    changed = true;
  }

  return changed;
};

const hydrateBranchName = async (companyId, payload) => {
  if (payload.branchId && !payload.branchName) {
    const branch = await Branch.findOne({ _id: payload.branchId, companyId }).select('name');
    if (branch) {
      payload.branchName = branch.name;
    }
  }
  return payload;
};

const ensureCounsellorInCompany = async (companyId, counsellorId) => {
  if (!counsellorId) {
    return null;
  }
  return User.findOne({
    _id: counsellorId,
    companyId,
    isActive: true,
    role: {
      $in: [
        'counselor',
        'manager',
        'sales',
        'admin',
        'super_admin',
        'super_admin_manager',
        'follow_up_team',
        'branch_manager',
        'head_office_admin',
        'tenant_admin',
        'branch_admin',
        'counsellor',
        'finance',
        'operations',
      ],
    },
  }).select('name email role');
};

const ensureUsersInCompany = async (companyId, userIds = []) => {
  const normalizedUserIds = normalizeObjectIdArray(userIds);
  if (!normalizedUserIds.length) {
    return [];
  }

  return User.find({
    _id: { $in: normalizedUserIds },
    companyId,
    isActive: true,
  }).select('name email role primaryRoleKey avatar branchId');
};

const findDuplicateLead = async (companyId, payload, excludeLeadId = null) => {
  const orConditions = [];
  if (payload.mobile || payload.phone) {
    const phoneValue = payload.mobile || payload.phone;
    orConditions.push({ phone: phoneValue }, { mobile: phoneValue });
  }
  if (payload.email) {
    orConditions.push({ email: payload.email });
  }
  if (!orConditions.length) {
    return null;
  }

  const filter = { companyId, deletedAt: null, $or: orConditions };
  if (excludeLeadId) {
    filter._id = { $ne: excludeLeadId };
  }

  return Lead.findOne(filter).select(
    'firstName lastName name email phone mobile status pipelineStage assignedCounsellor createdAt'
  );
};

exports.getLeads = asyncHandler(async (req, res) => {
  const {
    page = 1,
    limit = 20,
    search,
    status,
    source,
    counsellor,
    branch,
    branchId,
    sortBy = 'createdAt',
    sortOrder = 'desc',
    category,
    fromDate,
    toDate,
    course,
    recordType,
    viewScope,
    transferredOnly,
  } = req.query;
  const isCompactView = String(req.query.compact || '').toLowerCase() === 'dashboard';

  const filterParts = [await getScopedLeadFilter(req)];

  if (status) {
    filterParts.push({ status });
  }
  if (source) {
    filterParts.push({ source });
  }
  if (counsellor && hasFullLeadAccess(req.user)) {
    filterParts.push({
      $or: [
        { assignedCounsellor: counsellor },
        { primaryAssigneeId: counsellor },
        { assigneeIds: counsellor },
      ],
    });
  }
  if (category) {
    filterParts.push({ leadCategory: category });
  }
  if (recordType) {
    filterParts.push({ recordType });
  }
  if (course) {
    filterParts.push({ interestedCourse: { $regex: course, $options: 'i' } });
  }
  if (branch || branchId) {
    const branchFilterValue = branchId || branch;
    filterParts.push({
      $or: [
        mongoose.Types.ObjectId.isValid(branchFilterValue)
          ? { $or: [{ branchId: branchFilterValue }, { activeBranchId: branchFilterValue }] }
          : null,
        { branchName: { $regex: branchFilterValue, $options: 'i' } },
      ].filter(Boolean),
    });
  }
  if (fromDate || toDate) {
    const createdAt = {};
    if (fromDate) {
      createdAt.$gte = new Date(fromDate);
    }
    if (toDate) {
      createdAt.$lte = new Date(toDate);
    }
    filterParts.push({ createdAt });
  }
  if (search) {
    filterParts.push({
      $or: [
        { firstName: { $regex: search, $options: 'i' } },
        { lastName: { $regex: search, $options: 'i' } },
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
        { phone: { $regex: search, $options: 'i' } },
        { mobile: { $regex: search, $options: 'i' } },
        { interestedCourse: { $regex: search, $options: 'i' } },
        { branchName: { $regex: search, $options: 'i' } },
      ],
    });
  }

  const normalizedViewScope = String(viewScope || '').trim().toLowerCase();
  if (normalizedViewScope === 'my') {
    filterParts.push({
      $or: [
        { primaryAssigneeId: req.user._id },
        { assignedCounsellor: req.user._id },
        { assigneeIds: req.user._id },
        { createdByUser: req.user._id },
      ],
    });
  }
  if (normalizedViewScope === 'team') {
    const managedUserIds = await getManagedUserIds(req.user);
    if (managedUserIds.length) {
      filterParts.push({
        $or: [
          { primaryAssigneeId: { $in: managedUserIds } },
          { assignedCounsellor: { $in: managedUserIds } },
          { assigneeIds: { $in: managedUserIds } },
          { createdByUser: { $in: managedUserIds } },
        ],
      });
    }
  }
  if (normalizedViewScope === 'branch') {
    const branchIds = getUserBranchIds(req.user);
    if (branchIds.length) {
      filterParts.push({
        $or: [{ branchId: { $in: branchIds } }, { activeBranchId: { $in: branchIds } }],
      });
    }
  }
  if (normalizedViewScope === 'transferred' || normalizeBoolean(transferredOnly)) {
    filterParts.push({ 'transferHistory.0': { $exists: true } });
  }

  const filter = mergeFiltersWithAnd(...filterParts);

  const skip = (Number(page) - 1) * Number(limit);
  const sort = { [sortBy]: sortOrder === 'asc' ? 1 : -1 };
  const leadListQuery = Lead.find(filter).sort(sort).skip(skip).limit(Number(limit));

  if (isCompactView) {
    leadListQuery.select(DASHBOARD_LEAD_SELECT).lean();
  }

  const [rawLeads, total] = await Promise.all([
    isCompactView ? leadListQuery : populateLead(leadListQuery).lean(),
    Lead.countDocuments(filter),
  ]);
  const leads = rawLeads.map((lead) => serializeLeadCollaboration(lead));

  if (isCompactView) {
    res.set('Cache-Control', 'private, max-age=30, stale-while-revalidate=60');
  }

  sendSuccess(res, 200, 'Leads fetched', {
    leads,
    pagination: {
      total,
      page: Number(page),
      limit: Number(limit),
      pages: Math.ceil(total / Number(limit)) || 1,
    },
  });
});

exports.getWorkflowOptions = asyncHandler(async (req, res) => {
  const [workflows, stages] = await Promise.all([
    CountryWorkflow.find({ companyId: req.companyId, isActive: true })
      .sort({ country: 1 })
      .lean(),
    getTenantLeadStages(req.companyId),
  ]);

  sendSuccess(res, 200, 'Lead workflow options fetched', {
    workflows,
    stages,
  });
});

exports.createLead = asyncHandler(async (req, res) => {
  const payload = sanitizeLeadPayload(req.body);
  const { workflow, workflowStages } = await resolveLeadWorkflow(
    req.companyId,
    payload.preferredCountries || []
  );
  const allowedStageKeys = workflowStages.map((stage) => stage.key);

  if (payload.status && !allowedStageKeys.includes(payload.status)) {
    return sendError(res, 400, 'Invalid lead pipeline stage for the selected country workflow.');
  }

  if (!payload.assignedCounsellor && shouldAutoAssignToSelf(req.user)) {
    payload.assignedCounsellor = req.user._id;
    payload.assignedTo = req.user._id;
    payload.primaryAssigneeId = req.user._id;
  }

  let autoMatch = null;
  if (!payload.assignedCounsellor) {
    autoMatch = await findBestCounsellorMatch({
      companyId: req.companyId,
      branchId: payload.branchId || req.user?.branchId?._id || req.user?.branchId || null,
      preferredCountries: payload.preferredCountries || [],
    });

    if (autoMatch?.counsellor?._id) {
      payload.assignedCounsellor = autoMatch.counsellor._id;
      payload.assignedTo = autoMatch.counsellor._id;
      payload.primaryAssigneeId = autoMatch.counsellor._id;
    }
  }

  if (payload.assignedCounsellor) {
    const counsellor = await ensureCounsellorInCompany(req.companyId, payload.assignedCounsellor);
    if (!counsellor) {
      return sendError(res, 400, 'Selected assignee does not belong to your company.');
    }
  }

  await hydrateBranchName(req.companyId, payload);
  const validationErrors = getValidationErrors(payload);
  if (validationErrors.length) {
    return sendError(res, 400, validationErrors.join(' '), { validationErrors });
  }

  const duplicateLead = await findDuplicateLead(req.companyId, payload);
  if (duplicateLead) {
    return sendError(res, 409, 'Duplicate lead detected with the same mobile or email.', {
      duplicateLead,
    });
  }

  const lead = new Lead({
    ...payload,
    companyId: req.companyId,
    activeBranchId: payload.activeBranchId || payload.branchId || null,
    createdByUser: req.user?._id,
    ownerUserId: payload.primaryAssigneeId || payload.assignedCounsellor || req.user?._id,
    serviceType: payload.serviceType || 'consultancy',
    entityType: payload.serviceType === 'test_prep' ? 'student' : 'client',
    status: payload.status || payload.pipelineStage || workflowStages[0]?.key || 'new',
    pipelineStage: payload.pipelineStage || payload.status || workflowStages[0]?.key || 'new',
    stage: getStageNumber(
      payload.status || payload.pipelineStage || workflowStages[0]?.key || 'new',
      workflowStages
    ),
    recordType: payload.recordType || 'lead',
    metadata: {
      ...(payload.metadata || {}),
      workflowCountry: workflow?.country || null,
      autoAssignedByCountryMatch: Boolean(autoMatch?.counsellor?._id),
      matchedCountries: autoMatch?.matchedCountries || [],
    },
    sourceType: payload.sourceType || 'manual_entry',
    sourceMeta: payload.sourceMeta || {},
    formId: payload.formId || null,
    primaryAssigneeId: payload.primaryAssigneeId || payload.assignedCounsellor || null,
    assigneeIds: payload.assigneeIds || resolveAssigneeIds(payload),
    assignmentHistory: payload.assignedCounsellor
      ? [
        {
          counsellor: payload.assignedCounsellor,
          assignedAt: new Date(),
          assignedBy: req.user?._id,
          reason: autoMatch?.counsellor?._id
            ? `Auto-assigned by country match (${(autoMatch.matchedCountries || []).join(', ')})`
            : 'Assigned during lead creation',
        },
      ]
      : [],
  });

  const initialNotes =
    Array.isArray(req.body.notes) && req.body.notes.length
      ? req.body.notes
      : req.body.initialNote
        ? [{ content: req.body.initialNote }]
        : [];

  for (const note of initialNotes) {
    if (normalizeString(note?.content)) {
      lead.notes.push({
        content: normalizeString(note.content),
        createdBy: req.user?._id,
      });
    }
  }

  const { score, category } = calculateLeadScore(lead);
  lead.leadScore = score;
  lead.leadCategory = category;

  const autoFollowUp = buildAutoFollowUp(workflow, req.user?._id, req.user?.name);
  if (autoFollowUp) {
    lead.followUps.push(autoFollowUp);
    addLeadActivity(
      lead,
      'followup_scheduled',
      `Initial follow-up auto-scheduled by ${workflow.country} workflow`,
      req.user?._id,
      { scheduledAt: autoFollowUp.scheduledAt, workflowCountry: workflow.country }
    );
  }

  addLeadActivity(
    lead,
    'lead_created',
    `Lead created by ${req.user?.name || 'system'}`,
    req.user?._id,
    {
      pipelineStage: lead.pipelineStage,
      workflowCountry: workflow?.country || null,
      autoAssignedCounsellorId: autoMatch?.counsellor?._id || null,
    }
  );

  const initialFunnelStage = await getStageByIdentifier(req.companyId, lead.pipelineStage || lead.status);
  if (initialFunnelStage?._id) {
    lead.currentFunnelStageId = initialFunnelStage._id;
  }

  await lead.save();
  const assignments = await syncLeadAssignments(lead, {
    actorId: req.user?._id,
    reason: 'Lead created',
  });
  await logActivity(
    req.companyId,
    lead._id,
    'lead_created',
    `Lead ${formatLeadName(lead)} created`,
    req.user?._id,
    { performedByName: req.user?.name }
  );

  await runAutomationEvent({
    companyId: req.companyId,
    branchId: lead.branchId,
    triggerEvent: 'lead.created',
    module: 'leads',
    target: lead,
    actor: req.user,
    context: {
      preferredCountries: lead.preferredCountries || [],
      sourceType: lead.sourceType,
    },
  });

  const createdLead = await populateLead(Lead.findById(lead._id));
  sendSuccess(res, 201, 'Lead created successfully', {
    lead: serializeLeadCollaboration(createdLead),
    assignments,
    workflow,
    workflowStages,
  });
});

exports.getLeadById = asyncHandler(async (req, res) => {
  const lead = await populateLead(Lead.findOne(await getScopedLeadFilter(req, { _id: req.params.id })));
  if (!lead) {
    return sendError(res, 404, 'Lead not found');
  }

  if (syncLeadFollowUps(lead)) {
    await lead.save();
  }

  const { workflow, workflowStages } = await resolveLeadWorkflow(
    req.companyId,
    lead.preferredCountries || []
  );
  let [assignments, transfers] = await fetchLeadCollaboration(req.companyId, lead._id);

  if (!assignments.length && resolveAssigneeIds(lead).length) {
    await syncLeadAssignments(lead, {
      actorId: req.user?._id,
      reason: 'Backfilled from lead record',
    });
    [assignments, transfers] = await fetchLeadCollaboration(req.companyId, lead._id);
  }

  sendSuccess(res, 200, 'Lead fetched', {
    lead: serializeLeadCollaboration(lead),
    assignments,
    transfers,
    workflow,
    workflowStages,
  });
});

exports.updateLead = asyncHandler(async (req, res) => {
  const lead = await Lead.findOne({
    _id: req.params.id,
    companyId: req.companyId,
    deletedAt: null,
  });
  if (!lead) {
    return sendError(res, 404, 'Lead not found');
  }
  if (!canWriteLead(req.user, lead)) {
    return sendError(res, 403, 'You do not have permission to edit this lead.');
  }

  const payload = sanitizeLeadPayload(req.body);
  await hydrateBranchName(req.companyId, payload);
  const { workflow, workflowStages } = await resolveLeadWorkflow(
    req.companyId,
    payload.preferredCountries || lead.preferredCountries || []
  );
  const allowedStageKeys = workflowStages.map((stage) => stage.key);

  if ((payload.status || payload.pipelineStage) && !allowedStageKeys.includes(payload.status || payload.pipelineStage)) {
    return sendError(res, 400, 'Invalid lead pipeline stage for the selected country workflow.');
  }

  if (payload.assignedCounsellor) {
    const counsellor = await ensureCounsellorInCompany(req.companyId, payload.assignedCounsellor);
    if (!counsellor) {
      return sendError(res, 400, 'Selected assignee does not belong to your company.');
    }
  }

  if (
    !payload.assignedCounsellor &&
    !lead.assignedCounsellor &&
    (payload.preferredCountries || lead.preferredCountries)?.length
  ) {
    const autoMatch = await findBestCounsellorMatch({
      companyId: req.companyId,
      branchId: payload.branchId || lead.branchId || req.user?.branchId?._id || req.user?.branchId || null,
      preferredCountries: payload.preferredCountries || lead.preferredCountries || [],
    });

    if (autoMatch?.counsellor?._id) {
      payload.assignedCounsellor = autoMatch.counsellor._id;
      payload.assignedTo = autoMatch.counsellor._id;
      payload.primaryAssigneeId = autoMatch.counsellor._id;
    }
  }

  const validationErrors = getValidationErrors(payload, { isUpdate: true });
  if (validationErrors.length) {
    return sendError(res, 400, validationErrors.join(' '), { validationErrors });
  }

  const duplicateLead = await findDuplicateLead(req.companyId, payload, lead._id);
  if (duplicateLead) {
    return sendError(res, 409, 'Duplicate lead detected with the same mobile or email.', {
      duplicateLead,
    });
  }

  const previousStatus = lead.status;
  const previousCounsellor = String(lead.assignedCounsellor || '');
  const previousPrimaryAssignee = String(lead.primaryAssigneeId || lead.assignedCounsellor || '');

  Object.entries(payload).forEach(([key, value]) => {
    if (typeof value !== 'undefined') {
      lead[key] = value;
    }
  });

  if (payload.primaryAssigneeId || payload.assignedCounsellor) {
    lead.primaryAssigneeId = payload.primaryAssigneeId || payload.assignedCounsellor;
    lead.assignedCounsellor = lead.primaryAssigneeId;
    lead.assignedTo = lead.primaryAssigneeId;
    lead.ownerUserId = lead.primaryAssigneeId;
  }
  if (payload.assigneeIds || lead.assigneeIds?.length || lead.primaryAssigneeId) {
    lead.assigneeIds = resolveAssigneeIds(lead);
  }
  if (payload.activeBranchId || payload.branchId) {
    lead.activeBranchId = payload.activeBranchId || payload.branchId;
  }

  if (payload.status || payload.pipelineStage) {
    lead.status = payload.status || payload.pipelineStage;
    lead.pipelineStage = payload.pipelineStage || payload.status;
    lead.stage = getStageNumber(lead.status, workflowStages);
    const resolvedFunnelStage = await getStageByIdentifier(req.companyId, lead.pipelineStage);
    lead.currentFunnelStageId = resolvedFunnelStage?._id || lead.currentFunnelStageId || null;
  }

  lead.metadata = {
    ...(lead.metadata || {}),
    workflowCountry: workflow?.country || lead.metadata?.workflowCountry || null,
  };

  if (
    (payload.assignedCounsellor || payload.primaryAssigneeId) &&
    String(payload.assignedCounsellor || payload.primaryAssigneeId) !== previousPrimaryAssignee
  ) {
    lead.assignmentHistory.push({
      counsellor: payload.assignedCounsellor || payload.primaryAssigneeId,
      assignedAt: new Date(),
      assignedBy: req.user?._id,
      reason: normalizeString(req.body.assignmentReason) || 'Lead reassigned',
    });
    addLeadActivity(lead, 'assignment_changed', 'Counsellor assignment changed', req.user?._id, {
      from: previousCounsellor,
      to: payload.assignedCounsellor || payload.primaryAssigneeId,
    });
  }

  const { score, category } = calculateLeadScore(lead);
  lead.leadScore = score;
  lead.leadCategory = category;

  if (lead.status !== previousStatus) {
    addLeadActivity(
      lead,
      'status_changed',
      `Status changed from ${previousStatus} to ${lead.status}`,
      req.user?._id,
      { from: previousStatus, to: lead.status }
    );
  } else {
    addLeadActivity(
      lead,
      'lead_updated',
      `Lead updated by ${req.user?.name || 'system'}`,
      req.user?._id
    );
  }

  await lead.save();
  const assignments = await syncLeadAssignments(lead, {
    actorId: req.user?._id,
    reason: normalizeString(req.body.assignmentReason) || 'Lead updated',
  });
  await logActivity(req.companyId, lead._id, 'lead_updated', 'Lead updated', req.user?._id, {
    performedByName: req.user?.name,
    status: lead.status,
  });

  const updatedLead = await populateLead(Lead.findById(lead._id));
  sendSuccess(res, 200, 'Lead updated', {
    lead: serializeLeadCollaboration(updatedLead),
    assignments,
    workflow,
    workflowStages,
  });
});

const buildStudentPayloadFromLead = (lead, user) => {
  const leadSnapshot = lead.toObject ? lead.toObject() : lead;
  return {
    companyId: lead.companyId,
    branchId: lead.branchId,
    branchName: lead.branchName,
    createdByUser: lead.createdByUser || user?._id,
    serviceType: lead.serviceType || 'consultancy',
    entityType: lead.serviceType === 'test_prep' ? 'student' : 'client',
    leadId: lead._id,
    fullName: formatLeadName(lead),
    firstName: lead.firstName,
    lastName: lead.lastName,
    email: lead.email || `lead-${lead._id}@placeholder.invalid`,
    phone: lead.mobile || lead.phone,
    mobile: lead.mobile || lead.phone,
    dateOfBirth: lead.dob,
    gender: lead.gender,
    source: lead.source,
    stream: lead.stream,
    interestedCourse: lead.interestedCourse,
    preferredLocation: lead.preferredLocation,
    guardianName: lead.guardianName,
    guardianContact: lead.guardianContact,
    address: {
      city: lead.address?.city || '',
      country: lead.address?.country || '',
      fullAddress: lead.fullAddress || '',
    },
    educationHistory:
      lead.qualifications?.length > 0
        ? lead.qualifications.map((qualification) => ({
          institution: qualification.institution,
          degree: qualification.degree,
          major: qualification.course,
          percentage: normalizeNumber(qualification.percentageValue),
          passingYear: normalizeNumber(qualification.passedYear),
          level: qualification.level,
          country: qualification.country,
          universityTitle: qualification.universityTitle,
          point: qualification.point,
          percentageValue: qualification.percentageValue,
        }))
        : [
          {
            institution: lead.education?.institution,
            degree: lead.education?.lastDegree,
            percentage: lead.education?.percentage,
            passingYear: lead.education?.passingYear,
          },
        ].filter((item) => Object.values(item).some(Boolean)),
    interestedCountries: lead.preferredCountries || [],
    interestedCourses: lead.interestedCourse ? [lead.interestedCourse] : [],
    assignedCounselor: lead.assignedCounsellor || lead.assignedTo || user?._id,
    status: 'prospect',
    leadSnapshot,
    metadata: {
      ...(lead.metadata || {}),
      convertedFromLead: lead._id,
      convertedAt: new Date(),
    },
  };
};

const convertLeadDocumentToStudent = async (lead, reqUser, { followUp = null } = {}) => {
  if (lead.convertedToStudent && lead.studentId) {
    const student = await Student.findById(lead.studentId);
    return { student, reusedExisting: true };
  }

  const studentData = buildStudentPayloadFromLead(lead, reqUser);
  let student;

  try {
    student = await Student.create(studentData);
  } catch (error) {
    student = await Student.findOne({
      companyId: lead.companyId,
      $or: [
        studentData.email ? { email: studentData.email } : null,
        studentData.phone ? { phone: studentData.phone } : null,
      ].filter(Boolean),
    });

    if (!student) {
      throw error;
    }

    student.leadSnapshot = studentData.leadSnapshot;
    student.metadata = {
      ...(student.metadata || {}),
      ...(studentData.metadata || {}),
    };
    student.assignedCounselor = student.assignedCounselor || studentData.assignedCounselor;
    await student.save();
  }

  lead.convertedToStudent = true;
  lead.studentId = student._id;
  lead.convertedAt = new Date();
  lead.entityType = lead.serviceType === 'test_prep' ? 'student' : 'client';
  lead.recordType = 'student';
  lead.status = 'enrolled';
  lead.pipelineStage = 'enrolled';
  lead.stage = getStageNumber('enrolled');

  if (followUp) {
    followUp.convertedStudentId = student._id;
    followUp.convertedAt = new Date();
  }

  addLeadActivity(
    lead,
    'converted_to_student',
    `Lead converted to ${getEntityLabel(lead).toLowerCase()} (${student.fullName})`,
    reqUser?._id,
    { studentId: student._id }
  );

  return { student, reusedExisting: false };
};

exports.deleteLead = asyncHandler(async (req, res) => {
  const lead = await Lead.findOne({
    _id: req.params.id,
    companyId: req.companyId,
    deletedAt: null,
  });
  if (!lead) {
    return sendError(res, 404, 'Lead not found');
  }
  if (!hasFullLeadAccess(req.user)) {
    return sendError(res, 403, 'Only admins and managers can delete leads.');
  }

  lead.deletedAt = new Date();
  await lead.save();
  await logActivity(req.companyId, lead._id, 'lead_deleted', 'Lead soft-deleted', req.user?._id, {
    performedByName: req.user?.name,
  });

  sendSuccess(res, 200, 'Lead deleted');
});

exports.assignCounsellor = asyncHandler(async (req, res) => {
  if (!hasFullLeadAccess(req.user)) {
    return sendError(res, 403, 'Only admins and managers can assign leads.');
  }

  const { counsellorId, reason } = req.body;
  const counsellor = await ensureCounsellorInCompany(req.companyId, counsellorId);
  if (!counsellor) {
    return sendError(res, 404, 'Counsellor not found in your company');
  }

  const lead = await Lead.findOne({
    _id: req.params.id,
    companyId: req.companyId,
    deletedAt: null,
  });
  if (!lead) {
    return sendError(res, 404, 'Lead not found');
  }
  if (
    lead.ownershipLocked &&
    !hasPermission(req.user, 'leads', 'override') &&
    !hasPermission(req.user, 'leads', 'unlock')
  ) {
    return sendError(res, 403, 'Lead ownership is locked and cannot be reassigned.');
  }

  const previousCounsellor = lead.assignedCounsellor;
  lead.assignedCounsellor = counsellor._id;
  lead.assignedTo = counsellor._id;
  lead.primaryAssigneeId = counsellor._id;
  lead.assigneeIds = resolveAssigneeIds({
    ...lead.toObject(),
    assigneeIds: [...(Array.isArray(lead.assigneeIds) ? lead.assigneeIds : []), counsellor._id],
    primaryAssigneeId: counsellor._id,
  });
  lead.ownerUserId = counsellor._id;
  lead.assignmentHistory.push({
    counsellor: counsellor._id,
    assignedAt: new Date(),
    assignedBy: req.user?._id,
    reason: normalizeString(reason) || 'Manual assignment',
  });

  addLeadActivity(lead, 'assignment_changed', 'Counsellor assignment changed', req.user?._id, {
    from: previousCounsellor,
    to: counsellor._id,
    reason,
  });

  await lead.save();
  const assignments = await syncLeadAssignments(lead, {
    actorId: req.user?._id,
    reason: normalizeString(reason) || 'Manual assignment',
  });
  await logActivity(
    req.companyId,
    lead._id,
    'assignment_changed',
    'Lead assigned to counsellor',
    req.user?._id,
    { performedByName: req.user?.name, counsellorId: counsellor._id }
  );

  const updatedLead = await populateLead(Lead.findById(lead._id));
  sendSuccess(res, 200, 'Counsellor assigned', {
    lead: serializeLeadCollaboration(updatedLead),
    assignments,
  });
});

exports.getAssignments = asyncHandler(async (req, res) => {
  const lead = await Lead.findOne(await getScopedLeadFilter(req, { _id: req.params.id })).select(
    '_id companyId branchId activeBranchId assignedCounsellor assignedTo primaryAssigneeId assigneeIds'
  );
  if (!lead) {
    return sendError(res, 404, 'Lead not found');
  }

  let assignments = await LeadAssignment.find({
    companyId: req.companyId,
    leadId: lead._id,
    active: true,
  })
    .populate('userId', 'name email role primaryRoleKey avatar branchId')
    .populate('assignedBy', 'name email')
    .sort({ isPrimary: -1, assignedAt: 1 })
    .lean();

  if (!assignments.length && resolveAssigneeIds(lead).length) {
    await syncLeadAssignments(lead, { actorId: req.user?._id, reason: 'Backfilled from lead record' });
    assignments = await LeadAssignment.find({
      companyId: req.companyId,
      leadId: lead._id,
      active: true,
    })
      .populate('userId', 'name email role primaryRoleKey avatar branchId')
      .populate('assignedBy', 'name email')
      .sort({ isPrimary: -1, assignedAt: 1 })
      .lean();
  }

  sendSuccess(res, 200, 'Lead assignments fetched', { assignments });
});

exports.saveAssignments = asyncHandler(async (req, res) => {
  const lead = await Lead.findOne({
    _id: req.params.id,
    companyId: req.companyId,
    deletedAt: null,
  });
  if (!lead) {
    return sendError(res, 404, 'Lead not found');
  }
  if (!canWriteLead(req.user, lead) && !hasPermission(req.user, 'leads', 'assign')) {
    return sendError(res, 403, 'You do not have permission to manage lead assignees.');
  }

  const requestedUserIds = normalizeObjectIdArray(
    req.body.userIds || req.body.assigneeIds || req.body.assignees || req.body.userId || []
  );
  const requestedPrimaryAssigneeId =
    normalizeString(req.body.primaryAssigneeId || req.body.counsellorId) || '';
  const nextUserIds = Array.from(
    new Set(
      [...requestedUserIds, requestedPrimaryAssigneeId || '']
        .map((value) => String(value || '').trim())
        .filter(Boolean)
    )
  );

  const users = await ensureUsersInCompany(req.companyId, nextUserIds);
  if (users.length !== nextUserIds.length) {
    return sendError(res, 400, 'One or more assignees do not belong to your company.');
  }

  const nextPrimaryAssigneeId =
    requestedPrimaryAssigneeId || nextUserIds[0] || '';
  const previousPrimaryAssigneeId = String(
    lead.primaryAssigneeId || lead.assignedCounsellor || lead.assignedTo || ''
  );

  lead.assigneeIds = nextUserIds;
  lead.primaryAssigneeId = nextPrimaryAssigneeId || null;
  lead.assignedCounsellor = nextPrimaryAssigneeId || null;
  lead.assignedTo = nextPrimaryAssigneeId || null;
  lead.ownerUserId = nextPrimaryAssigneeId || lead.createdByUser || lead.ownerUserId || null;

  if (nextPrimaryAssigneeId && nextPrimaryAssigneeId !== previousPrimaryAssigneeId) {
    lead.assignmentHistory.push({
      counsellor: nextPrimaryAssigneeId,
      assignedAt: new Date(),
      assignedBy: req.user?._id,
      reason: normalizeString(req.body.reason) || 'Multi-assignee update',
    });
  }

  addLeadActivity(
    lead,
    'assignment_changed',
    'Lead assignees updated',
    req.user?._id,
    {
      previousPrimaryAssigneeId,
      nextPrimaryAssigneeId: nextPrimaryAssigneeId || null,
      assigneeIds: nextUserIds,
    }
  );

  await lead.save();
  const assignments = await syncLeadAssignments(lead, {
    actorId: req.user?._id,
    reason: normalizeString(req.body.reason) || 'Lead assignees updated',
  });
  await logActivity(
    req.companyId,
    lead._id,
    'assignment_changed',
    'Lead assignees updated',
    req.user?._id,
    {
      performedByName: req.user?.name,
      assigneeIds: nextUserIds,
      primaryAssigneeId: nextPrimaryAssigneeId || null,
    }
  );

  const updatedLead = await populateLead(Lead.findById(lead._id));
  sendSuccess(res, 200, 'Lead assignees updated', {
    lead: serializeLeadCollaboration(updatedLead),
    assignments,
  });
});

exports.removeAssignment = asyncHandler(async (req, res) => {
  const lead = await Lead.findOne({
    _id: req.params.id,
    companyId: req.companyId,
    deletedAt: null,
  });
  if (!lead) {
    return sendError(res, 404, 'Lead not found');
  }
  if (!canWriteLead(req.user, lead) && !hasPermission(req.user, 'leads', 'assign')) {
    return sendError(res, 403, 'You do not have permission to manage lead assignees.');
  }

  const removedUserId = String(req.params.assignmentId || '').trim();
  const nextUserIds = resolveAssigneeIds(lead).filter((userId) => userId !== removedUserId);
  const previousPrimaryAssigneeId = String(
    lead.primaryAssigneeId || lead.assignedCounsellor || lead.assignedTo || ''
  );
  const nextPrimaryAssigneeId =
    previousPrimaryAssigneeId === removedUserId ? nextUserIds[0] || '' : previousPrimaryAssigneeId;

  lead.assigneeIds = nextUserIds;
  lead.primaryAssigneeId = nextPrimaryAssigneeId || null;
  lead.assignedCounsellor = nextPrimaryAssigneeId || null;
  lead.assignedTo = nextPrimaryAssigneeId || null;
  lead.ownerUserId = nextPrimaryAssigneeId || lead.createdByUser || lead.ownerUserId || null;

  addLeadActivity(lead, 'assignment_changed', 'Lead assignee removed', req.user?._id, {
    removedUserId,
    nextPrimaryAssigneeId: nextPrimaryAssigneeId || null,
  });

  await lead.save();
  const assignments = await syncLeadAssignments(lead, {
    actorId: req.user?._id,
    reason: 'Lead assignee removed',
  });
  await logActivity(
    req.companyId,
    lead._id,
    'assignment_changed',
    'Lead assignee removed',
    req.user?._id,
    {
      performedByName: req.user?.name,
      removedUserId,
      primaryAssigneeId: nextPrimaryAssigneeId || null,
    }
  );

  const updatedLead = await populateLead(Lead.findById(lead._id));
  sendSuccess(res, 200, 'Lead assignee removed', {
    lead: serializeLeadCollaboration(updatedLead),
    assignments,
  });
});

exports.getTransferHistory = asyncHandler(async (req, res) => {
  const lead = await Lead.findOne(await getScopedLeadFilter(req, { _id: req.params.id })).select('_id');
  if (!lead) {
    return sendError(res, 404, 'Lead not found');
  }

  const transfers = await LeadBranchTransfer.find({
    companyId: req.companyId,
    leadId: lead._id,
  })
    .populate('fromBranchId', 'name code')
    .populate('toBranchId', 'name code')
    .populate('requestedBy', 'name email')
    .populate('approvedBy', 'name email')
    .populate('toAssigneeId', 'name email role primaryRoleKey')
    .sort({ createdAt: -1 })
    .lean();

  sendSuccess(res, 200, 'Lead transfers fetched', { transfers });
});

exports.updateStatus = asyncHandler(async (req, res) => {
  const { status } = req.body;

  const lead = await Lead.findOne({
    _id: req.params.id,
    companyId: req.companyId,
    deletedAt: null,
  });
  if (!lead) {
    return sendError(res, 404, 'Lead not found');
  }
  if (!canWriteLead(req.user, lead)) {
    return sendError(res, 403, 'You do not have permission to update this lead.');
  }

  try {
    const targetStage = await moveLeadToStage({
      companyId: req.companyId,
      lead,
      stageIdentifier: status,
      actor: req.user,
      payload: req.body,
    });
    const { workflow, workflowStages } = await resolveLeadWorkflow(
      req.companyId,
      lead.preferredCountries || []
    );
    const updatedLead = await populateLead(Lead.findById(lead._id));
    sendSuccess(res, 200, 'Funnel stage updated', {
      lead: serializeLeadCollaboration(updatedLead),
      targetStage,
      workflow,
      workflowStages,
    });
  } catch (error) {
    return sendError(res, 400, error.message, error.validationErrors || undefined);
  }
});

exports.scheduleFollowUp = asyncHandler(async (req, res) => {
  const { scheduledAt, type = 'call', notes } = req.body;
  const scheduledDate = normalizeDate(scheduledAt);

  if (!scheduledDate) {
    return sendError(res, 400, 'A valid follow-up date and time is required.');
  }
  if (!FOLLOW_UP_METHODS.includes(type)) {
    return sendError(res, 400, 'Invalid follow-up method supplied.');
  }

  const lead = await Lead.findOne({
    _id: req.params.id,
    companyId: req.companyId,
    deletedAt: null,
  });
  if (!lead) {
    return sendError(res, 404, 'Lead not found');
  }
  if (!canWriteLead(req.user, lead)) {
    return sendError(res, 403, 'You do not have permission to schedule follow-ups for this lead.');
  }

  lead.followUps.push({
    scheduledAt: scheduledDate,
    scheduledBy: req.user?._id,
    type,
    notes: normalizeString(notes) || '',
    status: scheduledDate <= new Date() ? 'overdue' : 'pending',
    counsellorName: req.user?.name,
  });
  syncLeadFollowUps(lead);

  addLeadActivity(
    lead,
    'followup_scheduled',
    `Follow-up scheduled for ${scheduledDate.toLocaleString()} via ${type}`,
    req.user?._id,
    { scheduledAt: scheduledDate, type, notes: normalizeString(notes) || '' }
  );

  const { score, category } = calculateLeadScore(lead);
  lead.leadScore = score;
  lead.leadCategory = category;

  await lead.save();
  const updatedLead = await populateLead(Lead.findById(lead._id));
  sendSuccess(res, 200, 'Follow-up scheduled', { lead: updatedLead });
});

exports.completeFollowUp = asyncHandler(async (req, res) => {
  const { outcomeType, notes, nextFollowUpDate, followUpMethod, followUpTime } = req.body;

  if (!FOLLOW_UP_OUTCOMES.includes(outcomeType)) {
    return sendError(res, 400, 'A valid outcome type is required.');
  }
  if (!normalizeString(notes)) {
    return sendError(res, 400, 'Notes are required before completing a follow-up.');
  }
  if (outcomeType === 'next_followup_needed' && !normalizeDate(nextFollowUpDate)) {
    return sendError(
      res,
      400,
      'Next follow-up date is required when the outcome is Next Follow-up Needed.'
    );
  }
  if (followUpMethod && !FOLLOW_UP_METHODS.includes(followUpMethod)) {
    return sendError(res, 400, 'Invalid follow-up method supplied.');
  }

  const lead = await Lead.findOne({
    _id: req.params.id,
    companyId: req.companyId,
    deletedAt: null,
  });
  if (!lead) {
    return sendError(res, 404, 'Lead not found');
  }
  if (!canWriteLead(req.user, lead)) {
    return sendError(res, 403, 'You do not have permission to complete this follow-up.');
  }

  const { workflowStages } = await resolveLeadWorkflow(req.companyId, lead.preferredCountries || []);

  const followUp = lead.followUps.id(req.params.followUpId);
  if (!followUp) {
    return sendError(res, 404, 'Follow-up not found');
  }
  if (followUp.status === 'completed') {
    return sendError(res, 400, 'This follow-up is already completed.');
  }

  const completionNotes = normalizeString(notes);
  const method = followUpMethod || followUp.type || 'call';
  const nextDate = normalizeDate(nextFollowUpDate);

  followUp.status = 'completed';
  followUp.completedAt = new Date();
  followUp.completedBy = req.user?._id;
  followUp.outcomeType = outcomeType;
  followUp.completionNotes = completionNotes;
  followUp.completionMethod = method;
  followUp.followUpTime = normalizeString(followUpTime) || '';
  followUp.counsellorName = req.user?.name;
  followUp.nextFollowUpDate = nextDate;
  lead.lastContactedAt = new Date();

  lead.notes.push({
    content: `[Follow-up] ${completionNotes}`,
    createdBy: req.user?._id,
  });

  let student = null;

  if (outcomeType === 'next_followup_needed' && nextDate) {
    lead.followUps.push({
      scheduledAt: nextDate,
      scheduledBy: req.user?._id,
      type: method,
      notes: `Auto-created from completed follow-up: ${completionNotes}`,
      status: nextDate <= new Date() ? 'overdue' : 'pending',
      counsellorName: req.user?.name,
    });

    addLeadActivity(
      lead,
      'followup_rescheduled',
      `Next follow-up scheduled for ${nextDate.toLocaleString()}`,
      req.user?._id,
      { followUpId: followUp._id, nextFollowUpDate: nextDate, method }
    );
  }

  if (outcomeType === 'converted_to_student') {
    const conversion = await convertLeadDocumentToStudent(lead, req.user, { followUp });
    student = conversion.student;
  }

  if (outcomeType === 'closed_not_interested') {
    lead.status = 'lost';
    lead.pipelineStage = 'lost';
    lead.stage = getStageNumber('lost');
  } else if (outcomeType !== 'converted_to_student') {
    const currentStageKey = lead.pipelineStage || lead.status || workflowStages[0]?.key || 'new';
    const currentStageIndex = workflowStages.findIndex((stage) => stage.key === currentStageKey);
    const nextWorkflowStage =
      currentStageIndex === 0 ? workflowStages[currentStageIndex + 1]?.key : undefined;
    const fallbackNextStage = currentStageKey === 'new' ? 'contacted' : undefined;
    const nextStageKey = nextWorkflowStage || fallbackNextStage;

    if (nextStageKey) {
      lead.status = nextStageKey;
      lead.pipelineStage = nextStageKey;
      lead.stage = getStageNumber(nextStageKey, workflowStages);
    }
  }

  addLeadActivity(
    lead,
    'followup_completed',
    `Follow-up completed with outcome ${outcomeType.replace(/_/g, ' ')}`,
    req.user?._id,
    {
      followUpId: followUp._id,
      outcomeType,
      method,
      notes: completionNotes,
      nextFollowUpDate: nextDate,
      completedAt: followUp.completedAt,
    }
  );

  syncLeadFollowUps(lead);
  const { score, category } = calculateLeadScore(lead);
  lead.leadScore = score;
  lead.leadCategory = category;

  await lead.save();
  await logActivity(
    req.companyId,
    lead._id,
    'followup_completed',
    'Lead follow-up completed',
    req.user?._id,
    {
      performedByName: req.user?.name,
      followUpId: followUp._id,
      outcomeType,
      nextFollowUpDate: nextDate,
      studentId: student?._id,
    }
  );

  const updatedLead = await populateLead(Lead.findById(lead._id));
  sendSuccess(res, 200, 'Follow-up completed successfully', {
    lead: updatedLead,
    student,
  });
});

exports.addNote = asyncHandler(async (req, res) => {
  const content = normalizeString(req.body.content);
  if (!content) {
    return sendError(res, 400, 'Note content is required.');
  }

  const lead = await Lead.findOne({
    _id: req.params.id,
    companyId: req.companyId,
    deletedAt: null,
  });
  if (!lead) {
    return sendError(res, 404, 'Lead not found');
  }
  if (!canWriteLead(req.user, lead)) {
    return sendError(res, 403, 'You do not have permission to add notes to this lead.');
  }

  lead.notes.push({ content, createdBy: req.user?._id });
  addLeadActivity(lead, 'note_added', 'Note added', req.user?._id, { content });

  const { score, category } = calculateLeadScore(lead);
  lead.leadScore = score;
  lead.leadCategory = category;

  await lead.save();
  const updatedLead = await populateLead(Lead.findById(lead._id));
  sendSuccess(res, 201, 'Note added', { lead: updatedLead });
});

exports.convertToStudent = asyncHandler(async (req, res) => {
  const lead = await Lead.findOne({
    _id: req.params.id,
    companyId: req.companyId,
    deletedAt: null,
  });
  if (!lead) {
    return sendError(res, 404, 'Lead not found');
  }
  if (!canWriteLead(req.user, lead)) {
    return sendError(res, 403, 'You do not have permission to convert this lead.');
  }

  const { student } = await convertLeadDocumentToStudent(lead, req.user);
  await lead.save();
  await logActivity(
    req.companyId,
    lead._id,
    'converted_to_student',
    'Lead converted to student',
    req.user?._id,
    { performedByName: req.user?.name, studentId: student._id }
  );

  const updatedLead = await populateLead(Lead.findById(lead._id));
  sendSuccess(res, 200, 'Lead converted to student', { lead: updatedLead, student });
});

const getFollowUpUrgency = (followUp) => {
  const now = new Date();
  const scheduledAt = new Date(followUp.scheduledAt);
  const startOfDay = new Date(now);
  startOfDay.setHours(0, 0, 0, 0);
  const endOfDay = new Date(now);
  endOfDay.setHours(23, 59, 59, 999);

  if (followUp.status === 'completed') {
    return 'completed';
  }
  if (scheduledAt < now || followUp.status === 'overdue') {
    return 'overdue';
  }
  if (scheduledAt >= startOfDay && scheduledAt <= endOfDay) {
    return 'due_today';
  }
  return 'upcoming';
};

const serializeFollowUp = (lead, followUp) => ({
  _id: followUp._id,
  leadId: lead._id,
  leadName: formatLeadName(lead),
  firstName: lead.firstName,
  lastName: lead.lastName,
  mobile: lead.mobile || lead.phone,
  phone: lead.phone || lead.mobile,
  email: lead.email,
  source: lead.source,
  branchName: lead.branchName || lead.branchId?.name || '',
  stream: lead.stream,
  leadStatus: lead.status,
  pipelineStage: lead.pipelineStage || lead.status,
  assignedCounsellor: lead.assignedCounsellor,
  followUp: {
    ...(followUp?.toObject ? followUp.toObject() : { ...followUp }),
    urgency: getFollowUpUrgency(followUp),
  },
  scheduledAt: followUp.scheduledAt,
  status: followUp.status,
  outcomeType: followUp.outcomeType || '',
  reminderMeta: followUp.reminderMeta || {},
  urgency: getFollowUpUrgency(followUp),
});

const filterFollowUpItems = (items, query) => {
  let nextItems = [...items];

  if (query.status) {
    nextItems = nextItems.filter((item) => item.status === query.status);
  }
  if (query.outcomeType) {
    nextItems = nextItems.filter((item) => item.outcomeType === query.outcomeType);
  }
  if (query.counsellor) {
    nextItems = nextItems.filter(
      (item) => String(item.assignedCounsellor?._id || '') === String(query.counsellor)
    );
  }
  if (query.source) {
    nextItems = nextItems.filter((item) => item.source === query.source);
  }
  if (query.search) {
    const searchTerm = String(query.search).toLowerCase();
    nextItems = nextItems.filter((item) =>
      [
        item.leadName,
        item.email,
        item.phone,
        item.mobile,
        item.assignedCounsellor?.name,
        item.branchName,
      ]
        .filter(Boolean)
        .some((value) => String(value).toLowerCase().includes(searchTerm))
    );
  }
  if (query.fromDate) {
    const fromDate = new Date(query.fromDate);
    nextItems = nextItems.filter((item) => new Date(item.scheduledAt) >= fromDate);
  }
  if (query.toDate) {
    const toDate = new Date(query.toDate);
    nextItems = nextItems.filter((item) => new Date(item.scheduledAt) <= toDate);
  }

  return nextItems;
};

exports.getActivities = asyncHandler(async (req, res) => {
  const lead = await populateLead(
    Lead.findOne(await getScopedLeadFilter(req, { _id: req.params.id })).select('activities')
  );

  if (!lead) {
    return sendError(res, 404, 'Lead not found');
  }

  const activityLogs = await LeadActivityLog.find({
    companyId: req.companyId,
    leadId: req.params.id,
  })
    .populate('createdBy', 'name email')
    .sort({ createdAt: -1 })
    .lean();

  const mergedActivities = [
    ...(lead.activities || []).map((activity) => ({
      ...(activity?.toObject ? activity.toObject() : activity),
      source: 'lead',
      message: activity.description,
      createdBy: activity.performedBy || null,
    })),
    ...activityLogs.map((activity) => ({
      ...activity,
      source: 'activity_log',
      description: activity.message,
      performedBy: activity.createdBy || null,
    })),
  ]
    .filter((activity, index, items) => {
      const key = [
        activity.type,
        activity.message || activity.description,
        new Date(activity.createdAt || 0).toISOString(),
      ].join(':');
      return items.findIndex((candidate) => {
        const candidateKey = [
          candidate.type,
          candidate.message || candidate.description,
          new Date(candidate.createdAt || 0).toISOString(),
        ].join(':');
        return candidateKey === key;
      }) === index;
    })
    .sort((left, right) => new Date(right.createdAt) - new Date(left.createdAt));

  sendSuccess(res, 200, 'Activities fetched', { activities: mergedActivities });
});

exports.getLeadFollowUps = asyncHandler(async (req, res) => {
  const lead = await populateLead(
    Lead.findOne(await getScopedLeadFilter(req, { _id: req.params.id })).select(
      'firstName lastName name email phone mobile branchName status pipelineStage assignedCounsellor followUps nextFollowUp'
    )
  );
  if (!lead) {
    return sendError(res, 404, 'Lead not found');
  }

  if (syncLeadFollowUps(lead)) {
    await lead.save();
  }

  const followUps = [...(lead.followUps || [])]
    .sort((left, right) => new Date(right.scheduledAt) - new Date(left.scheduledAt))
    .map((followUp) => serializeFollowUp(lead, followUp));

  sendSuccess(res, 200, 'Lead follow-up history fetched', { followUps });
});

exports.getPipeline = asyncHandler(async (req, res) => {
  const data = await buildBoardData({
    companyId: req.companyId,
    user: req.user,
    query: req.query,
  });

  sendSuccess(res, 200, 'Funnel board fetched', {
    pipeline: data.board,
    board: data.board,
    stages: data.stages.map((stage) => ({
      key: stage.key,
      label: stage.name,
      order: stage.order,
      color: stage.color,
    })),
    totals: data.totals,
  });
});

exports.getDueFollowUps = asyncHandler(async (req, res) => {
  const horizonDays = Number(req.query.days || 7);
  const horizonDate = new Date();
  horizonDate.setDate(horizonDate.getDate() + horizonDays);
  const scopedFilter = applyBranchQueryFilter(req, await getScopedLeadFilter(req));

  const leads = await populateDashboardFollowUps(
    Lead.find({
      ...scopedFilter,
      followUps: {
        $elemMatch: {
          status: { $in: ['pending', 'overdue'] },
          scheduledAt: { $lte: horizonDate },
        },
      },
    }).select(DASHBOARD_FOLLOW_UP_SELECT)
  );

  const overdue = [];
  const dueToday = [];
  const upcoming = [];
  const pending = [];

  for (const lead of leads) {
    for (const followUp of lead.followUps || []) {
      if (!['pending', 'overdue'].includes(followUp.status)) {
        continue;
      }
      if (new Date(followUp.scheduledAt) > horizonDate) {
        continue;
      }
      const item = serializeFollowUp(lead, followUp);
      pending.push(item);
      if (item.urgency === 'overdue') {
        overdue.push(item);
      } else if (item.urgency === 'due_today') {
        dueToday.push(item);
      } else {
        upcoming.push(item);
      }
    }
  }

  const sortByDate = (left, right) => new Date(left.scheduledAt) - new Date(right.scheduledAt);
  overdue.sort(sortByDate);
  dueToday.sort(sortByDate);
  upcoming.sort(sortByDate);
  pending.sort(sortByDate);

  sendSuccess(res, 200, 'Due follow-ups fetched', {
    overdue,
    dueToday,
    upcoming,
    pending,
  });
});

exports.getFollowUps = asyncHandler(async (req, res) => {
  const { page = 1, limit = 20 } = req.query;
  const scopedFilter = applyBranchQueryFilter(req, await getScopedLeadFilter(req));
  const leads = await populateDashboardFollowUps(
    Lead.find({
      ...scopedFilter,
      followUps: { $exists: true, $ne: [] },
    }).select(DASHBOARD_FOLLOW_UP_SELECT)
  );

  const items = [];
  for (const lead of leads) {
    for (const followUp of lead.followUps || []) {
      items.push(serializeFollowUp(lead, followUp));
    }
  }

  const filteredItems = filterFollowUpItems(items, req.query).sort(
    (left, right) => new Date(left.scheduledAt) - new Date(right.scheduledAt)
  );
  const start = (Number(page) - 1) * Number(limit);
  const paginatedItems = filteredItems.slice(start, start + Number(limit));

  sendSuccess(res, 200, 'Follow-ups fetched', {
    followUps: paginatedItems,
    pagination: {
      total: filteredItems.length,
      page: Number(page),
      limit: Number(limit),
      pages: Math.ceil(filteredItems.length / Number(limit)) || 1,
    },
  });
});

exports.getFollowUpDashboardSummary = asyncHandler(async (req, res) => {
  const now = new Date();
  const startOfDay = new Date(now);
  startOfDay.setHours(0, 0, 0, 0);
  const endOfDay = new Date(now);
  endOfDay.setHours(23, 59, 59, 999);
  const contactThreshold = new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000);

  const scopedFilter = applyBranchQueryFilter(req, await getScopedLeadFilter(req));
  const leads = await populateDashboardFollowUps(
    Lead.find(scopedFilter).select(DASHBOARD_FOLLOW_UP_SELECT)
  );

  const activeLeadStatuses = new Set(
    [
      ...PIPELINE_STATUSES,
      ...leads.map((lead) => lead.pipelineStage || lead.status).filter(Boolean),
    ].filter((status) => !['enrolled', 'lost'].includes(status))
  );
  const allFollowUps = [];
  const byCounsellor = {};
  const leadsWithoutFutureFollowUp = [];
  const leadsOverdueForContact = [];

  for (const lead of leads) {
    const leadItems = [];

    for (const followUp of lead.followUps || []) {
      const serialized = serializeFollowUp(lead, followUp);
      allFollowUps.push(serialized);
      leadItems.push(serialized);

      const counsellorKey = String(lead.assignedCounsellor?._id || 'unassigned');
      if (!byCounsellor[counsellorKey]) {
        byCounsellor[counsellorKey] = {
          counsellorId: lead.assignedCounsellor?._id || null,
          counsellorName: lead.assignedCounsellor?.name || 'Unassigned',
          pending: 0,
          overdue: 0,
          dueToday: 0,
          completedToday: 0,
        };
      }

      if (serialized.status === 'completed' && serialized.followUp.completedAt) {
        const completedAt = new Date(serialized.followUp.completedAt);
        if (completedAt >= startOfDay && completedAt <= endOfDay) {
          byCounsellor[counsellorKey].completedToday += 1;
        }
      } else if (serialized.status === 'overdue') {
        byCounsellor[counsellorKey].pending += 1;
        byCounsellor[counsellorKey].overdue += 1;
      } else if (serialized.urgency === 'due_today') {
        byCounsellor[counsellorKey].pending += 1;
        byCounsellor[counsellorKey].dueToday += 1;
      } else if (serialized.status === 'pending') {
        byCounsellor[counsellorKey].pending += 1;
      }
    }

    const futureFollowUp = leadItems.find(
      (item) => ['pending', 'overdue'].includes(item.status) && new Date(item.scheduledAt) > now
    );
    if (activeLeadStatuses.has(lead.status) && !lead.convertedToStudent && !futureFollowUp) {
      leadsWithoutFutureFollowUp.push({
        _id: lead._id,
        leadName: formatLeadName(lead),
        phone: lead.mobile || lead.phone,
        email: lead.email,
        pipelineStage: lead.pipelineStage || lead.status,
        assignedCounsellor: lead.assignedCounsellor,
        nextFollowUp: lead.nextFollowUp,
      });
    }

    if (
      activeLeadStatuses.has(lead.status) &&
      !lead.convertedToStudent &&
      (!lead.lastContactedAt || new Date(lead.lastContactedAt) < contactThreshold)
    ) {
      leadsOverdueForContact.push({
        _id: lead._id,
        leadName: formatLeadName(lead),
        phone: lead.mobile || lead.phone,
        email: lead.email,
        pipelineStage: lead.pipelineStage || lead.status,
        assignedCounsellor: lead.assignedCounsellor,
        lastContactedAt: lead.lastContactedAt,
        nextFollowUp: lead.nextFollowUp,
      });
    }
  }

  const pendingFollowUps = allFollowUps.filter((item) => ['pending', 'overdue'].includes(item.status));
  const overdueFollowUps = pendingFollowUps.filter((item) => item.urgency === 'overdue');
  const todayFollowUps = pendingFollowUps.filter((item) => item.urgency === 'due_today');
  const upcomingFollowUps = pendingFollowUps.filter((item) => item.urgency === 'upcoming');
  const completedToday = allFollowUps.filter((item) => {
    if (item.status !== 'completed' || !item.followUp.completedAt) {
      return false;
    }
    const completedAt = new Date(item.followUp.completedAt);
    return completedAt >= startOfDay && completedAt <= endOfDay;
  });

  const completionBase = completedToday.length + todayFollowUps.length + overdueFollowUps.length;
  const completionRate = completionBase ? Math.round((completedToday.length / completionBase) * 100) : 0;

  res.set('Cache-Control', 'private, max-age=15, stale-while-revalidate=30');
  sendSuccess(res, 200, 'Follow-up dashboard summary fetched', {
    role: req.user.role,
    counts: {
      pending: pendingFollowUps.length,
      overdue: overdueFollowUps.length,
      dueToday: todayFollowUps.length,
      upcoming: upcomingFollowUps.length,
      completedToday: completedToday.length,
      leadsWithoutFutureFollowUp: leadsWithoutFutureFollowUp.length,
      leadsOverdueForContact: leadsOverdueForContact.length,
    },
    completionRate,
    pendingFollowUps: pendingFollowUps.slice(0, 20),
    overdueFollowUps: overdueFollowUps.slice(0, 20),
    todayFollowUps: todayFollowUps.slice(0, 20),
    upcomingFollowUps: upcomingFollowUps.slice(0, 20),
    completedToday: completedToday.slice(0, 20),
    byCounsellor: Object.values(byCounsellor).sort((left, right) =>
      left.counsellorName.localeCompare(right.counsellorName)
    ),
    leadsWithoutFutureFollowUp: leadsWithoutFutureFollowUp.slice(0, 20),
    leadsOverdueForContact: leadsOverdueForContact.slice(0, 20),
  });
});

exports.triggerReminderSweep = asyncHandler(async (req, res) => {
  if (!hasPermission(req.user, 'followups', 'manage') && !hasFullLeadAccess(req.user)) {
    return sendError(res, 403, 'Only admins and managers can trigger reminder sweeps.');
  }

  const stats = await runReminderSweep();
  sendSuccess(res, 200, 'Follow-up reminder sweep completed', { stats });
});

exports.recalculateScore = asyncHandler(async (req, res) => {
  const lead = await Lead.findOne({
    _id: req.params.id,
    companyId: req.companyId,
    deletedAt: null,
  });
  if (!lead) {
    return sendError(res, 404, 'Lead not found');
  }
  if (!canWriteLead(req.user, lead)) {
    return sendError(res, 403, 'You do not have permission to recalculate this lead score.');
  }

  const { score, category, breakdown } = calculateLeadScore(lead);
  lead.leadScore = score;
  lead.leadCategory = category;
  addLeadActivity(
    lead,
    'score_updated',
    `Lead score recalculated: ${score} (${category})`,
    req.user?._id
  );
  await lead.save();

  sendSuccess(res, 200, 'Score recalculated', { score, category, breakdown });
});

exports.lockOwnership = asyncHandler(async (req, res) => {
  const { reason } = req.body;
  if (!normalizeString(reason)) {
    return sendError(res, 400, 'A lock reason is required.');
  }

  const lead = await Lead.findOne({
    _id: req.params.id,
    companyId: req.companyId,
    deletedAt: null,
  });
  if (!lead) {
    return sendError(res, 404, 'Lead not found');
  }
  if (!hasPermission(req.user, 'leads', 'lock') && !hasPermission(req.user, 'leads', 'override')) {
    return sendError(res, 403, 'You do not have permission to lock ownership.');
  }

  lead.ownershipLocked = true;
  lead.ownershipLockedBy = req.user?._id;
  lead.ownershipLockedAt = new Date();
  lead.ownershipLockReason = normalizeString(reason);

  addLeadActivity(lead, 'ownership_locked', 'Lead ownership locked', req.user?._id, {
    reason: lead.ownershipLockReason,
  });

  await lead.save();
  sendSuccess(res, 200, 'Lead ownership locked successfully', { lead });
});

exports.unlockOwnership = asyncHandler(async (req, res) => {
  const lead = await Lead.findOne({
    _id: req.params.id,
    companyId: req.companyId,
    deletedAt: null,
  });
  if (!lead) {
    return sendError(res, 404, 'Lead not found');
  }
  if (!hasPermission(req.user, 'leads', 'unlock') && !hasPermission(req.user, 'leads', 'override')) {
    return sendError(res, 403, 'You do not have permission to unlock ownership.');
  }

  lead.ownershipLocked = false;
  lead.ownershipLockedBy = null;
  lead.ownershipLockedAt = null;
  lead.ownershipLockReason = '';

  addLeadActivity(lead, 'ownership_unlocked', 'Lead ownership unlocked', req.user?._id);

  await lead.save();
  sendSuccess(res, 200, 'Lead ownership unlocked successfully', { lead });
});
