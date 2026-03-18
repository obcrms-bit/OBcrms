const VisaApplication = require('../models/VisaApplication');
const { sendSuccess, sendError } = require('../utils/responseHandler');

exports.getVisaApplications = async (req, res) => {
  try {
    const apps = await VisaApplication.find()
      .populate('student')
      .populate('lead')
      .populate('branch')
      .populate('counsellor');
    return sendSuccess(res, 200, 'Visa applications fetched', apps);
  } catch (error) {
    return sendError(res, 500, 'Failed to fetch visa applications', error.message);
  }
};

exports.getVisaApplicationById = async (req, res) => {
  try {
    const app = await VisaApplication.findById(req.params.id)
      .populate('student')
      .populate('lead')
      .populate('branch')
      .populate('counsellor');
    if (!app) return sendError(res, 404, 'Visa application not found');
    return sendSuccess(res, 200, 'Visa application fetched', app);
  } catch (error) {
    return sendError(res, 400, 'Invalid visa application ID', error.message);
  }
};

exports.createVisaApplication = async (req, res) => {
  try {
    const app = await VisaApplication.create(req.body);
    return sendSuccess(res, 201, 'Visa application created', app);
  } catch (error) {
    return sendError(res, 400, 'Failed to create visa application', error.message);
  }
};

exports.updateVisaApplication = async (req, res) => {
  try {
    const app = await VisaApplication.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });
    if (!app) return sendError(res, 404, 'Visa application not found');
    return sendSuccess(res, 200, 'Visa application updated', app);
  } catch (error) {
    return sendError(res, 400, 'Failed to update visa application', error.message);
  }
};

exports.deleteVisaApplication = async (req, res) => {
  try {
    const app = await VisaApplication.findByIdAndDelete(req.params.id);
    if (!app) return sendError(res, 404, 'Visa application not found');
    return sendSuccess(res, 200, 'Visa application deleted', app);
  } catch (error) {
    return sendError(res, 400, 'Failed to delete visa application', error.message);
  }
};
