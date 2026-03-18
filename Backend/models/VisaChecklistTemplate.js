const mongoose = require('mongoose');

const visaChecklistTemplateSchema = new mongoose.Schema(
  {
    country: { type: String, required: true },
    visaType: { type: String, required: true },
    studyLevel: { type: String },
    items: [{ type: mongoose.Schema.Types.ObjectId, ref: 'VisaDocumentRequirement' }],
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

visaChecklistTemplateSchema.index({ country: 1, visaType: 1, studyLevel: 1 }, { unique: true });

module.exports = mongoose.model('VisaChecklistTemplate', visaChecklistTemplateSchema);
