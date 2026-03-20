const mongoose = require('mongoose');

const stageSchema = new mongoose.Schema(
  {
    key: { type: String, required: true, trim: true, lowercase: true },
    label: { type: String, required: true, trim: true },
    order: { type: Number, default: 0 },
  },
  { _id: false }
);

const checklistSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    required: { type: Boolean, default: true },
    description: { type: String, trim: true },
  },
  { _id: false }
);

const countryWorkflowSchema = new mongoose.Schema(
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
      index: true,
    },
    country: { type: String, required: true, trim: true },
    leadStages: { type: [stageSchema], default: [] },
    applicationStages: { type: [stageSchema], default: [] },
    documentChecklist: { type: [checklistSchema], default: [] },
    followUpRules: {
      initialHours: { type: Number, default: 8 },
      recurringHours: { type: Number, default: 48 },
      overdueReminderHours: { type: Number, default: 24 },
      cadenceLabel: { type: String, trim: true },
    },
    slaRules: {
      firstResponseHours: { type: Number, default: 4 },
      firstFollowUpHours: { type: Number, default: 8 },
      offerDecisionHours: { type: Number, default: 72 },
    },
    isActive: { type: Boolean, default: true },
    metadata: { type: mongoose.Schema.Types.Mixed, default: {} },
  },
  { timestamps: true, collection: 'country_workflows' }
);

countryWorkflowSchema.index({ companyId: 1, country: 1 }, { unique: true });
countryWorkflowSchema.virtual('tenantId').get(function tenantIdGetter() {
  return this.companyId;
});

module.exports = mongoose.model('CountryWorkflow', countryWorkflowSchema);
