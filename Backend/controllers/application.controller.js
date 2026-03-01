const Application = require("../models/application.model");
const { sendSuccess, sendError } = require("../utils/responseHandler");

// Create application
exports.createApplication = async (req, res) => {
  try {
    const {
      student,
      universityName,
      country,
      course,
      intake,
      tuitionFee,
      status,
    } = req.body;

    if (!student || !universityName) {
      return sendError(res, 400, "Student and university name are required");
    }

    const application = new Application({
      companyId: req.companyId,
      student,
      universityName,
      country,
      course,
      intake,
      tuitionFee,
      status,
    });

    await application.save();
    sendSuccess(res, 201, "Application created", application);
  } catch (error) {
    sendError(res, 500, "Failed to create application", error.message);
  }
};

// Get all applications
exports.getAllApplications = async (req, res) => {
  try {
    const applications = await Application.find({ companyId: req.companyId }).populate("student");
    sendSuccess(res, 200, "Applications fetched", applications);
  } catch (error) {
    sendError(res, 500, "Failed to retrieve applications", error.message);
  }
};

// Get application by ID
exports.getApplicationById = async (req, res) => {
  try {
    const { id } = req.params;
    const application = await Application.findOne({ _id: id, companyId: req.companyId }).populate("student");
    if (!application) {
      return sendError(res, 404, "Application not found");
    }
    sendSuccess(res, 200, "Application fetched", application);
  } catch (error) {
    sendError(res, 500, "Failed to retrieve application", error.message);
  }
};

// Update application
exports.updateApplication = async (req, res) => {
  try {
    const { id } = req.params;
    const updates = { ...req.body, updatedAt: Date.now() };
    const application = await Application.findOneAndUpdate(
      { _id: id, companyId: req.companyId },
      updates,
      {
        new: true,
        runValidators: true,
      }
    ).populate("student");
    if (!application) {
      return sendError(res, 404, "Application not found");
    }
    sendSuccess(res, 200, "Application updated", application);
  } catch (error) {
    sendError(res, 500, "Failed to update application", error.message);
  }
};

// Delete application
exports.deleteApplication = async (req, res) => {
  try {
    const { id } = req.params;
    const application = await Application.findOneAndDelete({ _id: id, companyId: req.companyId });
    if (!application) {
      return sendError(res, 404, "Application not found");
    }
    sendSuccess(res, 200, "Application deleted", application);
  } catch (error) {
    sendError(res, 500, "Failed to delete application", error.message);
  }
};
