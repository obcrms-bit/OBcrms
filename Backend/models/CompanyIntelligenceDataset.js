const mongoose = require('mongoose');

const fieldMappingSchema = new mongoose.Schema(
  {
    sourceField: { type: String, required: true, trim: true },
    normalizedField: { type: String, trim: true },
    mappedField: { type: String, trim: true },
    inferredType: { type: String, trim: true },
    confidence: { type: Number, default: 0 },
    coverage: { type: Number, default: 0 },
    examples: [{ type: String }],
  },
  { _id: false }
);

const issueSchema = new mongoose.Schema(
  {
    level: {
      type: String,
      enum: ['info', 'warning', 'error'],
      default: 'info',
    },
    code: { type: String, trim: true },
    message: { type: String, trim: true },
    field: { type: String, trim: true },
    count: { type: Number, default: 0 },
    metadata: { type: mongoose.Schema.Types.Mixed, default: {} },
  },
  { _id: false }
);

const intelligenceDatasetSchema = new mongoose.Schema(
  {
    companyId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Company',
      required: true,
      index: true,
    },
    branchId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Branch',
      default: null,
      index: true,
    },
    name: {
      type: String,
      required: true,
      trim: true,
      maxlength: 180,
    },
    sourceType: {
      type: String,
      enum: ['csv', 'xlsx', 'ods', 'json', 'pdf'],
      required: true,
      index: true,
    },
    status: {
      type: String,
      enum: ['uploaded', 'parsed', 'analyzed', 'failed'],
      default: 'uploaded',
      index: true,
    },
    originalFileName: {
      type: String,
      required: true,
      trim: true,
    },
    mimeType: {
      type: String,
      trim: true,
    },
    fileSize: {
      type: Number,
      default: 0,
    },
    uploadedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    datasetTypes: {
      type: [String],
      default: [],
      index: true,
    },
    detectedSchema: {
      type: [fieldMappingSchema],
      default: [],
    },
    previewColumns: {
      type: [String],
      default: [],
    },
    previewRows: {
      type: [mongoose.Schema.Types.Mixed],
      default: [],
    },
    normalizedRecords: {
      type: [mongoose.Schema.Types.Mixed],
      default: [],
    },
    rawExtract: {
      text: { type: String, default: '' },
      headers: { type: [String], default: [] },
    },
    quality: {
      completenessRate: { type: Number, default: 0 },
      duplicateCount: { type: Number, default: 0 },
      blankRowCount: { type: Number, default: 0 },
      inconsistentFieldCount: { type: Number, default: 0 },
      missingValueCounts: { type: mongoose.Schema.Types.Mixed, default: {} },
      inferredFields: { type: [String], default: [] },
      issues: {
        type: [issueSchema],
        default: [],
      },
    },
    metrics: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
    insightsSnapshot: {
      companyProfile: { type: mongoose.Schema.Types.Mixed, default: {} },
      operationalGaps: { type: [mongoose.Schema.Types.Mixed], default: [] },
      opportunities: { type: [mongoose.Schema.Types.Mixed], default: [] },
      insights: { type: [mongoose.Schema.Types.Mixed], default: [] },
      recommendations: { type: [mongoose.Schema.Types.Mixed], default: [] },
      charts: { type: mongoose.Schema.Types.Mixed, default: {} },
      assistantBrief: { type: String, default: '' },
    },
    rowCount: {
      type: Number,
      default: 0,
    },
    cleanedRowCount: {
      type: Number,
      default: 0,
    },
    analyzedAt: {
      type: Date,
      default: null,
    },
    deletedAt: {
      type: Date,
      default: null,
      index: true,
    },
  },
  {
    timestamps: true,
    collection: 'company_intelligence_datasets',
  }
);

intelligenceDatasetSchema.index({ companyId: 1, createdAt: -1 });
intelligenceDatasetSchema.index({ companyId: 1, branchId: 1, createdAt: -1 });

intelligenceDatasetSchema.virtual('tenantId').get(function tenantIdGetter() {
  return this.companyId;
});

module.exports = mongoose.model(
  'CompanyIntelligenceDataset',
  intelligenceDatasetSchema
);
