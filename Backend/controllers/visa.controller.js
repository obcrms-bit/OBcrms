const VisaApplication = require('../models/VisaApplication');
const VisaRule = require('../models/VisaRule');
const Activity = require('../models/Activity');
const { sendSuccess, sendError } = require('../utils/responseHandler');
const { generateVisaWorkflow } = require('../utils/visaWorkflowGenerator');
const { assessVisaRisk } = require('../utils/visaRiskAssessment');

const asyncHandler = (fn) => (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next);

const logActivity = async (companyId, entityId, action, description, userId, meta = {}) => {
  try {
    await Activity.create({
      companyId,
      module: 'visa',
      entityType: 'visa_application',
      entityId,
      action,
      description,
      performedBy: userId,
      metadata: meta,
    });
  } catch (e) {
    console.error('Activity log error:', e.message);
  }
};

const addTimeline = (visa, action, description, userId, meta = {}) => {
  visa.timeline.push({
    stage: visa.currentStage,
    action,
    description,
    performedBy: userId,
    metadata: meta,
  });
};

// ─── Visa Rules ───────────────────────────────────────────────────────────────

exports.getVisaRules = asyncHandler(async (req, res) => {
  const { countryCode, active } = req.query;
  const filter = {};
  if (countryCode) filter.countryCode = countryCode.toUpperCase();
  if (active !== undefined) filter.isActive = active === 'true';

  const rules = await VisaRule.find(filter).sort({ country: 1 }).lean();
  sendSuccess(res, 200, 'Visa rules fetched', { rules });
});

exports.createVisaRule = asyncHandler(async (req, res) => {
  const rule = await VisaRule.create(req.body);
  sendSuccess(res, 201, 'Visa rule created', { rule });
});

exports.getVisaRuleById = asyncHandler(async (req, res) => {
  const rule = await VisaRule.findById(req.params.id);
  if (!rule) return sendError(res, 404, 'Visa rule not found');
  sendSuccess(res, 200, 'Visa rule fetched', { rule });
});

exports.updateVisaRule = asyncHandler(async (req, res) => {
  const rule = await VisaRule.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
    runValidators: true,
  });
  if (!rule) return sendError(res, 404, 'Visa rule not found');
  sendSuccess(res, 200, 'Visa rule updated', { rule });
});

exports.deleteVisaRule = asyncHandler(async (req, res) => {
  const rule = await VisaRule.findByIdAndDelete(req.params.id);
  if (!rule) return sendError(res, 404, 'Visa rule not found');
  sendSuccess(res, 200, 'Visa rule deleted');
});

exports.getVisaRuleByCountry = asyncHandler(async (req, res) => {
  const rule = await VisaRule.findOne({
    countryCode: req.params.countryCode.toUpperCase(),
    isActive: true,
  });
  if (!rule)
    return sendError(res, 404, `No active visa rule for country ${req.params.countryCode}`);
  sendSuccess(res, 200, 'Visa rule fetched', { rule });
});

// ─── Visa Applications ────────────────────────────────────────────────────────

exports.getVisaApplications = asyncHandler(async (req, res) => {
  const companyId = req.companyId;
  const {
    page = 1,
    limit = 20,
    currentStage,
    destinationCountryCode,
    status,
    counsellor,
    search,
  } = req.query;

  const filter = { companyId };
  if (currentStage) filter.currentStage = currentStage;
  if (destinationCountryCode) filter.destinationCountryCode = destinationCountryCode.toUpperCase();
  if (status) filter.status = status;
  if (counsellor) filter.counsellor = counsellor;
  if (search) {
    filter.$or = [
      { destinationCountry: { $regex: search, $options: 'i' } },
      { visaId: { $regex: search, $options: 'i' } },
      { 'applicantSnapshot.firstName': { $regex: search, $options: 'i' } },
      { universityName: { $regex: search, $options: 'i' } },
    ];
  }

  const skip = (parseInt(page) - 1) * parseInt(limit);
  const [applications, total] = await Promise.all([
    VisaApplication.find(filter)
      .select('-generatedChecklist -timeline -notes')
      .populate('counsellor', 'name email')
      .populate('lead', 'firstName lastName email phone')
      .populate('student', 'name email')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit))
      .lean(),
    VisaApplication.countDocuments(filter),
  ]);

  sendSuccess(res, 200, 'Visa applications fetched', {
    applications,
    pagination: {
      total,
      page: parseInt(page),
      limit: parseInt(limit),
      pages: Math.ceil(total / parseInt(limit)),
    },
  });
});

