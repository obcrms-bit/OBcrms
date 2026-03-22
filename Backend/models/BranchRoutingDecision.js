const mongoose = require('mongoose');

const branchRoutingDecisionSchema = new mongoose.Schema(
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
    recommendedBranchId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Branch',
      required: true,
    },
    routingReason: {
      type: String,
      required: true,
      trim: true,
    },
    accepted: {
      type: Boolean,
      default: null,
    },
    acceptedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    createdAt: {
      type: Date,
      default: Date.now,
      index: true,
    },
    metadata: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
  },
  {
    timestamps: false,
    collection: 'branch_routing_decisions',
  }
);

branchRoutingDecisionSchema.index({ companyId: 1, leadId: 1, createdAt: -1 });

module.exports = mongoose.model('BranchRoutingDecision', branchRoutingDecisionSchema);
