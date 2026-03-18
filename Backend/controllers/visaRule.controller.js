const VisaRule = require('../models/VisaRule');
const { sendSuccess, sendError } = require('../utils/responseHandler');

exports.getVisaRules = async (req, res) => {
  try {
    const rules = await VisaRule.find({ isActive: true });
    return sendSuccess(res, 200, 'Visa rules fetched', rules);
  } catch (error) {
    return sendError(res, 500, 'Failed to fetch visa rules', error.message);
  }
};

exports.getVisaRuleById = async (req, res) => {
  try {
    const rule = await VisaRule.findById(req.params.id);
    if (!rule) return sendError(res, 404, 'Visa rule not found');
    return sendSuccess(res, 200, 'Visa rule fetched', rule);
  } catch (error) {
    return sendError(res, 400, 'Invalid visa rule ID', error.message);
  }
};

exports.getVisaRulesByCountry = async (req, res) => {
  try {
    const { countryCode } = req.params;
    const rules = await VisaRule.find({ countryCode: countryCode.toUpperCase(), isActive: true });
    return sendSuccess(res, 200, 'Visa rules for country fetched', rules);
  } catch (error) {
    return sendError(res, 500, 'Failed to fetch visa rules by country', error.message);
  }
};

exports.createVisaRule = async (req, res) => {
  try {
    const rule = await VisaRule.create(req.body);
    return sendSuccess(res, 201, 'Visa rule created', rule);
  } catch (error) {
    return sendError(res, 400, 'Failed to create visa rule', error.message);
  }
};

exports.updateVisaRule = async (req, res) => {
  try {
    const rule = await VisaRule.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });
    if (!rule) return sendError(res, 404, 'Visa rule not found');
    return sendSuccess(res, 200, 'Visa rule updated', rule);
  } catch (error) {
    return sendError(res, 400, 'Failed to update visa rule', error.message);
  }
};

exports.deleteVisaRule = async (req, res) => {
  try {
    const rule = await VisaRule.findByIdAndDelete(req.params.id);
    if (!rule) return sendError(res, 404, 'Visa rule not found');
    return sendSuccess(res, 200, 'Visa rule deleted', rule);
  } catch (error) {
    return sendError(res, 400, 'Failed to delete visa rule', error.message);
  }
};