exports.createVisaApplication = asyncHandler(async (req, res) => {
  const data = { ...req.body, companyId: req.companyId };
  if (!data.counsellor) data.counsellor = req.user?._id;

  const visa = await VisaApplication.create(data);
  addTimeline(visa, 'created', 'Visa application created', req.user?._id);
  await visa.save();
  await logActivity(
    req.companyId,
    visa._id,
    'created',
    `Visa application ${visa.visaId} created`,
    req.user?._id
  );

  sendSuccess(res, 201, 'Visa application created', { visa });
});

exports.getVisaApplicationById = asyncHandler(async (req, res) => {
  const visa = await VisaApplication.findOne({ _id: req.params.id, companyId: req.companyId })
    .populate('counsellor', 'name email')
    .populate('lead', 'firstName lastName email phone')
    .populate('student', 'name email phone')
    .populate('timeline.performedBy', 'name');

  if (!visa) return sendError(res, 404, 'Visa application not found');
  sendSuccess(res, 200, 'Visa application fetched', { visa });
});

exports.updateVisaApplication = asyncHandler(async (req, res) => {
  const visa = await VisaApplication.findOne({ _id: req.params.id, companyId: req.companyId });
  if (!visa) return sendError(res, 404, 'Visa application not found');

  Object.assign(visa, req.body);
  addTimeline(visa, 'updated', 'Visa application updated', req.user?._id);
  await visa.save();

  sendSuccess(res, 200, 'Visa application updated', { visa });
});

exports.deleteVisaApplication = asyncHandler(async (req, res) => {
  const visa = await VisaApplication.findOneAndDelete({
    _id: req.params.id,
    companyId: req.companyId,
  });
  if (!visa) return sendError(res, 404, 'Visa application not found');
  sendSuccess(res, 200, 'Visa application deleted');
});

// ─── Workflow Actions ─────────────────────────────────────────────────────────

exports.generateWorkflow = asyncHandler(async (req, res) => {
  const visa = await VisaApplication.findOne({ _id: req.params.id, companyId: req.companyId });
  if (!visa) return sendError(res, 404, 'Visa application not found');

  const countryCode = visa.destinationCountryCode?.toUpperCase();
  const rule = await VisaRule.findOne({ countryCode, isActive: true });
  if (!rule) return sendError(res, 404, `No visa rule found for country ${countryCode}`);

  const workflowData = generateVisaWorkflow(visa, rule);
  Object.assign(visa, workflowData);

  addTimeline(
    visa,
    'workflow_generated',
    `Workflow generated for ${visa.destinationCountry}`,
    req.user?._id,
    { countryCode }
  );
  await visa.save();
  await logActivity(
    req.companyId,
    visa._id,
    'workflow_generated',
    'Workflow generated',
    req.user?._id
  );

  sendSuccess(res, 200, 'Workflow generated', { visa });
});

exports.updateStage = asyncHandler(async (req, res) => {
  const { stage, notes } = req.body;
  const visa = await VisaApplication.findOne({ _id: req.params.id, companyId: req.companyId });
  if (!visa) return sendError(res, 404, 'Visa application not found');

  const prevStage = visa.currentStage;
  visa.currentStage = stage;
  if (notes) visa.notes.push({ content: notes, createdBy: req.user?._id });

  addTimeline(visa, 'stage_updated', `Stage changed from ${prevStage} to ${stage}`, req.user?._id, {
    from: prevStage,
    to: stage,
  });
  await visa.save();
  await logActivity(
    req.companyId,
    visa._id,
    'stage_updated',
    `Stage updated to ${stage}`,
    req.user?._id
  );

  sendSuccess(res, 200, 'Stage updated', { visa });
});

