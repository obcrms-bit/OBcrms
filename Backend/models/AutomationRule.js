const mongoose = require('mongoose');

const conditionSchema = new mongoose.Schema(
  {
    field: { type: String, required: true, trim: true },
    operator: {
      type: String,
      enum: ['equals', 'not_equals', 'includes', 'gt', 'gte', 'lt', 'lte', 'exists'],
      default: 'equals',
    },
    value: mongoose.Schema.Types.Mixed,
  },
  { _id: false }
);

const actionSchema = new mongoose.Schema(
  {
    type: {
      type: String,
      enum: [
        'notify_assignee',
        'notify_branch_manager',
        'tag_lead',
        'set_priority',
        'create_followup',
        'assign_country_counsellor',
      ],
      required: true,
    },
    config: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
  },
  { _id: false }
);

const automationRuleSchema = new mongoose.Schema(
  {
    companyId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Company',
      required: true,
      index: true,
    },
    branchId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Branch',
      default: null,
      index: true,
    },
    name: {
      type: String,
      required: true,
      trim: true,
    },
    key: {
      type: String,
      trim: true,
      lowercase: true,
      index: true,
    },
    module: {
      type: String,
      required: true,
      trim: true,
      lowercase: true,
    },
    triggerEvent: {
      type: String,
      required: true,
      trim: true,
      lowercase: true,
      index: true,
    },
    conditions: {
      type: [conditionSchema],
      default: [],
    },
    actions: {
      type: [actionSchema],
      default: [],
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
    runCount: {
      type: Number,
      default: 0,
    },
    failureCount: {
      type: Number,
      default: 0,
    },
    lastRunAt: {
      type: Date,
      default: null,
    },
    metadata: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
  },
  {
    timestamps: true,
    collection: 'automation_rules',
  }
);

automationRuleSchema.index({ companyId: 1, triggerEvent: 1, isActive: 1 });
automationRuleSchema.index({ companyId: 1, key: 1 }, { unique: true, sparse: true });
automationRuleSchema.virtual('tenantId').get(function tenantIdGetter() {
  return this.companyId;
});

module.exports = mongoose.model('AutomationRule', automationRuleSchema);
