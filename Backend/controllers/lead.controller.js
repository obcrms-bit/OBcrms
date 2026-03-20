const mongoose = require('mongoose');
const Lead = require('../models/Lead');
const Student = require('../models/Student');
const Activity = require('../models/Activity');
const Branch = require('../models/Branch');
const User = require('../models/User');
const { sendSuccess, sendError } = require('../utils/responseHandler');
const { calculateLeadScore } = require('../utils/leadScoring');
const { runReminderSweep } = require('../services/followUpReminder.service');

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

const SELF_SCOPED_ROLES = ['counselor', 'sales'];
const FULL_ACCESS_ROLES = ['super_admin', 'admin', 'manager', 'accountant'];

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

const shouldScopeToAssigned = (user) => SELF_SCOPED_ROLES.includes(user?.role);
const hasFullLeadAccess = (user) => FULL_ACCESS_ROLES.includes(user?.role);

const getStageNumber = (status) => {
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
  const assignedCounsellor =
    normalizeString(rawPayload.assignedCounsellor || rawPayload.assignedTo || rawPayload.assignee) ||
    undefined;

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
    campaign: normalizeString(rawPayload.campaign) || undefined,
    branchId: normalizeString(rawPayload.branchId) || undefined,
    branchName: normalizeString(rawPayload.branchName) || undefined,
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
  if (payload.status && !PIPELINE_STATUSES.includes(payload.status)) {
    errors.push('Invalid lead pipeline stage.');
  }

  return errors;
};

const getScopedLeadFilter = (req, extra = {}) => {
  const filter = { companyId: req.companyId, deletedAt: null, ...extra };
  if (shouldScopeToAssigned(req.user)) {
    filter.assignedCounsellor = req.user._id;
  }
  return filter;
};

const canWriteLead = (user, lead) => {
  if (hasFullLeadAccess(user)) {
    return true;
  }
  return String(lead.assignedCounsellor || lead.assignedTo || '') === String(user?._id || '');
};

const populateLead = (query) =>
  query
    .populate('assignedCounsellor', 'name email phone role')
    .populate('studentId', 'fullName email phone status')
    .populate('branchId', 'name location')
    .populate('activities.performedBy', 'name email')
    .populate('assignmentHistory.counsellor', 'name email')
    .populate('assignmentHistory.assignedBy', 'name email')
    .populate('notes.createdBy', 'name email')
    .populate('followUps.scheduledBy', 'name email')
    .populate('followUps.completedBy', 'name email')
    .populate('followUps.convertedStudentId', 'fullName email phone');

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
  } catch (error) {
    console.error('Activity log error:', error.message);
  }
};

const addLeadActivity = (lead, type, description, performedBy, metadata = {}) => {
  lead.activities = lead.activities || [];
  lead.activities.push({ type, description, performedBy, metadata });
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
    role: { $in: ['counselor', 'manager', 'sales', 'admin', 'super_admin'] },
  }).select('name email role');
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
    sortBy = 'createdAt',
    sortOrder = 'desc',
    category,
    fromDate,
    toDate,
    course,
    recordType,
  } = req.query;

  const filter = getScopedLeadFilter(req);
  if (status) filter.status = status;
  if (source) filter.source = source;
  if (counsellor && hasFullLeadAccess(req.user)) filter.assignedCounsellor = counsellor;
  if (category) filter.leadCategory = category;
  if (recordType) filter.recordType = recordType;
  if (course) filter.interestedCourse = { $regex: course, $options: 'i' };
  if (branch) {
    filter.$or = [
      mongoose.Types.ObjectId.isValid(branch) ? { branchId: branch } : null,
      { branchName: { $regex: branch, $options: 'i' } },
    ].filter(Boolean);
  }
  if (fromDate || toDate) {
    filter.createdAt = {};
    if (fromDate) filter.createdAt.$gte = new Date(fromDate);
    if (toDate) filter.createdAt.$lte = new Date(toDate);
  }
  if (search) {
    filter.$or = [
      { firstName: { $regex: search, $options: 'i' } },
      { lastName: { $regex: search, $options: 'i' } },
      { name: { $regex: search, $options: 'i' } },
      { email: { $regex: search, $options: 'i' } },
      { phone: { $regex: search, $options: 'i' } },
      { mobile: { $regex: search, $options: 'i' } },
      { interestedCourse: { $regex: search, $options: 'i' } },
      { branchName: { $regex: search, $options: 'i' } },
    ];
  }

  const skip = (Number(page) - 1) * Number(limit);
  const sort = { [sortBy]: sortOrder === 'asc' ? 1 : -1 };
  const [leads, total] = await Promise.all([
    populateLead(Lead.find(filter).sort(sort).skip(skip).limit(Number(limit))).lean(),
    Lead.countDocuments(filter),
  ]);

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

