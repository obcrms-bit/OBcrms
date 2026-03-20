const mongoose = require('mongoose');

const slaConfigSchema = new mongoose.Schema(
  {
    companyId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Company',
      required: true,
      unique: true,
      index: true,
    },
    firstResponseHours: { type: Number, default: 4, min: 1 },
    firstFollowUpHours: { type: Number, default: 8, min: 1 },
    maxHoursBetweenFollowUps: { type: Number, default: 48, min: 1 },
    overdueReminderHours: { type: Number, default: 24, min: 1 },
    transferApprovalHours: { type: Number, default: 24, min: 1 },
    transferApprovalRequired: { type: Boolean, default: false },
    escalationEmails: [{ type: String, trim: true, lowercase: true }],
    isActive: { type: Boolean, default: true },
    metadata: { type: mongoose.Schema.Types.Mixed, default: {} },
  },
  { timestamps: true, collection: 'sla_configs' }
);

module.exports = mongoose.model('SLAConfig', slaConfigSchema);
