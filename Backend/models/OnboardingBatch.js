const mongoose = require('mongoose');

const onboardingBatchSchema = new mongoose.Schema(
  {
    fileName: {
      type: String,
      required: true,
      trim: true,
    },
    fileType: {
      type: String,
      trim: true,
      lowercase: true,
    },
    status: {
      type: String,
      enum: ['uploaded', 'validated', 'imported', 'failed'],
      default: 'uploaded',
      index: true,
    },
    completionPercentage: {
      type: Number,
      default: 0,
    },
    summary: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
    validation: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
    previewSnapshot: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
    importedTenantId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Company',
      default: null,
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    metadata: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
  },
  {
    timestamps: true,
    collection: 'onboarding_batches',
  }
);

module.exports = mongoose.model('OnboardingBatch', onboardingBatchSchema);
