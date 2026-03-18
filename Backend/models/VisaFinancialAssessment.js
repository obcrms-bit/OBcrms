const mongoose = require('mongoose');

const visaFinancialAssessmentSchema = new mongoose.Schema(
  {
    application: { type: mongoose.Schema.Types.ObjectId, ref: 'VisaApplication', required: true },
    requiredAmount: { type: Number, required: true },
    availableFunds: { type: Number, required: true },
    tuitionDepositStatus: {
      type: String,
      enum: ['pending', 'paid', 'not_required'],
      default: 'pending',
    },
    sponsorDetails: { type: String },
    sourceOfFunds: { type: String },
    livingCostRequirement: { type: Number },
    currency: { type: String, default: 'USD' },
    bankStatements: [{ type: String }],
    affordabilitySummary: { type: String },
    riskFlags: [{ type: String }],
    recommendation: { type: String },
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

module.exports = mongoose.model('VisaFinancialAssessment', visaFinancialAssessmentSchema);
