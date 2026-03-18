const Lead = require('../models/Lead');
const Student = require('../models/Student');
const Activity = require('../models/Activity');
const { sendSuccess, sendError } = require('../utils/responseHandler');
const { calculateLeadScore } = require('../utils/leadScoring');

// ─── Helpers ─────────────────────────────────────────────────────────────────
const asyncHandler = (fn) => (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next);

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
      metadata: meta,
    });
  } catch (e) {
    console.error('Activity log error:', e.message);
  }
};

const addLeadActivity = (lead, type, description, performedBy, metadata = {}) => {
  lead.activities.push({ type, description, performedBy, metadata });
};

// ─── GET /leads ──────────────────────────────────────────────────────────────
exports.getLeads = asyncHandler(async (req, res) => {
  const companyId = req.companyId;
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
  } = req.query;

  const filter = { companyId, deletedAt: null };
  if (status) filter.status = status;
  if (source) filter.source = source;
  if (counsellor) filter.assignedCounsellor = counsellor;
  if (branch) filter.branchId = branch;
  if (category) filter.leadCategory = category;

  if (fromDate || toDate) {
    filter.createdAt = {};
    if (fromDate) filter.createdAt.$gte = new Date(fromDate);
    if (toDate) filter.createdAt.$lte = new Date(toDate);
  }

  if (search) {
    filter.$or = [
      { firstName: { $regex: search, $options: 'i' } },
      { lastName: { $regex: search, $options: 'i' } },
      { email: { $regex: search, $options: 'i' } },
      { phone: { $regex: search, $options: 'i' } },
    ];
  }

  const sort = { [sortBy]: sortOrder === 'asc' ? 1 : -1 };
  const skip = (parseInt(page) - 1) * parseInt(limit);

  const [leads, total] = await Promise.all([
    Lead.find(filter)
      .select('-activities -notes')
      .populate('assignedCounsellor', 'name email')
      .populate('branchId', 'name')
      .sort(sort)
      .skip(skip)
      .limit(parseInt(limit))
      .lean(),
    Lead.countDocuments(filter),
  ]);

  sendSuccess(res, 200, 'Leads fetched', {
    leads,
    pagination: {
      total,
      page: parseInt(page),
      limit: parseInt(limit),
      pages: Math.ceil(total / parseInt(limit)),
    },
  });
});

// ─── POST /leads ─────────────────────────────────────────────────────────────
exports.createLead = asyncHandler(async (req, res) => {
  const companyId = req.companyId;
  const data = { ...req.body, companyId };

  // Calculate score
  const { score, category } = calculateLeadScore(data);
  data.leadScore = score;
  data.leadCategory = category;

  const lead = await Lead.create(data);

  // Log creation
  addLeadActivity(
    lead,
    'lead_created',
    `Lead created by ${req.user?.name || 'system'}`,
    req.user?._id
  );
  await lead.save();
  await logActivity(
    companyId,
    lead._id,
    'lead_created',
    `Lead ${lead.firstName} ${lead.lastName} created`,
    req.user?._id
  );

  sendSuccess(res, 201, 'Lead created successfully', { lead });
});

// ─── GET /leads/:id ──────────────────────────────────────────────────────────
exports.getLeadById = asyncHandler(async (req, res) => {
  const lead = await Lead.findOne({ _id: req.params.id, companyId: req.companyId, deletedAt: null })
    .populate('assignedCounsellor', 'name email phone')
    .populate('studentId', 'name email')
    .populate('branchId', 'name')
    .populate('activities.performedBy', 'name')
    .populate('assignmentHistory.counsellor', 'name email')
    .populate('notes.createdBy', 'name');

  if (!lead) return sendError(res, 404, 'Lead not found');
  sendSuccess(res, 200, 'Lead fetched', { lead });
});

// ─── PUT /leads/:id ──────────────────────────────────────────────────────────
exports.updateLead = asyncHandler(async (req, res) => {
  const lead = await Lead.findOne({
    _id: req.params.id,
    companyId: req.companyId,
    deletedAt: null,
  });
  if (!lead) return sendError(res, 404, 'Lead not found');

  const previousStatus = lead.status;
  const updates = req.body;

  Object.assign(lead, updates);

  // Recalculate score
  const { score, category } = calculateLeadScore(lead);
  lead.leadScore = score;
  lead.leadCategory = category;

  // Log status change
  if (updates.status && updates.status !== previousStatus) {
    addLeadActivity(
      lead,
      'status_changed',
      `Status changed from ${previousStatus} to ${updates.status}`,
      req.user?._id,
      { from: previousStatus, to: updates.status }
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
    status: updates.status,
  });

  sendSuccess(res, 200, 'Lead updated', { lead });
});

