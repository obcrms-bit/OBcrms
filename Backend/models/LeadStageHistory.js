const mongoose = require('mongoose');

const leadStageHistorySchema = new mongoose.Schema(
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
    fromStageId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'FunnelStage',
      default: null,
    },
    toStageId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'FunnelStage',
      required: true,
    },
    fromStageKey: {
      type: String,
      trim: true,
      default: '',
    },
    toStageKey: {
      type: String,
      trim: true,
      required: true,
    },
    movedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    movedAt: {
      type: Date,
      default: Date.now,
      index: true,
    },
    reason: {
      type: String,
      trim: true,
      default: '',
    },
    notes: {
      type: String,
      trim: true,
      default: '',
    },
    branchId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Branch',
      default: null,
    },
    metadata: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
  },
  {
    timestamps: true,
    collection: 'lead_stage_history',
  }
);

leadStageHistorySchema.index({ companyId: 1, leadId: 1, movedAt: -1 });
leadStageHistorySchema.index({ companyId: 1, toStageKey: 1, movedAt: -1 });

leadStageHistorySchema.virtual('tenantId').get(function tenantIdGetter() {
  return this.companyId;
});

module.exports = mongoose.model('LeadStageHistory', leadStageHistorySchema);
