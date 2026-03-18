const Joi = require('joi');

exports.scheduleInterviewSchema = Joi.object({
  scheduledAt: Joi.date().required(),
  preparationChecklist: Joi.array().items(Joi.string()),
  notes: Joi.string().allow(''),
});

exports.completeInterviewSchema = Joi.object({
  completedAt: Joi.date().required(),
  outcome: Joi.string().allow(''),
  mockScore: Joi.number(),
  notes: Joi.string().allow(''),
});
