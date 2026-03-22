const mongoose = require('mongoose');

const assignmentRuleSchema = new mongoose.Schema(
  {
    companyId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Company',
      required: true,
      index: true,
    },
    name: {
      type: String,
      required: true,
      trim: true,
    },
    strategyType: {
      type: String,
      enum: [
        'round_robin',
        'lowest_active_load',
        'best_conversion_history',
        'destination_specialist',
        'branch_default_assignee',
        'priority_queue',
        'country_rule_fallback',
      ],
      required: true,
      index: true,
    },
    ruleConfig: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
    active: {
      type: Boolean,
      default: true,
      index: true,
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
    collection: 'assignment_rules',
  }
);

assignmentRuleSchema.index({ companyId: 1, name: 1 }, { unique: true });

module.exports = mongoose.model('AssignmentRule', assignmentRuleSchema);
