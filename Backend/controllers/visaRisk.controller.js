const VisaApplication = require('../models/VisaApplication');
const { sendSuccess, sendError } = require('../utils/responseHandler');

// GET /visa-applications/:id/risk
exports.getRiskAssessment = async (req, res) => {
  try {
    const app = await VisaApplication.findById(req.params.id);
    if (!app) return sendError(res, 404, 'Visa application not found');
    // Example risk calculation (replace with real logic)
    let riskScore = 0;
    if (app.hasPreviousVisaRejection) riskScore += 30;
    if (app.gapInStudies) riskScore += 20;
    if (app.financialIssues) riskScore += 25;
    // ... add more rules as needed
    return sendSuccess(res, 200, 'Risk assessment calculated', { riskScore });
  } catch (error) {
    return sendError(res, 500, 'Failed to calculate risk', error.message);
  }
};
