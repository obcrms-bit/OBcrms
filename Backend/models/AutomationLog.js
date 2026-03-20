const mongoose = require('mongoose');

const automationLogSchema = new mongoose.Schema(
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
    ruleId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'AutomationRule',
      index: true,
    },
    module: {
      type: String,
      trim: true,
      lowercase: true,
    },
    targetId: mongoose.Schema.Types.Mixed,
    status: {
      type: String,
      enum: ['success', 'failure', 'skipped'],
      default: 'success',
    },
    message: {
      type: String,
      trim: true,
    },
    metadata: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
    runAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
    collection: 'automation_logs',
  }
);

automationLogSchema.index({ companyId: 1, runAt: -1 });
automationLogSchema.virtual('tenantId').get(function tenantIdGetter() {
  return this.companyId;
});

module.exports = mongoose.model('AutomationLog', automationLogSchema);
