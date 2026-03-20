const mongoose = require('mongoose');

const assignmentRuleConfigSchema = new mongoose.Schema(
  {
    companyId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Company',
      index: true,
      default: null,
    },
    branchId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Branch',
      default: null,
    },
    key: {
      type: String,
      required: true,
      trim: true,
      lowercase: true,
      index: true,
    },
    name: {
      type: String,
      required: true,
      trim: true,
    },
    country: {
      type: String,
      trim: true,
    },
    strategy: {
      type: String,
      enum: ['country_match', 'branch_match', 'least_workload', 'round_robin', 'manual'],
      default: 'country_match',
    },
    conditions: {
      type: [mongoose.Schema.Types.Mixed],
      default: [],
    },
    actions: {
      type: [mongoose.Schema.Types.Mixed],
      default: [],
    },
    defaultAssigneeId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    isActive: {
      type: Boolean,
      default: true,
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
    collection: 'assignment_rule_configs',
  }
);

assignmentRuleConfigSchema.index({ companyId: 1, key: 1 }, { unique: true, sparse: true });

module.exports = mongoose.model('AssignmentRuleConfig', assignmentRuleConfigSchema);
