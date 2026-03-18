const VisaFinancialAssessment = require('../models/VisaFinancialAssessment');
const { sendSuccess, sendError } = require('../utils/responseHandler');

// GET /visa-applications/:id/financial
exports.getFinancial = async (req, res) => {
  try {
    const assessment = await VisaFinancialAssessment.findOne({ application: req.params.id });
    return sendSuccess(res, 200, 'Financial assessment fetched', assessment);
  } catch (error) {
    return sendError(res, 500, 'Failed to fetch financial assessment', error.message);
  }
};

// POST /visa-applications/:id/financial
exports.createFinancial = async (req, res) => {
  try {
    const assessment = await VisaFinancialAssessment.create({
      ...req.body,
      application: req.params.id,
    });
    return sendSuccess(res, 201, 'Financial assessment created', assessment);
  } catch (error) {
    return sendError(res, 400, 'Failed to create financial assessment', error.message);
  }
};

// PUT /visa-applications/:id/financial
exports.updateFinancial = async (req, res) => {
  try {
    const assessment = await VisaFinancialAssessment.findOneAndUpdate(
      { application: req.params.id },
      req.body,
      { new: true, runValidators: true }
    );
    if (!assessment) return sendError(res, 404, 'Financial assessment not found');
    return sendSuccess(res, 200, 'Financial assessment updated', assessment);
  } catch (error) {
    return sendError(res, 400, 'Failed to update financial assessment', error.message);
  }
};

// POST /visa-applications/:id/financial/recalculate
exports.recalculateFinancial = async (req, res) => {
  try {
    const assessment = await VisaFinancialAssessment.findOne({ application: req.params.id });
    if (!assessment) return sendError(res, 404, 'Financial assessment not found');
    // Example: recalculate total funds
    assessment.totalFunds = (assessment.bankBalance || 0) + (assessment.sponsorFunds || 0);
    await assessment.save();
    return sendSuccess(res, 200, 'Financial assessment recalculated', assessment);
  } catch (error) {
    return sendError(res, 400, 'Failed to recalculate financial assessment', error.message);
  }
};
