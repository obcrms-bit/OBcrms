const mongoose = require('mongoose');

const onboardingImportRowSchema = new mongoose.Schema(
  {
    batchId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'OnboardingBatch',
      required: true,
      index: true,
    },
    section: {
      type: String,
      required: true,
      trim: true,
      lowercase: true,
      index: true,
    },
    rowNumber: {
      type: Number,
      required: true,
    },
    status: {
      type: String,
      enum: ['valid', 'warning', 'error'],
      default: 'valid',
      index: true,
    },
    rawData: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
    normalizedData: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
    errors: {
      type: [String],
      default: [],
    },
    warnings: {
      type: [String],
      default: [],
    },
  },
  {
    timestamps: true,
    collection: 'onboarding_import_rows',
  }
);

onboardingImportRowSchema.index({ batchId: 1, section: 1, rowNumber: 1 }, { unique: true });

module.exports = mongoose.model('OnboardingImportRow', onboardingImportRowSchema);
