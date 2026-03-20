const mongoose = require('mongoose');

const courseSchema = new mongoose.Schema(
  {
    companyId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Company',
      required: true,
      index: true,
    },
    universityId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'University',
      required: true,
      index: true,
    },
    name: { type: String, required: true, trim: true },
    level: { type: String, trim: true },
    discipline: { type: String, trim: true },
    duration: { type: String, trim: true },
    feeAmount: { type: Number, min: 0 },
    currency: { type: String, trim: true, uppercase: true, default: 'USD' },
    intakeMonths: [{ type: String, trim: true }],
    englishRequirement: { type: String, trim: true },
    scholarshipAvailable: { type: Boolean, default: false },
    budgetBand: { type: String, trim: true },
    country: { type: String, trim: true },
    campus: { type: String, trim: true },
    keywords: [{ type: String, trim: true }],
    isActive: { type: Boolean, default: true, index: true },
    metadata: { type: mongoose.Schema.Types.Mixed, default: {} },
  },
  { timestamps: true, collection: 'courses' }
);

courseSchema.index({ companyId: 1, universityId: 1, name: 1, level: 1 }, { unique: true });
courseSchema.index({ companyId: 1, country: 1, discipline: 1, isActive: 1 });

module.exports = mongoose.model('Course', courseSchema);
