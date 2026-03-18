const Joi = require('joi');

exports.addChecklistItemSchema = Joi.object({
  name: Joi.string().required(),
  description: Joi.string().allow(''),
  required: Joi.boolean(),
  expiryDate: Joi.date().allow(null),
  comments: Joi.string().allow(''),
});

exports.updateChecklistItemSchema = Joi.object({
  submitted: Joi.boolean(),
  verified: Joi.boolean(),
  rejected: Joi.boolean(),
  expiryDate: Joi.date().allow(null),
  comments: Joi.string().allow(''),
  file: Joi.string().hex().length(24),
});
