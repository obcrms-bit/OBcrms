const LeadService = require('../services/LeadService');
const APIResponse = require('../utils/APIResponse');
const asyncHandler = require('../utils/asyncHandler');

// ─── GET /leads - Fetch all leads with filtering ───────────────────────────
exports.getLeads = asyncHandler(async (req, res) => {
  const companyId = req.companyId;

  const result = await LeadService.getLeads(companyId, req.query);

  return APIResponse.paginated(
    res,
    'Leads retrieved successfully',
    result.leads,
    result.pagination
  );
});

// ─── POST /leads - Create new lead ────────────────────────────────────────
exports.createLead = asyncHandler(async (req, res) => {
  const companyId = req.companyId;
  const userId = req.userId;

  const lead = await LeadService.createLead(companyId, req.body, userId);

  return APIResponse.created(res, 'Lead created successfully', lead);
});

// ─── GET /leads/:id - Get lead by ID ─────────────────────────────────────
exports.getLeadById = asyncHandler(async (req, res) => {
  const companyId = req.companyId;
  const { id } = req.params;

  const lead = await LeadService.getLeadById(companyId, id);

  return APIResponse.success(res, 200, 'Lead retrieved successfully', lead);
});

// ─── PUT /leads/:id - Update lead ───────────────────────────────────────
exports.updateLead = asyncHandler(async (req, res) => {
  const companyId = req.companyId;
  const userId = req.userId;
  const { id } = req.params;

  const lead = await LeadService.updateLead(companyId, id, req.body, userId);

  return APIResponse.success(res, 200, 'Lead updated successfully', lead);
});

// ─── DELETE /leads/:id - Delete lead ───────────────────────────────────────
exports.deleteLead = asyncHandler(async (req, res) => {
  const companyId = req.companyId;
  const userId = req.userId;
  const { id } = req.params;

  await LeadService.deleteLead(companyId, id, userId);

  return APIResponse.success(res, 200, 'Lead deleted successfully');
});

// ─── POST /leads/:id/status - Update lead status ─────────────────────────
exports.updateStatus = asyncHandler(async (req, res) => {
  const companyId = req.companyId;
  const userId = req.userId;
  const { id } = req.params;
  const { status } = req.body;

  if (!status) {
    return APIResponse.badRequest(res, 'Status is required');
  }

  const lead = await LeadService.updateLeadStatus(companyId, id, status, userId);

  return APIResponse.success(res, 200, 'Lead status updated successfully', lead);
});

// ─── GET /leads/pipeline - Get pipeline view ─────────────────────────────
exports.getPipeline = asyncHandler(async (req, res) => {
  const companyId = req.companyId;
  const { branch } = req.query;

  const pipeline = await LeadService.getPipeline(companyId, branch);

  return APIResponse.success(res, 200, 'Pipeline retrieved successfully', pipeline);
});

// ─── GET /leads/followups/due - Get due follow-ups ───────────────────────
exports.getDueFollowUps = asyncHandler(async (req, res) => {
  const companyId = req.companyId;

  const followUps = await LeadService.getDueFollowUps(companyId);

  return APIResponse.success(res, 200, 'Due follow-ups retrieved successfully', followUps);
});

// ─── POST /leads/:id/convert - Convert lead to student ──────────────────
exports.convertToStudent = asyncHandler(async (req, res) => {
  const companyId = req.companyId;
  const userId = req.userId;
  const { id } = req.params;

  const student = await LeadService.convertToStudent(companyId, id, userId);

  return APIResponse.created(res, 'Lead converted to student successfully', student);
});

// ─── POST /leads/:id/assign - Assign counsellor ──────────────────────────
exports.assignCounsellor = asyncHandler(async (req, res) => {
  const companyId = req.companyId;
  const userId = req.userId;
  const { id } = req.params;
  const { counsellorId, reason } = req.body;

  if (!counsellorId) {
    return APIResponse.badRequest(res, 'Counsellor ID is required');
  }

  const lead = await LeadService.assignCounsellor(companyId, id, counsellorId, reason, userId);

  return APIResponse.success(res, 200, 'Counsellor assigned successfully', lead);
});

// ─── POST /leads/:id/followup - Schedule follow-up ────────────────────────
exports.scheduleFollowUp = asyncHandler(async (req, res) => {
  const companyId = req.companyId;
  const userId = req.userId;
  const { id } = req.params;
  const { date, notes, type } = req.body;

  if (!date) {
    return APIResponse.badRequest(res, 'Date is required');
  }

  const lead = await LeadService.scheduleFollowUp(companyId, id, { date, notes, type }, userId);

  return APIResponse.success(res, 200, 'Follow-up scheduled successfully', lead);
});

// ─── POST /leads/:id/score - Recalculate score ───────────────────────────
exports.recalculateScore = asyncHandler(async (req, res) => {
  const companyId = req.companyId;
  const userId = req.userId;
  const { id } = req.params;

  const lead = await LeadService.recalculateScore(companyId, id, userId);

  return APIResponse.success(res, 200, 'Lead score recalculated successfully', lead);
});

// ─── POST /leads/:id/note - Add note to lead ─────────────────────────────
exports.addNote = asyncHandler(async (req, res) => {
  const companyId = req.companyId;
  const userId = req.userId;
  const { id } = req.params;
  const { content } = req.body;

  if (!content) {
    return APIResponse.badRequest(res, 'Note content is required');
  }

  const lead = await LeadService.getLeadById(companyId, id);

  lead.notes = lead.notes || [];
  lead.notes.push({
    content,
    addedBy: userId,
    createdAt: new Date(),
  });

  await lead.save();

  await LeadService.logActivity(companyId, id, 'NOTE_ADDED', 'Note added to lead', userId);

  return APIResponse.success(res, 200, 'Note added successfully', lead);
});

// ─── GET /leads/:id/activities - Get lead activities ────────────────────
exports.getActivities = asyncHandler(async (req, res) => {
  const companyId = req.companyId;
  const { id } = req.params;

  const lead = await LeadService.getLeadById(companyId, id);
  const activities = lead.activities || [];

  return APIResponse.success(res, 200, 'Activities retrieved successfully', activities);
});
