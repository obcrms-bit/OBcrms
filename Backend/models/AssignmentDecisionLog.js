const mongoose = require('mongoose');

const assignmentDecisionLogSchema = new mongoose.Schema(
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
    triggerType: {
      type: String,
      enum: ['country_selected', 'country_changed', 'manual_override', 'fallback_rule', 'ai_refresh'],
      default: 'ai_refresh',
      index: true,
    },
    assignedUserId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    assignedBranchId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Branch',
      default: null,
    },
    assignedUserIds: {
      type: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
      default: [],
    },
    strategyUsed: {
      type: String,
      required: true,
      trim: true,
    },
    decisionReason: {
      type: String,
      required: true,
      trim: true,
    },
    metadata: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
    createdAt: {
      type: Date,
      default: Date.now,
      index: true,
    },
  },
  {
    timestamps: false,
    collection: 'assignment_decision_logs',
  }
);

assignmentDecisionLogSchema.index({ companyId: 1, leadId: 1, createdAt: -1 });

module.exports = mongoose.model('AssignmentDecisionLog', assignmentDecisionLogSchema);