exports.createLead = asyncHandler(async (req, res) => {
  const payload = sanitizeLeadPayload(req.body);

  if (!payload.assignedCounsellor && shouldScopeToAssigned(req.user)) {
    payload.assignedCounsellor = req.user._id;
    payload.assignedTo = req.user._id;
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
    status: payload.status || payload.pipelineStage || 'new',
    pipelineStage: payload.pipelineStage || payload.status || 'new',
    stage: getStageNumber(payload.status || payload.pipelineStage || 'new'),
    recordType: payload.recordType || 'lead',
    assignmentHistory: payload.assignedCounsellor
      ? [
          {
            counsellor: payload.assignedCounsellor,
            assignedAt: new Date(),
            assignedBy: req.user?._id,
            reason: 'Assigned during lead creation',
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
  addLeadActivity(
    lead,
    'lead_created',
    `Lead created by ${req.user?.name || 'system'}`,
    req.user?._id,
    { pipelineStage: lead.pipelineStage }
  );

  await lead.save();
  await logActivity(
    req.companyId,
    lead._id,
    'lead_created',
    `Lead ${formatLeadName(lead)} created`,
    req.user?._id,
    { performedByName: req.user?.name }
  );

  const createdLead = await populateLead(Lead.findById(lead._id));
  sendSuccess(res, 201, 'Lead created successfully', { lead: createdLead });
});

exports.getLeadById = asyncHandler(async (req, res) => {
  const lead = await populateLead(Lead.findOne(getScopedLeadFilter(req, { _id: req.params.id })));
  if (!lead) {
    return sendError(res, 404, 'Lead not found');
  }

  if (syncLeadFollowUps(lead)) {
    await lead.save();
  }

  sendSuccess(res, 200, 'Lead fetched', { lead });
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

  if (payload.assignedCounsellor) {
    const counsellor = await ensureCounsellorInCompany(req.companyId, payload.assignedCounsellor);
    if (!counsellor) {
      return sendError(res, 400, 'Selected assignee does not belong to your company.');
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

  Object.entries(payload).forEach(([key, value]) => {
    if (typeof value !== 'undefined') {
      lead[key] = value;
    }
  });

  if (payload.status || payload.pipelineStage) {
    lead.status = payload.status || payload.pipelineStage;
    lead.pipelineStage = payload.pipelineStage || payload.status;
    lead.stage = getStageNumber(lead.status);
  }

  if (payload.assignedCounsellor && String(payload.assignedCounsellor) !== previousCounsellor) {
    lead.assignmentHistory.push({
      counsellor: payload.assignedCounsellor,
      assignedAt: new Date(),
      assignedBy: req.user?._id,
      reason: normalizeString(req.body.assignmentReason) || 'Lead reassigned',
    });
    addLeadActivity(lead, 'assignment_changed', 'Counsellor assignment changed', req.user?._id, {
      from: previousCounsellor,
      to: payload.assignedCounsellor,
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
  await logActivity(req.companyId, lead._id, 'lead_updated', 'Lead updated', req.user?._id, {
    performedByName: req.user?.name,
    status: lead.status,
  });

  const updatedLead = await populateLead(Lead.findById(lead._id));
  sendSuccess(res, 200, 'Lead updated', { lead: updatedLead });
});

const buildStudentPayloadFromLead = (lead, user) => {
  const leadSnapshot = lead.toObject ? lead.toObject() : lead;
  return {
    companyId: lead.companyId,
    branchId: lead.branchId,
    branchName: lead.branchName,
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
    `Lead converted to student (${student.fullName})`,
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

  const previousCounsellor = lead.assignedCounsellor;
  lead.assignedCounsellor = counsellor._id;
  lead.assignedTo = counsellor._id;
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
  await logActivity(
    req.companyId,
    lead._id,
    'assignment_changed',
    'Lead assigned to counsellor',
    req.user?._id,
    { performedByName: req.user?.name, counsellorId: counsellor._id }
  );

  const updatedLead = await populateLead(Lead.findById(lead._id));
  sendSuccess(res, 200, 'Counsellor assigned', { lead: updatedLead });
});

exports.updateStatus = asyncHandler(async (req, res) => {
  const { status } = req.body;
  if (!PIPELINE_STATUSES.includes(status)) {
    return sendError(res, 400, 'Invalid lead status supplied.');
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
    return sendError(res, 403, 'You do not have permission to update this lead.');
  }

  const previousStatus = lead.status;
  lead.status = status;
  lead.pipelineStage = status;
  lead.stage = getStageNumber(status);

  addLeadActivity(
    lead,
    'status_changed',
    `Status updated from ${previousStatus} to ${status}`,
    req.user?._id,
    { from: previousStatus, to: status }
  );

  await lead.save();
  const updatedLead = await populateLead(Lead.findById(lead._id));
  sendSuccess(res, 200, 'Status updated', { lead: updatedLead });
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
  } else if (outcomeType !== 'converted_to_student' && lead.status === 'new') {
    lead.status = 'contacted';
    lead.pipelineStage = 'contacted';
    lead.stage = getStageNumber('contacted');
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
    ...followUp.toObject(),
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
    Lead.findOne(getScopedLeadFilter(req, { _id: req.params.id })).select('activities')
  );

  if (!lead) {
    return sendError(res, 404, 'Lead not found');
  }

  sendSuccess(res, 200, 'Activities fetched', { activities: lead.activities || [] });
});

exports.getLeadFollowUps = asyncHandler(async (req, res) => {
  const lead = await populateLead(
    Lead.findOne(getScopedLeadFilter(req, { _id: req.params.id })).select(
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
  const stages = [...PIPELINE_STATUSES];
  const leads = await populateLead(
    Lead.find(getScopedLeadFilter(req)).select(
      'firstName lastName name email phone mobile status pipelineStage leadScore leadCategory source preferredCountries interestedCourse assignedCounsellor nextFollowUp updatedAt createdAt'
    )
  ).lean();

  const result = {};
  stages.forEach((stage) => {
    const stageLeads = leads.filter((lead) => (lead.pipelineStage || lead.status) === stage);
    result[stage] = {
      stage,
      count: stageLeads.length,
      leads: stageLeads.slice(0, 100),
    };
  });

  sendSuccess(res, 200, 'Pipeline fetched', { pipeline: result, stages });
});

exports.getDueFollowUps = asyncHandler(async (req, res) => {
  const horizonDays = Number(req.query.days || 7);
  const horizonDate = new Date();
  horizonDate.setDate(horizonDate.getDate() + horizonDays);

  const leads = await populateLead(
    Lead.find({
      ...getScopedLeadFilter(req),
      followUps: {
        $elemMatch: {
          status: { $in: ['pending', 'overdue'] },
          scheduledAt: { $lte: horizonDate },
        },
      },
    }).select(
      'firstName lastName name email phone mobile source branchName stream status pipelineStage assignedCounsellor followUps nextFollowUp'
    )
  );

  const overdue = [];
  const dueToday = [];
  const upcoming = [];
  const pending = [];

  for (const lead of leads) {
    const changed = syncLeadFollowUps(lead);
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
    if (changed) {
      await lead.save();
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
  const leads = await populateLead(
    Lead.find({
      ...getScopedLeadFilter(req),
      followUps: { $exists: true, $ne: [] },
    }).select(
      'firstName lastName name email phone mobile source branchName stream status pipelineStage assignedCounsellor followUps nextFollowUp'
    )
  );

  const items = [];
  for (const lead of leads) {
    const changed = syncLeadFollowUps(lead);
    for (const followUp of lead.followUps || []) {
      items.push(serializeFollowUp(lead, followUp));
    }
    if (changed) {
      await lead.save();
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

  const leads = await populateLead(
    Lead.find(getScopedLeadFilter(req)).select(
      'firstName lastName name email phone mobile source branchName stream status pipelineStage assignedCounsellor followUps nextFollowUp lastContactedAt convertedToStudent'
    )
  );

  const activeLeadStatuses = new Set(
    PIPELINE_STATUSES.filter((status) => !['enrolled', 'lost'].includes(status))
  );
  const allFollowUps = [];
  const byCounsellor = {};
  const leadsWithoutFutureFollowUp = [];
  const leadsOverdueForContact = [];

  for (const lead of leads) {
    const changed = syncLeadFollowUps(lead);
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

    if (changed) {
      await lead.save();
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
  if (!hasFullLeadAccess(req.user)) {
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
