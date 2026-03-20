const Applicant = require('../models/Applicant');
const Student = require('../models/Student');
const AuditLog = require('../models/AuditLog');
const { sendSuccess, sendError } = require('../utils/responseHandler');
const { isValidTransition } = require('../constants/workflow');
const mongoose = require('mongoose');
const { buildScopedClause, mergeFiltersWithAnd } = require('../services/accessControl.service');
const {
  getCountryWorkflow,
  getTenantApplicationStages,
} = require('../services/countryWorkflow.service');

const getScopedApplicationFilter = async (req, extra = {}) =>
  mergeFiltersWithAnd(
    { companyId: new mongoose.Types.ObjectId(req.companyId) },
    await buildScopedClause(req.user, 'applications', {
      branchField: 'branchId',
      assigneeFields: ['assignedOfficer'],
      creatorFields: ['createdByUser'],
      ownerFields: ['assignedOfficer'],
    }),
    extra
  );

const getStageLabel = (stages = [], stageKey = '') =>
  stages.find((stage) => stage.key === stageKey)?.label ||
  String(stageKey || '')
    .replace(/_/g, ' ')
    .replace(/\b\w/g, (char) => char.toUpperCase());

exports.createApplication = async (req, res) => {
  try {
    const {
      studentId,
      universityName,
      country,
      courseName,
      intakeMonth,
      intakeYear,
      assignedOfficer,
    } = req.body;

    const student = await Student.findOne({ _id: studentId, companyId: req.companyId });
    if (!student) return sendError(res, 404, 'Student not found');

    const workflow = await getCountryWorkflow(req.companyId, country);
    const workflowStages = workflow?.applicationStages?.length
      ? workflow.applicationStages
      : await getTenantApplicationStages(req.companyId);
    const initialStage = workflowStages[0]?.key || 'draft';

    const application = await Applicant.create({
      companyId: req.companyId,
      branchId: student.branchId,
      createdByUser: req.user?._id,
      studentId,
      universityName,
      country,
      countryWorkflowId: workflow?._id || null,
      courseName,
      intake: { month: intakeMonth, year: intakeYear },
      status: initialStage,
      stage: initialStage,
      assignedOfficer: assignedOfficer || req.user?._id,
      timeline: [
        {
          stage: initialStage,
          label: getStageLabel(workflowStages, initialStage),
          notes: 'Application created',
          changedBy: req.user?._id,
          changedAt: new Date(),
        },
      ],
      documents: (workflow?.documentChecklist || []).map((item) => ({
        name: item.name,
        required: item.required !== false,
        status: 'pending',
        notes: item.description || '',
      })),
    });

    await AuditLog.logAction({
      companyId: req.companyId,
      userId: req.user._id,
      userName: req.user.name,
      userRole: req.user.role,
      action: 'create',
      resource: 'application',
      resourceId: application._id,
      resourceName: `${student.fullName} at ${universityName}`,
    });

    return sendSuccess(res, 201, 'Application created successfully', application);
  } catch (error) {
    return sendError(res, 400, 'Failed to create application', error.message);
  }
};

exports.updateApplicationStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    const application = await Applicant.findOne(await getScopedApplicationFilter(req, { _id: id }));
    if (!application) return sendError(res, 404, 'Application not found');

    const workflow = application.countryWorkflowId
      ? await getCountryWorkflow(req.companyId, application.country)
      : null;
    const workflowStages = workflow?.applicationStages?.length
      ? workflow.applicationStages
      : await getTenantApplicationStages(req.companyId);
    const isWorkflowStage = workflowStages.some((stage) => stage.key === status);

    if (!isWorkflowStage && !isValidTransition('APPLICANT', application.status, status)) {
      return sendError(
        res,
        400,
        `Invalid status transition from ${application.status} to ${status}`
      );
    }

    const oldStatus = application.status;
    application.status = status;
    application.stage = status;
    application.timeline = application.timeline || [];
    application.timeline.push({
      stage: status,
      label: getStageLabel(workflowStages, status),
      notes: req.body.notes || '',
      changedBy: req.user?._id,
      changedAt: new Date(),
    });
    await application.save();

    await AuditLog.logAction({
      companyId: req.companyId,
      userId: req.user._id,
      userName: req.user.name,
      userRole: req.user.role,
      action: 'update',
      resource: 'application',
      resourceId: application._id,
      resourceName: application.universityName,
      changes: { before: { status: oldStatus }, after: { status } },
    });

    return sendSuccess(res, 200, 'Application status updated', application);
  } catch (error) {
    return sendError(res, 400, 'Failed to update application status', error.message);
  }
};

exports.getApplications = async (req, res) => {
  try {
    const applications = await Applicant.find(await getScopedApplicationFilter(req))
      .populate('studentId')
      .populate('countryWorkflowId')
      .populate('assignedOfficer', 'name email role')
      .sort({ createdAt: -1 });
    return sendSuccess(res, 200, 'Applications retrieved successfully', applications);
  } catch (error) {
    return sendError(res, 500, 'Failed to fetch applications', error.message);
  }
};
