const mongoose = require('mongoose');

const documentSchema = new mongoose.Schema(
  {
    owner: { type: mongoose.Schema.Types.ObjectId, ref: 'Student' },
    fileName: { type: String, required: true },
    fileType: { type: String },
    fileUrl: { type: String, required: true },
    uploadedAt: { type: Date, default: Date.now },
    uploadedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    version: { type: Number, default: 1 },
    previousVersion: { type: mongoose.Schema.Types.ObjectId, ref: 'Document' },
    comments: { type: String },
  },
  { timestamps: true }
);

documentSchema.index({ owner: 1, fileName: 1 });

module.exports = mongoose.model('Document', documentSchema);
