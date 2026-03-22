const mongoose = require('mongoose');

const reportListItemSchema = new mongoose.Schema(
  {
    title: { type: String, trim: true },
    description: { type: String, trim: true },
    priority: {
      type: String,
      enum: ['low', 'medium', 'high'],
      default: 'medium',
    },
    impact: { type: String, trim: true },
    metricKey: { type: String, trim: true },
    metricValue: { type: mongoose.Schema.Types.Mixed, default: null },
  },
  { _id: false }
);

const intelligenceReportSchema = new mongoose.Schema(
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
    datasetId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'CompanyIntelligenceDataset',
      required: true,
      index: true,
    },
    title: {
      type: String,
      required: true,
      trim: true,
      maxlength: 180,
    },
    status: {
      type: String,
      enum: ['draft', 'published'],
      default: 'published',
      index: true,
    },
    generatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    branding: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
    companyProfile: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
    metrics: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
    charts: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
    insights: {
      type: [reportListItemSchema],
      default: [],
    },
    operationalGaps: {
      type: [reportListItemSchema],
      default: [],
    },
    opportunities: {
      type: [reportListItemSchema],
      default: [],
    },
    recommendations: {
      type: [reportListItemSchema],
      default: [],
    },
    assistantBrief: {
      type: String,
      default: '',
    },
    shareToken: {
      type: String,
      trim: true,
      unique: true,
      sparse: true,
    },
    shareEnabled: {
      type: Boolean,
      default: true,
      index: true,
    },
    shareExpiresAt: {
      type: Date,
      default: null,
    },
    lastPdfGeneratedAt: {
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
    collection: 'company_intelligence_reports',
  }
);

intelligenceReportSchema.index({ companyId: 1, createdAt: -1 });
intelligenceReportSchema.index({ companyId: 1, datasetId: 1, createdAt: -1 });

intelligenceReportSchema.virtual('tenantId').get(function tenantIdGetter() {
  return this.companyId;
});

module.exports = mongoose.model(
  'CompanyIntelligenceReport',
  intelligenceReportSchema
);