exports.submitApplication = asyncHandler(async (req, res) => {
  const visa = await VisaApplication.findOne({ _id: req.params.id, companyId: req.companyId });
  if (!visa) return sendError(res, 404, 'Visa application not found');

  visa.currentStage = 'submitted';
  addTimeline(visa, 'submitted', 'Visa application submitted to embassy', req.user?._id);
  await visa.save();

  sendSuccess(res, 200, 'Application submitted', { visa });
});

exports.requestAdditionalDocs = asyncHandler(async (req, res) => {
  const { items, deadline, notes } = req.body;
  const visa = await VisaApplication.findOne({ _id: req.params.id, companyId: req.companyId });
  if (!visa) return sendError(res, 404, 'Visa application not found');

  visa.currentStage = 'additional_docs_requested';
  visa.additionalDocsRequest = {
    requestedAt: new Date(),
    deadline: deadline ? new Date(deadline) : null,
    items,
    notes,
  };
  addTimeline(
    visa,
    'additional_docs_requested',
    'Embassy requested additional documents',
    req.user?._id,
    { items }
  );
  await visa.save();

  sendSuccess(res, 200, 'Additional docs request recorded', { visa });
});

exports.approveVisa = asyncHandler(async (req, res) => {
  const { validFrom, validTo, notes } = req.body;
  const visa = await VisaApplication.findOne({ _id: req.params.id, companyId: req.companyId });
  if (!visa) return sendError(res, 404, 'Visa application not found');

  visa.currentStage = 'approved';
  visa.status = 'completed';
  visa.decision = {
    decision: 'approved',
    decisionDate: new Date(),
    visaValidFrom: validFrom ? new Date(validFrom) : null,
    visaValidTo: validTo ? new Date(validTo) : null,
    recordedBy: req.user?._id,
    recordedAt: new Date(),
  };

  addTimeline(visa, 'approved', 'Visa approved! 🎉', req.user?._id, { validFrom, validTo });
  await visa.save();
  await logActivity(
    req.companyId,
    visa._id,
    'approved',
    'Visa application approved',
    req.user?._id
  );

  sendSuccess(res, 200, 'Visa approved', { visa });
});

exports.rejectVisa = asyncHandler(async (req, res) => {
  const { rejectionReason, rejectionCategory, appealDeadline } = req.body;
  const visa = await VisaApplication.findOne({ _id: req.params.id, companyId: req.companyId });
  if (!visa) return sendError(res, 404, 'Visa application not found');

  visa.currentStage = 'rejected';
  visa.decision = {
    decision: 'rejected',
    decisionDate: new Date(),
    rejectionReason,
    rejectionCategory,
    appealDeadline: appealDeadline ? new Date(appealDeadline) : null,
    recordedBy: req.user?._id,
    recordedAt: new Date(),
  };

  addTimeline(visa, 'rejected', `Visa rejected: ${rejectionReason}`, req.user?._id);
  await visa.save();
  await logActivity(
    req.companyId,
    visa._id,
    'rejected',
    'Visa application rejected',
    req.user?._id
  );

  sendSuccess(res, 200, 'Visa rejection recorded', { visa });
});

exports.appealVisa = asyncHandler(async (req, res) => {
  const { appealNotes } = req.body;
  const visa = await VisaApplication.findOne({ _id: req.params.id, companyId: req.companyId });
  if (!visa) return sendError(res, 404, 'Visa application not found');

  visa.currentStage = 'appeal_in_progress';
  visa.decision.appealNotes = appealNotes;
  addTimeline(visa, 'appeal_in_progress', 'Appeal filed', req.user?._id);
  await visa.save();

  sendSuccess(res, 200, 'Appeal recorded', { visa });
});

exports.completePredeparture = asyncHandler(async (req, res) => {
  const visa = await VisaApplication.findOne({ _id: req.params.id, companyId: req.companyId });
  if (!visa) return sendError(res, 404, 'Visa application not found');

  visa.currentStage = 'completed';
  visa.preDeparture.completedAt = new Date();
  addTimeline(visa, 'completed', 'Pre-departure steps completed', req.user?._id);
  await visa.save();

  sendSuccess(res, 200, 'Pre-departure complete', { visa });
});

