const mongoose = require('mongoose');

const requiredActionsSchema = new mongoose.Schema(
  {
    noteRequired: { type: Boolean, default: false },
    followUpRequired: { type: Boolean, default: false },
    documentChecklistRequired: { type: Boolean, default: false },
    assigneeRequired: { type: Boolean, default: false },
    branchRequired: { type: Boolean, default: false },
    lostReasonRequired: { type: Boolean, default: false },
    conversionMetadataRequired: { type: Boolean, default: false },
  },
  { _id: false }
);

const funnelStageSchema = new mongoose.Schema(
  {
    companyId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Company',
      required: true,
      index: true,
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
    order: {
      type: Number,
      default: 0,
      index: true,
    },
    color: {
      type: String,
      trim: true,
      default: '#1d4ed8',
    },
    stageType: {
      type: String,
      enum: ['lead', 'follow_up', 'application', 'visa', 'won', 'lost', 'closed'],
      default: 'lead',
    },
    isTerminal: {
      type: Boolean,
      default: false,
    },
    isWon: {
      type: Boolean,
      default: false,
    },
    isLost: {
      type: Boolean,
      default: false,
    },
    probability: {
      type: Number,
      min: 0,
      max: 100,
      default: null,
    },
    slaHours: {
      type: Number,
      min: 0,
      default: null,
    },
    requiredActions: {
      type: requiredActionsSchema,
      default: () => ({}),
    },
    visibleBranchIds: {
      type: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Branch' }],
      default: [],
    },
    allowedRoleKeys: {
      type: [String],
      default: [],
    },
    isSystem: {
      type: Boolean,
      default: false,
    },
    isActive: {
      type: Boolean,
      default: true,
      index: true,
    },
    metadata: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
  },
  {
    timestamps: true,
    collection: 'funnel_stages',
  }
);

funnelStageSchema.index({ companyId: 1, key: 1 }, { unique: true });
funnelStageSchema.index({ companyId: 1, order: 1, isActive: 1 });

funnelStageSchema.virtual('tenantId').get(function tenantIdGetter() {
  return this.companyId;
});

module.exports = mongoose.model('FunnelStage', funnelStageSchema);
