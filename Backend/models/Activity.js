const mongoose = require('mongoose');

const activitySchema = new mongoose.Schema(
  {
    companyId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Company',
      required: true,
      index: true,
    },
    module: { type: String, enum: ['crm', 'visa', 'invoice', 'system'], required: true },
    entityType: { type: String, required: true }, // "lead", "visa_application", etc.
    entityId: { type: mongoose.Schema.Types.ObjectId, required: true, index: true },
    action: { type: String, required: true },
    description: { type: String },
    performedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    performedByName: { type: String },
    before: { type: mongoose.Schema.Types.Mixed },
    after: { type: mongoose.Schema.Types.Mixed },
    metadata: { type: mongoose.Schema.Types.Mixed },
    ipAddress: { type: String },
    userAgent: { type: String },
  },
  { timestamps: true }
);

activitySchema.index({ entityType: 1, entityId: 1, createdAt: -1 });
activitySchema.index({ companyId: 1, createdAt: -1 });

module.exports = mongoose.model('Activity', activitySchema);