// ─── Checklist ────────────────────────────────────────────────────────────────

exports.getChecklist = asyncHandler(async (req, res) => {
  const visa = await VisaApplication.findOne({
    _id: req.params.id,
    companyId: req.companyId,
  }).select('generatedChecklist visaId destinationCountry');
  if (!visa) return sendError(res, 404, 'Visa application not found');
  sendSuccess(res, 200, 'Checklist fetched', {
    checklist: visa.generatedChecklist,
    visaId: visa.visaId,
  });
});

exports.addChecklistItem = asyncHandler(async (req, res) => {
  const visa = await VisaApplication.findOne({ _id: req.params.id, companyId: req.companyId });
  if (!visa) return sendError(res, 404, 'Visa application not found');

  visa.generatedChecklist.push({ ...req.body, status: 'pending' });
  addTimeline(
    visa,
    'checklist_item_added',
    `Checklist item added: ${req.body.documentName}`,
    req.user?._id
  );
  await visa.save();

  sendSuccess(res, 201, 'Checklist item added', { checklist: visa.generatedChecklist });
});

exports.updateChecklistItem = asyncHandler(async (req, res) => {
  const visa = await VisaApplication.findOne({ _id: req.params.id, companyId: req.companyId });
  if (!visa) return sendError(res, 404, 'Visa application not found');

  const item = visa.generatedChecklist.id(req.params.itemId);
  if (!item) return sendError(res, 404, 'Checklist item not found');

  Object.assign(item, req.body);
  item.isMissing = item.status === 'pending';
  await visa.save();

  sendSuccess(res, 200, 'Checklist item updated', { item });
});

exports.verifyChecklistItem = asyncHandler(async (req, res) => {
  const visa = await VisaApplication.findOne({ _id: req.params.id, companyId: req.companyId });
  if (!visa) return sendError(res, 404, 'Visa application not found');

  const item = visa.generatedChecklist.id(req.params.itemId);
  if (!item) return sendError(res, 404, 'Checklist item not found');

  item.status = 'verified';
  item.verifiedAt = new Date();
  item.verifiedBy = req.user?._id;
  item.isMissing = false;
  addTimeline(visa, 'document_verified', `Document verified: ${item.documentName}`, req.user?._id);
  await visa.save();

  sendSuccess(res, 200, 'Document verified', { item });
});

exports.rejectChecklistItem = asyncHandler(async (req, res) => {
  const { rejectionReason } = req.body;
  const visa = await VisaApplication.findOne({ _id: req.params.id, companyId: req.companyId });
  if (!visa) return sendError(res, 404, 'Visa application not found');

  const item = visa.generatedChecklist.id(req.params.itemId);
  if (!item) return sendError(res, 404, 'Checklist item not found');

  item.status = 'rejected';
  item.rejectedAt = new Date();
  item.rejectionReason = rejectionReason;
  item.isMissing = true;
  addTimeline(
    visa,
    'document_rejected',
    `Document rejected: ${item.documentName} — ${rejectionReason}`,
    req.user?._id
  );
  await visa.save();

  sendSuccess(res, 200, 'Document rejected', { item });
});

// ─── Financial Assessment ─────────────────────────────────────────────────────

exports.getFinancialAssessment = asyncHandler(async (req, res) => {
  const visa = await VisaApplication.findOne({
    _id: req.params.id,
    companyId: req.companyId,
  }).select('financialAssessment visaId destinationCountry');
  if (!visa) return sendError(res, 404, 'Visa application not found');
  sendSuccess(res, 200, 'Financial assessment fetched', {
    financialAssessment: visa.financialAssessment,
  });
});

