const mongoose = require('mongoose');

const websiteIntegrationSettingSchema = new mongoose.Schema(
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
      index: true,
      default: null,
    },
    formId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'PublicLeadForm',
    },
    widgetType: {
      type: String,
      enum: ['inline_form', 'popup_form', 'floating_button', 'country_form', 'counsellor_widget'],
      default: 'inline_form',
    },
    embedMode: {
      type: String,
      enum: ['iframe', 'script', 'hosted_url', 'popup'],
      default: 'iframe',
    },
    targetCountries: {
      type: [String],
      default: [],
    },
    defaultAssignedTo: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    defaultBranchId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Branch',
    },
    sourceLabel: {
      type: String,
      trim: true,
      default: 'Website',
    },
    campaignTag: {
      type: String,
      trim: true,
      default: '',
    },
    allowedDomains: {
      type: [String],
      default: [],
    },
    webhookUrl: {
      type: String,
      trim: true,
      default: '',
    },
    themeMode: {
      type: String,
      enum: ['tenant', 'branch', 'light', 'dark'],
      default: 'tenant',
    },
    widgetConfig: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
    embedSnippet: {
      type: String,
      trim: true,
      default: '',
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    analytics: {
      views: { type: Number, default: 0 },
      submissions: { type: Number, default: 0 },
      lastSubmittedAt: { type: Date, default: null },
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    updatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
  },
  {
    timestamps: true,
    collection: 'website_integration_settings',
  }
);

websiteIntegrationSettingSchema.index({ companyId: 1, branchId: 1, widgetType: 1 });
websiteIntegrationSettingSchema.virtual('tenantId').get(function tenantIdGetter() {
  return this.companyId;
});

module.exports = mongoose.model('WebsiteIntegrationSetting', websiteIntegrationSettingSchema);