// ─── DELETE /leads/:id ───────────────────────────────────────────────────────
exports.deleteLead = asyncHandler(async (req, res) => {
  const lead = await Lead.findOne({
    _id: req.params.id,
    companyId: req.companyId,
    deletedAt: null,
  });
  if (!lead) return sendError(res, 404, 'Lead not found');

  lead.deletedAt = new Date();
  await lead.save();
  await logActivity(req.companyId, lead._id, 'lead_deleted', 'Lead soft-deleted', req.user?._id);

  sendSuccess(res, 200, 'Lead deleted');
});

// ─── POST /leads/:id/assign ──────────────────────────────────────────────────
exports.assignCounsellor = asyncHandler(async (req, res) => {
  const { counsellorId, reason } = req.body;
  const lead = await Lead.findOne({
    _id: req.params.id,
    companyId: req.companyId,
    deletedAt: null,
  });
  if (!lead) return sendError(res, 404, 'Lead not found');

  const previousCounsellor = lead.assignedCounsellor;

  lead.assignedCounsellor = counsellorId;
  lead.assignedTo = counsellorId; // legacy compat
  lead.assignmentHistory.push({
    counsellor: counsellorId,
    assignedAt: new Date(),
    assignedBy: req.user?._id,
    reason: reason || 'Manual assignment',
  });

  addLeadActivity(lead, 'assignment_changed', 'Counsellor assignment changed', req.user?._id, {
    from: previousCounsellor,
    to: counsellorId,
    reason,
  });

  await lead.save();
  await logActivity(
    req.companyId,
    lead._id,
    'assignment_changed',
    'Lead assigned to counsellor',
    req.user?._id
  );

  sendSuccess(res, 200, 'Counsellor assigned', { lead });
});

// ─── POST /leads/:id/status ──────────────────────────────────────────────────
exports.updateStatus = asyncHandler(async (req, res) => {
  const { status } = req.body;
  const lead = await Lead.findOne({
    _id: req.params.id,
    companyId: req.companyId,
    deletedAt: null,
  });
  if (!lead) return sendError(res, 404, 'Lead not found');

  const previousStatus = lead.status;
  lead.status = status;

  addLeadActivity(
    lead,
    'status_changed',
    `Status updated from ${previousStatus} to ${status}`,
    req.user?._id,
    { from: previousStatus, to: status }
  );

  await lead.save();
  sendSuccess(res, 200, 'Status updated', { lead });
});

// ─── POST /leads/:id/followup ────────────────────────────────────────────────
exports.scheduleFollowUp = asyncHandler(async (req, res) => {
  const { scheduledAt, type = 'call', notes } = req.body;
  const lead = await Lead.findOne({
    _id: req.params.id,
    companyId: req.companyId,
    deletedAt: null,
  });
  if (!lead) return sendError(res, 404, 'Lead not found');

  lead.followUps.push({ scheduledAt: new Date(scheduledAt), type, notes, status: 'pending' });
  lead.nextFollowUp = new Date(scheduledAt);

  addLeadActivity(
    lead,
    'followup_scheduled',
    `Follow-up scheduled for ${new Date(scheduledAt).toDateString()} via ${type}`,
    req.user?._id,
    { scheduledAt, type, notes }
  );

  // Recalculate score (now has follow-up)
  const { score, category } = calculateLeadScore(lead);
  lead.leadScore = score;
  lead.leadCategory = category;

  await lead.save();
  sendSuccess(res, 200, 'Follow-up scheduled', { lead });
});

// ─── POST /leads/:id/note ────────────────────────────────────────────────────
exports.addNote = asyncHandler(async (req, res) => {
  const { content } = req.body;
  const lead = await Lead.findOne({
    _id: req.params.id,
    companyId: req.companyId,
    deletedAt: null,
  });
  if (!lead) return sendError(res, 404, 'Lead not found');

  lead.notes.push({ content, createdBy: req.user?._id });
  addLeadActivity(lead, 'note_added', 'Note added', req.user?._id);

  // Recalculate score
  const { score, category } = calculateLeadScore(lead);
  lead.leadScore = score;
  lead.leadCategory = category;

  await lead.save();
  sendSuccess(res, 201, 'Note added', { lead });
});

