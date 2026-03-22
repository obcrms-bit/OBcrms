const mongoose = require('mongoose');

const leadScoreSchema = new mongoose.Schema(
  {
    companyId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Company',
      required: true,
      index: true,
    },
    leadId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Lead',
      required: true,
      index: true,
    },
    score: {
      type: Number,
      required: true,
      min: 0,
      max: 100,
    },
    label: {
      type: String,
      enum: ['cold', 'warm', 'hot', 'high_intent', 'at_risk'],
      required: true,
    },
    confidence: {
      type: Number,
      min: 0,
      max: 1,
      default: null,
    },
    scoringVersion: {
      type: String,
      trim: true,
      default: 'rule_v1',
    },
    scoringFactors: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
    calculatedAt: {
      type: Date,
      default: Date.now,
      index: true,
    },
  },
  {
    timestamps: true,
    collection: 'lead_scores',
  }
);

leadScoreSchema.index({ companyId: 1, leadId: 1, calculatedAt: -1 });

module.exports = mongoose.model('LeadScore', leadScoreSchema);
