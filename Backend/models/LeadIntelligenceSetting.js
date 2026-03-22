const mongoose = require('mongoose');

const leadIntelligenceSettingSchema = new mongoose.Schema(
  {
    companyId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Company',
      required: true,
      unique: true,
      index: true,
    },
    scoringVersion: {
      type: String,
      trim: true,
      default: 'rule_v1',
    },
    scoringWeights: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
    sourceWeights: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
    priorityThresholds: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
    temperatureThresholds: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
    autoAssignmentMode: {
      type: String,
      enum: ['manual', 'approval', 'automatic'],
      default: 'approval',
    },
    branchRoutingMode: {
      type: String,
      enum: ['manual', 'approval', 'automatic'],
      default: 'approval',
    },
    recommendationMode: {
      type: String,
      enum: ['manual', 'approval', 'automatic'],
      default: 'manual',
    },
    explainabilityVisible: {
      type: Boolean,
      default: true,
    },
    autoReassignOnCountryChange: {
      type: Boolean,
      default: false,
    },
    allowCountryRuleOverwrite: {
      type: Boolean,
      default: false,
    },
    staleLeadDays: {
      type: Number,
      default: 10,
      min: 1,
    },
    reactivationWindowDays: {
      type: Number,
      default: 21,
      min: 1,
    },
    fallbackAssignmentStrategy: {
      type: String,
      enum: [
        'round_robin',
        'lowest_active_load',
        'best_conversion_history',
        'destination_specialist',
        'branch_default_assignee',
        'priority_queue',
        'manual',
      ],
      default: 'lowest_active_load',
    },
    fallbackBranchRoutingStrategy: {
      type: String,
      enum: ['country_rule', 'best_conversion_history', 'lowest_backlog', 'manual'],
      default: 'best_conversion_history',
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    updatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    metadata: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
  },
  {
    timestamps: true,
    collection: 'lead_intelligence_settings',
  }
);

module.exports = mongoose.model('LeadIntelligenceSetting', leadIntelligenceSettingSchema);
