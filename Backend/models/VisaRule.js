const mongoose = require('mongoose');

const documentRequirementSchema = new mongoose.Schema({
  name: { type: String, required: true },
  description: { type: String },
  required: { type: Boolean, default: true },
  category: {
    type: String,
    enum: [
      'identity',
      'financial',
      'academic',
      'language',
      'medical',
      'travel',
      'employment',
      'other',
    ],
    default: 'other',
  },
  notes: { type: String },
});

const financialRuleSchema = new mongoose.Schema({
  currency: { type: String, default: 'USD' },
  maintenanceFundsRequired: { type: Number, default: 0 },
  maintenanceFundsDescription: { type: String },
  tuitionDepositRequired: { type: Boolean, default: false },
  livingCostPerMonth: { type: Number, default: 0 },
  durationMonths: { type: Number, default: 12 },
  specialRequirements: [{ type: String }], // e.g. GIC, blocked account
  blockedAccountRequired: { type: Boolean, default: false },
  blockedAccountAmount: { type: Number, default: 0 },
  gicRequired: { type: Boolean, default: false },
  gicAmount: { type: Number, default: 0 },
  sdsAvailable: { type: Boolean, default: false },
  oshcRequired: { type: Boolean, default: false },
  oshcCostPerYear: { type: Number, default: 0 },
  ihsRequired: { type: Boolean, default: false },
  ihsCostPerYear: { type: Number, default: 0 },
});

const languageRuleSchema = new mongoose.Schema({
  minIeltsOverall: { type: Number },
  minIeltsBand: { type: Number },
  minPteOverall: { type: Number },
  minToeflOverall: { type: Number },
  minDuolingoScore: { type: Number },
  acceptedTests: [{ type: String }],
  waiverConditions: [{ type: String }],
  notes: { type: String },
});

const visaRuleSchema = new mongoose.Schema(
  {
    country: { type: String, required: true, trim: true },
    countryCode: { type: String, required: true, uppercase: true, trim: true, index: true },
    visaType: {
      type: String,
      enum: [
        'student',
        'tier4',
        'f1',
        'm1',
        'study_permit',
        'student_visa',
        'national_visa',
        'other',
      ],
      default: 'student',
    },
    studyLevel: [{ type: String }], // bachelor, master, phd, etc.
    embassy: { type: String },
    processingCenter: { type: String },
    flagEmoji: { type: String },
    isActive: { type: Boolean, default: true },

    // Documents
    requiredDocuments: [documentRequirementSchema],
    optionalDocuments: [documentRequirementSchema],

    // Financial
    financialRequirements: { type: financialRuleSchema, default: () => ({}) },

    // Language
    languageRequirements: { type: languageRuleSchema, default: () => ({}) },

    // Requirements
    biometricRequired: { type: Boolean, default: false },
    interviewRequired: { type: Boolean, default: false },
    medicalRequired: { type: Boolean, default: false },
    policeClearanceRequired: { type: Boolean, default: false },
    apsRequired: { type: Boolean, default: false }, // Germany: Akademische Prüfstelle

    // Country-specific flags
    casRequired: { type: Boolean, default: false }, // UK
    i20Required: { type: Boolean, default: false }, // USA
    ds160Required: { type: Boolean, default: false }, // USA
    sevisFeeRequired: { type: Boolean, default: false }, // USA
    sevisFeeAmount: { type: Number, default: 0 },
    loaRequired: { type: Boolean, default: false }, // Canada
    coeRequired: { type: Boolean, default: false }, // Australia
    tbTestRequired: { type: Boolean, default: false }, // UK (certain countries)

    // Fees
    visaFee: { type: Number, default: 0 },
    visaFeeCurrency: { type: String, default: 'USD' },
    surchargeFee: { type: Number, default: 0 }, // e.g. IHS UK
    surchargeCurrency: { type: String, default: 'GBP' },

    // Timing
    processingTimeWeeksMin: { type: Number, default: 3 },
    processingTimeWeeksMax: { type: Number, default: 8 },

    // Age conditions
    ageConditions: [
      {
        condition: { type: String },
        minAge: { type: Number },
        maxAge: { type: Number },
        note: { type: String },
      },
    ],

    // Dependent rules
    dependentRules: {
      allowed: { type: Boolean, default: false },
      conditions: [{ type: String }],
      financialRequirement: { type: Number, default: 0 },
    },

    // Rejection reasons catalog
    rejectionReasonsCatalog: [{ type: String }],

    // Pre-departure checklist template
    preDepartureChecklist: [{ type: String }],

    // Workflow milestones for this country (ordered)
    workflowMilestones: [
      {
        order: { type: Number },
        key: { type: String }, // e.g. "cas_received"
        label: { type: String },
        description: { type: String },
        estimatedDays: { type: Number },
        required: { type: Boolean, default: true },
      },
    ],

    notes: { type: String },
    lastReviewedAt: { type: Date },
  },
  { timestamps: true }
);

visaRuleSchema.index({ countryCode: 1, visaType: 1 }, { unique: true });

module.exports = mongoose.model('VisaRule', visaRuleSchema);
