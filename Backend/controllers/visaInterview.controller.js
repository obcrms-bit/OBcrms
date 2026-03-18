const VisaInterview = require('../models/VisaInterview');
const { sendSuccess, sendError } = require('../utils/responseHandler');

// GET /visa-applications/:id/interview
exports.getInterview = async (req, res) => {
  try {
    const interview = await VisaInterview.findOne({ application: req.params.id });
    return sendSuccess(res, 200, 'Interview fetched', interview);
  } catch (error) {
    return sendError(res, 500, 'Failed to fetch interview', error.message);
  }
};

// POST /visa-applications/:id/interview/schedule
exports.scheduleInterview = async (req, res) => {
  try {
    const interview = await VisaInterview.create({ ...req.body, application: req.params.id });
    return sendSuccess(res, 201, 'Interview scheduled', interview);
  } catch (error) {
    return sendError(res, 400, 'Failed to schedule interview', error.message);
  }
};

// POST /visa-applications/:id/interview/complete
exports.completeInterview = async (req, res) => {
  try {
    const interview = await VisaInterview.findOne({ application: req.params.id });
    if (!interview) return sendError(res, 404, 'Interview not found');
    interview.completed = true;
    interview.completedAt = new Date();
    await interview.save();
    return sendSuccess(res, 200, 'Interview completed', interview);
  } catch (error) {
    return sendError(res, 400, 'Failed to complete interview', error.message);
  }
};
