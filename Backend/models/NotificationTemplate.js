const mongoose = require('mongoose');

const notificationTemplateSchema = new mongoose.Schema(
  {
    companyId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Company',
      index: true,
      default: null,
    },
    scope: {
      type: String,
      enum: ['system', 'tenant'],
      default: 'tenant',
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
    channel: {
      type: String,
      enum: ['email', 'in_app', 'sms', 'whatsapp'],
      default: 'email',
      index: true,
    },
    module: {
      type: String,
      trim: true,
      default: 'crm',
    },
    subject: {
      type: String,
      trim: true,
    },
    body: {
      type: String,
      trim: true,
      default: '',
    },
    variables: {
      type: [String],
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
    metadata: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
  },
  {
    timestamps: true,
    collection: 'notification_templates',
  }
);

notificationTemplateSchema.index({ companyId: 1, key: 1 }, { unique: true, sparse: true });
notificationTemplateSchema.index(
  { scope: 1, key: 1 },
  { unique: true, partialFilterExpression: { scope: 'system' } }
);

module.exports = mongoose.model('NotificationTemplate', notificationTemplateSchema);
