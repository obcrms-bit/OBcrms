const Joi = require('joi');

exports.createFinancialAssessmentSchema = Joi.object({
  requiredAmount: Joi.number().required(),
  availableFunds: Joi.number().required(),
  tuitionDepositStatus: Joi.string().valid('pending', 'paid', 'not_required'),
  sponsorDetails: Joi.string().allow(''),
  sourceOfFunds: Joi.string().allow(''),
  livingCostRequirement: Joi.number(),
  currency: Joi.string(),
  bankStatements: Joi.array().items(Joi.string()),
  affordabilitySummary: Joi.string().allow(''),
  riskFlags: Joi.array().items(Joi.string()),
  recommendation: Joi.string().allow(''),
});