exports.saveFinancialAssessment = asyncHandler(async (req, res) => {
  const visa = await VisaApplication.findOne({ _id: req.params.id, companyId: req.companyId });
  if (!visa) return sendError(res, 404, 'Visa application not found');

  Object.assign(visa.financialAssessment, req.body);
  visa.financialAssessment.assessedBy = req.user?._id;
  visa.financialAssessment.assessedAt = new Date();
  addTimeline(visa, 'financial_assessment_updated', 'Financial assessment updated', req.user?._id);
  await visa.save();

  sendSuccess(res, 200, 'Financial assessment saved', {
    financialAssessment: visa.financialAssessment,
  });
});

exports.recalculateFinancial = asyncHandler(async (req, res) => {
  const visa = await VisaApplication.findOne({ _id: req.params.id, companyId: req.companyId });
  if (!visa) return sendError(res, 404, 'Visa application not found');

  const fa = visa.financialAssessment;
  const available = fa.availableFunds || 0;
  const required = fa.requiredAmount || 0;
  const ratio = required > 0 ? available / required : 1;

  const riskFlags = [];
  if (ratio < 0.5) riskFlags.push('Available funds < 50% of required');
  if (!fa.sponsorDetails?.name) riskFlags.push('No sponsor details provided');
  if (!fa.sourceOfFunds?.length) riskFlags.push('No source of funds documented');

  let recommendation;
  if (ratio >= 1.5) recommendation = 'strong';
  else if (ratio >= 1.0) recommendation = 'adequate';
  else if (ratio >= 0.75) recommendation = 'borderline';
  else recommendation = 'insufficient';

  fa.riskFlags = riskFlags;
  fa.recommendationResult = recommendation;
  fa.affordabilitySummary = `Available ${available} vs Required ${required} ${fa.currency} — ${recommendation.toUpperCase()}`;
  fa.assessedBy = req.user?._id;
  fa.assessedAt = new Date();

  await visa.save();
  sendSuccess(res, 200, 'Financial assessment recalculated', { financialAssessment: fa });
});

// ─── Interview / Biometrics ───────────────────────────────────────────────────

exports.scheduleInterview = asyncHandler(async (req, res) => {
  const { scheduledDate, venue, type, appointmentRef } = req.body;
  const visa = await VisaApplication.findOne({ _id: req.params.id, companyId: req.companyId });
  if (!visa) return sendError(res, 404, 'Visa application not found');

  visa.interview.scheduledDate = new Date(scheduledDate);
  visa.interview.venue = venue;
  visa.interview.type = type || 'embassy';
  visa.interview.appointmentRef = appointmentRef;
  visa.interview.status = 'scheduled';
  visa.currentStage = 'interview_scheduled';

  addTimeline(
    visa,
    'interview_scheduled',
    `Interview scheduled at ${venue} on ${scheduledDate}`,
    req.user?._id
  );
  await visa.save();

  sendSuccess(res, 200, 'Interview scheduled', { interview: visa.interview });
});

exports.completeInterview = asyncHandler(async (req, res) => {
  const { mockInterviewScore, outcomeNotes } = req.body;
  const visa = await VisaApplication.findOne({ _id: req.params.id, companyId: req.companyId });
  if (!visa) return sendError(res, 404, 'Visa application not found');

  visa.interview.status = 'completed';
  visa.interview.completedAt = new Date();
  visa.interview.mockInterviewScore = mockInterviewScore;
  visa.interview.outcomeNotes = outcomeNotes;
  visa.currentStage = 'interview_done';

  addTimeline(
    visa,
    'interview_done',
    `Interview completed. Score: ${mockInterviewScore}/10`,
    req.user?._id
  );
  await visa.save();

  sendSuccess(res, 200, 'Interview completed', { interview: visa.interview });
});

exports.scheduleBiometrics = asyncHandler(async (req, res) => {
  const { scheduledDate, venue, appointmentRef } = req.body;
  const visa = await VisaApplication.findOne({ _id: req.params.id, companyId: req.companyId });
  if (!visa) return sendError(res, 404, 'Visa application not found');

  visa.biometrics.scheduledDate = new Date(scheduledDate);
  visa.biometrics.venue = venue;
  visa.biometrics.appointmentRef = appointmentRef;
  visa.biometrics.status = 'scheduled';
  visa.currentStage = 'biometrics_scheduled';

  addTimeline(
    visa,
    'biometrics_scheduled',
    `Biometrics scheduled at ${venue} on ${scheduledDate}`,
    req.user?._id
  );
  await visa.save();

  sendSuccess(res, 200, 'Biometrics scheduled', { biometrics: visa.biometrics });
});

