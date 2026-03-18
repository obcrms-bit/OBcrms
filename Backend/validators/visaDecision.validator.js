const Joi = require('joi');

exports.decisionSchema = Joi.object({
  status: Joi.string().valid('approved', 'rejected', 'pending', 'appeal_in_progress').required(),
  decisionDate: Joi.date().required(),
  rejectionReasons: Joi.array().items(Joi.string()),
  notes: Joi.string().allow(''),
});
