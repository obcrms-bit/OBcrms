const mongoose = require('mongoose');

const universitySchema = new mongoose.Schema(
  {
    companyId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Company',
      required: true,
      index: true,
    },
    name: { type: String, required: true, trim: true },
    code: { type: String, trim: true, uppercase: true },
    country: { type: String, required: true, trim: true },
    city: { type: String, trim: true },
    website: { type: String, trim: true },
    intakeMonths: [{ type: String, trim: true }],
    scholarshipInfo: { type: String, trim: true },
    englishRequirements: { type: String, trim: true },
    notes: { type: String, trim: true },
    isActive: { type: Boolean, default: true, index: true },
    tags: [{ type: String, trim: true }],
    metadata: { type: mongoose.Schema.Types.Mixed, default: {} },
  },
  { timestamps: true, collection: 'universities' }
);

universitySchema.index({ companyId: 1, name: 1, country: 1 }, { unique: true });
universitySchema.index({ companyId: 1, country: 1, isActive: 1 });

module.exports = mongoose.model('University', universitySchema);
