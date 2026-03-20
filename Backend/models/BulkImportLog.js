const mongoose = require('mongoose');

const importErrorSchema = new mongoose.Schema(
  {
    rowNumber: { type: Number },
    message: { type: String, trim: true },
    raw: { type: mongoose.Schema.Types.Mixed },
  },
  { _id: false }
);

const bulkImportLogSchema = new mongoose.Schema(
  {
    companyId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Company',
      required: true,
      index: true,
    },
    branchId: { type: mongoose.Schema.Types.ObjectId, ref: 'Branch', index: true },
    module: {
      type: String,
      enum: ['universities', 'courses', 'leads'],
      required: true,
      index: true,
    },
    mode: { type: String, enum: ['preview', 'execute'], default: 'execute' },
    fileName: { type: String, trim: true },
    status: {
      type: String,
      enum: ['pending', 'completed', 'failed'],
      default: 'pending',
      index: true,
    },
    totalRows: { type: Number, default: 0 },
    successCount: { type: Number, default: 0 },
    failedCount: { type: Number, default: 0 },
    rowErrors: { type: [importErrorSchema], default: [] },
    previewSummary: { type: mongoose.Schema.Types.Mixed, default: {} },
    executedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    metadata: { type: mongoose.Schema.Types.Mixed, default: {} },
  },
  { timestamps: true, collection: 'bulk_import_logs' }
);

bulkImportLogSchema.index({ companyId: 1, module: 1, createdAt: -1 });

module.exports = mongoose.model('BulkImportLog', bulkImportLogSchema);
