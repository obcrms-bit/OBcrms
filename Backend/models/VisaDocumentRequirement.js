const mongoose = require('mongoose');

const visaDocumentRequirementSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    description: { type: String },
    required: { type: Boolean, default: true },
    submitted: { type: Boolean, default: false },
    verified: { type: Boolean, default: false },
    rejected: { type: Boolean, default: false },
    expiryDate: { type: Date },
    comments: { type: String },
    file: { type: mongoose.Schema.Types.ObjectId, ref: 'Document' },
    owner: { type: mongoose.Schema.Types.ObjectId, ref: 'Student' },
    versionHistory: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Document' }],
    aiIssueFlag: { type: Boolean, default: false },
    missing: { type: Boolean, default: false },
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

module.exports = mongoose.model('VisaDocumentRequirement', visaDocumentRequirementSchema);