// ─── POST /leads/:id/convert ─────────────────────────────────────────────────
exports.convertToStudent = asyncHandler(async (req, res) => {
  const lead = await Lead.findOne({
    _id: req.params.id,
    companyId: req.companyId,
    deletedAt: null,
  });
  if (!lead) return sendError(res, 404, 'Lead not found');
  if (lead.convertedToStudent) return sendError(res, 400, 'Lead already converted to student');

  // Create student record
  const studentData = {
    companyId: req.companyId,
    branchId: lead.branchId,
    name: lead.firstName + ' ' + lead.lastName,
    firstName: lead.firstName,
    lastName: lead.lastName,
    email: lead.email,
    phone: lead.phone,
    education: lead.education,
    source: lead.source,
    assignedTo: lead.assignedCounsellor || lead.assignedTo,
    leadId: lead._id,
    status: 'active',
    metadata: { convertedFromLead: lead._id, convertedAt: new Date() },
  };

  let student;
  try {
    student = await Student.create(studentData);
  } catch (e) {
    // Student may already exist (e.g., same phone/email)
    student = await Student.findOne({
      companyId: req.companyId,
      $or: [{ email: lead.email }, { phone: lead.phone }],
    });
    if (!student) throw e;
  }

  lead.convertedToStudent = true;
  lead.studentId = student._id;
  lead.convertedAt = new Date();
  lead.status = 'enrolled';

  addLeadActivity(
    lead,
    'converted_to_student',
    `Lead converted to student (ID: ${student._id})`,
    req.user?._id,
    { studentId: student._id }
  );

  await lead.save();
  await logActivity(
    req.companyId,
    lead._id,
    'converted_to_student',
    'Lead converted to student',
    req.user?._id,
    { studentId: student._id }
  );

  sendSuccess(res, 200, 'Lead converted to student', { lead, student });
});

// ─── GET /leads/:id/activities ───────────────────────────────────────────────
exports.getActivities = asyncHandler(async (req, res) => {
  const lead = await Lead.findOne({ _id: req.params.id, companyId: req.companyId, deletedAt: null })
    .populate('activities.performedBy', 'name email')
    .select('activities firstName lastName');

  if (!lead) return sendError(res, 404, 'Lead not found');
  sendSuccess(res, 200, 'Activities fetched', { activities: lead.activities });
});

// ─── GET /leads/pipeline ─────────────────────────────────────────────────────
exports.getPipeline = asyncHandler(async (req, res) => {
  const companyId = req.companyId;
  const stages = [
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

  const pipeline = await Lead.aggregate([
    {
      $match: {
        companyId: require('mongoose').Types.ObjectId.createFromHexString ? null : companyId,
        deletedAt: null,
      },
    },
    { $group: { _id: '$status', count: { $sum: 1 }, leads: { $push: '$$ROOT' } } },
  ]);

  // Format as object map
  const result = {};
  stages.forEach((s) => {
    const found = pipeline.find((p) => p._id === s);
    result[s] = {
      stage: s,
      count: found?.count || 0,
      leads: found?.leads?.slice(0, 50) || [], // limit per stage
    };
  });

  sendSuccess(res, 200, 'Pipeline fetched', { pipeline: result, stages });
});

// ─── GET /leads/followups/due ────────────────────────────────────────────────
exports.getDueFollowUps = asyncHandler(async (req, res) => {
  const companyId = req.companyId;
  const now = new Date();
  const next24h = new Date(now.getTime() + 24 * 60 * 60 * 1000);

  const leads = await Lead.find({
    companyId,
    deletedAt: null,
    nextFollowUp: { $lte: next24h },
    'followUps.status': 'pending',
  })
    .populate('assignedCounsellor', 'name email')
    .select(
      'firstName lastName phone email nextFollowUp followUps assignedCounsellor leadScore leadCategory'
    )
    .limit(100)
    .lean();

  const overdue = leads.filter((l) => new Date(l.nextFollowUp) < now);
  const upcoming = leads.filter((l) => new Date(l.nextFollowUp) >= now);

  sendSuccess(res, 200, 'Due follow-ups fetched', { overdue, upcoming });
});

// ─── POST /leads/:id/score ───────────────────────────────────────────────────
exports.recalculateScore = asyncHandler(async (req, res) => {
  const lead = await Lead.findOne({
    _id: req.params.id,
    companyId: req.companyId,
    deletedAt: null,
  });
  if (!lead) return sendError(res, 404, 'Lead not found');

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
