const Joi = require('joi');

exports.createVisaRuleSchema = Joi.object({
  country: Joi.string().required(),
  countryCode: Joi.string().required(),
  visaType: Joi.string().required(),
  studyLevel: Joi.array().items(Joi.string()),
  embassy: Joi.string().allow(''),
  processingCenter: Joi.string().allow(''),
  requiredDocuments: Joi.array().items(
    Joi.object({
      name: Joi.string().required(),
      description: Joi.string().allow(''),
      required: Joi.boolean(),
      category: Joi.string(),
      notes: Joi.string().allow(''),
    })
  ),
  optionalDocuments: Joi.array().items(
    Joi.object({
      name: Joi.string().required(),
      description: Joi.string().allow(''),
      required: Joi.boolean(),
      category: Joi.string(),
      notes: Joi.string().allow(''),
    })
  ),
  financialRequirements: Joi.object(),
  languageRequirements: Joi.object(),
  biometricRequired: Joi.boolean(),
  interviewRequired: Joi.boolean(),
  medicalRequired: Joi.boolean(),
  policeClearanceRequired: Joi.boolean(),
  apsRequired: Joi.boolean(),
  casRequired: Joi.boolean(),
  i20Required: Joi.boolean(),
  ds160Required: Joi.boolean(),
  sevisFeeRequired: Joi.boolean(),
  sevisFeeAmount: Joi.number(),
  loaRequired: Joi.boolean(),
  coeRequired: Joi.boolean(),
  tbTestRequired: Joi.boolean(),
  visaFee: Joi.number(),
  visaFeeCurrency: Joi.string(),
  surchargeFee: Joi.number(),
  surchargeCurrency: Joi.string(),
  processingTimeWeeksMin: Joi.number(),
  processingTimeWeeksMax: Joi.number(),
  ageConditions: Joi.array().items(
    Joi.object({
      condition: Joi.string(),
      minAge: Joi.number(),
      maxAge: Joi.number(),
      note: Joi.string().allow(''),
    })
  ),
  dependentRules: Joi.object(),
  rejectionReasonsCatalog: Joi.array().items(Joi.string()),
  preDepartureChecklist: Joi.array().items(Joi.string()),
  workflowMilestones: Joi.array().items(
    Joi.object({
      order: Joi.number(),
      key: Joi.string(),
      label: Joi.string(),
      description: Joi.string().allow(''),
      estimatedDays: Joi.number(),
      required: Joi.boolean(),
    })
  ),
  notes: Joi.string().allow(''),
  lastReviewedAt: Joi.date(),
});
