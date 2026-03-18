const Joi = require('joi');

exports.createVisaApplicationSchema = Joi.object({
  student: Joi.string().hex().length(24).required(),
  application: Joi.string().hex().length(24),
  lead: Joi.string().hex().length(24),
  destinationCountry: Joi.string().required(),
  visaType: Joi.string().required(),
  currentStage: Joi.string().required(),
  status: Joi.string().required(),
  branch: Joi.string().hex().length(24),
  counsellor: Joi.string().hex().length(24),
  ruleSnapshot: Joi.object(),
  notes: Joi.string().allow(''),
});
