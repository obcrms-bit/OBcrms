const VisaApplication = require('../models/VisaApplication');
const VisaRule = require('../models/VisaRule');
const VisaMilestone = require('../models/VisaMilestone');
const { sendSuccess, sendError } = require('../utils/responseHandler');

// POST /visa-applications/:id/generate-workflow
exports.generateWorkflow = async (req, res) => {
  try {
    const app = await VisaApplication.findById(req.params.id);
    if (!app) return sendError(res, 404, 'Visa application not found');
    const rule = await VisaRule.findOne({
      country: app.destinationCountry,
      visaType: app.visaType,
    });
    if (!rule) return sendError(res, 404, 'Visa rule not found for application');
    // Generate milestones from rule
    const milestones = rule.workflowMilestones.map((m, idx) => ({
      application: app._id,
      key: m.key,
      label: m.label,
      description: m.description,
      order: m.order ?? idx,
      deadline: undefined,
    }));
    await VisaMilestone.deleteMany({ application: app._id });
    const created = await VisaMilestone.insertMany(milestones);
    return sendSuccess(res, 201, 'Workflow generated', created);
  } catch (error) {
    return sendError(res, 500, 'Failed to generate workflow', error.message);
  }
};

// POST /visa-applications/:id/update-stage
exports.updateStage = async (req, res) => {
  try {
    const { stageKey, completed } = req.body;
    const app = await VisaApplication.findById(req.params.id);
    if (!app) return sendError(res, 404, 'Visa application not found');
    const milestone = await VisaMilestone.findOne({ application: app._id, key: stageKey });
    if (!milestone) return sendError(res, 404, 'Milestone not found');
    milestone.completed = completed;
    if (completed) milestone.completedAt = new Date();
    await milestone.save();
    app.currentStage = stageKey;
    await app.save();
    return sendSuccess(res, 200, 'Stage updated', { milestone, app });
  } catch (error) {
    return sendError(res, 400, 'Failed to update stage', error.message);
  }
};

// POST /visa-applications/:id/submit
exports.submitApplication = async (req, res) => {
  try {
    const app = await VisaApplication.findById(req.params.id);
    if (!app) return sendError(res, 404, 'Visa application not found');
    app.status = 'submitted';
    await app.save();
    return sendSuccess(res, 200, 'Application submitted', app);
  } catch (error) {
    return sendError(res, 400, 'Failed to submit application', error.message);
  }
};

// POST /visa-applications/:id/approve
exports.approveApplication = async (req, res) => {
  try {
    const app = await VisaApplication.findById(req.params.id);
    if (!app) return sendError(res, 404, 'Visa application not found');
    app.status = 'approved';
    await app.save();
    return sendSuccess(res, 200, 'Application approved', app);
  } catch (error) {
    return sendError(res, 400, 'Failed to approve application', error.message);
  }
};

// POST /visa-applications/:id/reject
exports.rejectApplication = async (req, res) => {
  try {
    const app = await VisaApplication.findById(req.params.id);
    if (!app) return sendError(res, 404, 'Visa application not found');
    app.status = 'rejected';
    await app.save();
    return sendSuccess(res, 200, 'Application rejected', app);
  } catch (error) {
    return sendError(res, 400, 'Failed to reject application', error.message);
  }
};

// POST /visa-applications/:id/appeal
exports.appealApplication = async (req, res) => {
  try {
    const app = await VisaApplication.findById(req.params.id);
    if (!app) return sendError(res, 404, 'Visa application not found');
    app.status = 'appeal_in_progress';
    await app.save();
    return sendSuccess(res, 200, 'Appeal started', app);
  } catch (error) {
    return sendError(res, 400, 'Failed to start appeal', error.message);
  }
};

// POST /visa-applications/:id/predeparture-complete
exports.predepartureComplete = async (req, res) => {
  try {
    const app = await VisaApplication.findById(req.params.id);
    if (!app) return sendError(res, 404, 'Visa application not found');
    app.status = 'pre_departure_ready';
    await app.save();
    return sendSuccess(res, 200, 'Pre-departure completed', app);
  } catch (error) {
    return sendError(res, 400, 'Failed to complete pre-departure', error.message);
  }
};
