const mongoose = require('mongoose');

const funnelAutomationRuleSchema = new mongoose.Schema(
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
    triggerStageId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'FunnelStage',
      default: null,
      index: true,
    },
    triggerStageKey: {
      type: String,
      trim: true,
      lowercase: true,
      default: '',
      index: true,
    },
    triggerEvent: {
      type: String,
      enum: ['enter_stage', 'exit_stage', 'stale_in_stage'],
      default: 'enter_stage',
      index: true,
    },
    actionType: {
      type: String,
      enum: [
        'assign_user',
        'assign_branch',
        'create_task',
        'create_reminder',
        'send_internal_notification',
        'add_tag',
        'update_sla_status',
      ],
      required: true,
    },
    actionConfig: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
    order: {
      type: Number,
      default: 0,
    },
    active: {
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
    collection: 'funnel_automation_rules',
  }
);

funnelAutomationRuleSchema.index({ companyId: 1, triggerEvent: 1, triggerStageKey: 1, active: 1 });

funnelAutomationRuleSchema.virtual('tenantId').get(function tenantIdGetter() {
  return this.companyId;
});

module.exports = mongoose.model('FunnelAutomationRule', funnelAutomationRuleSchema);