exports.completeBiometrics = asyncHandler(async (req, res) => {
  const visa = await VisaApplication.findOne({ _id: req.params.id, companyId: req.companyId });
  if (!visa) return sendError(res, 404, 'Visa application not found');

  visa.biometrics.status = 'completed';
  visa.biometrics.completedAt = new Date();
  visa.currentStage = 'biometrics_done';

  addTimeline(visa, 'biometrics_done', 'Biometrics completed', req.user?._id);
  await visa.save();

  sendSuccess(res, 200, 'Biometrics completed', { biometrics: visa.biometrics });
});

// ─── Risk Assessment ──────────────────────────────────────────────────────────

exports.runRiskAssessment = asyncHandler(async (req, res) => {
  const visa = await VisaApplication.findOne({ _id: req.params.id, companyId: req.companyId });
  if (!visa) return sendError(res, 404, 'Visa application not found');

  const checklistTotal = visa.generatedChecklist.length;
  const checklistDone = visa.generatedChecklist.filter((i) => i.status === 'verified').length;
  const docCompletionRate =
    checklistTotal > 0 ? Math.round((checklistDone / checklistTotal) * 100) : 0;

  const fa = visa.financialAssessment || {};
  const financialStrength =
    fa.requiredAmount > 0
      ? Math.min(100, Math.round((fa.availableFunds / fa.requiredAmount) * 100))
      : 50;

  const {
    academicGPA = 2.5,
    englishTestType = 'none',
    englishScore = 0,
    gapYears = 0,
    refusalCount = 0,
    hasVisaHistory = false,
    mockInterviewScore = 5,
  } = req.body;

  const result = assessVisaRisk({
    academicGPA,
    englishTestType,
    englishScore,
    destinationCountry: visa.destinationCountryCode,
    financialStrength,
    gapYears,
    refusalCount,
    hasVisaHistory,
    docCompletionRate,
    mockInterviewScore: visa.interview?.mockInterviewScore || mockInterviewScore,
    ruleSnapshot: visa.ruleSnapshot,
  });

  visa.riskAssessment = {
    ...result,
    assessedAt: new Date(),
    assessedBy: req.user?._id,
  };

  addTimeline(
    visa,
    'risk_assessed',
    `Risk assessment: ${result.riskCategory} (${result.visaSuccessProbability}%)`,
    req.user?._id
  );
  await visa.save();

  sendSuccess(res, 200, 'Risk assessment complete', { riskAssessment: visa.riskAssessment });
});

// ─── Dashboard Analytics ──────────────────────────────────────────────────────

exports.getVisaDashboard = asyncHandler(async (req, res) => {
  const companyId = req.companyId;

  const [totalApplications, byCountry, byStage, approvedCount, rejectedCount] = await Promise.all([
    VisaApplication.countDocuments({ companyId }),
    VisaApplication.aggregate([
      {
        $match: {
          companyId: require('mongoose').Types.ObjectId.createFromHexString ? null : companyId,
        },
      },
      {
        $group: {
          _id: '$destinationCountryCode',
          count: { $sum: 1 },
          country: { $first: '$destinationCountry' },
        },
      },
    ]).catch(() => []),
    VisaApplication.aggregate([
      { $match: {} },
      { $group: { _id: '$currentStage', count: { $sum: 1 } } },
    ]).catch(() => []),
    VisaApplication.countDocuments({ companyId, currentStage: 'approved' }),
    VisaApplication.countDocuments({ companyId, currentStage: 'rejected' }),
  ]);

  const approvalRate =
    totalApplications > 0 ? Math.round((approvedCount / totalApplications) * 100) : 0;

  sendSuccess(res, 200, 'Visa dashboard fetched', {
    totalApplications,
    approvedCount,
    rejectedCount,
    approvalRate,
    byCountry,
    byStage,
  });
});
