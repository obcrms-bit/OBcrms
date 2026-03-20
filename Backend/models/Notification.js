const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema(
  {
    companyId: { type: mongoose.Schema.Types.ObjectId, ref: 'Company', index: true },
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    type: { type: String, enum: ['visa', 'crm', 'system', 'reminder'], default: 'system' },
    title: { type: String, required: true },
    message: { type: String, required: true },
    entityType: { type: String, trim: true },
    entityId: { type: mongoose.Schema.Types.ObjectId },
    link: { type: String, trim: true },
    metadata: { type: mongoose.Schema.Types.Mixed },
    read: { type: Boolean, default: false },
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

notificationSchema.index({ user: 1, read: 1 });
notificationSchema.index({ companyId: 1, type: 1, createdAt: -1 });

module.exports = mongoose.model('Notification', notificationSchema);
