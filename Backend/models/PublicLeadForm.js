const mongoose = require('mongoose');

const brandingOverrideSchema = new mongoose.Schema(
  {
    primaryColor: String,
    secondaryColor: String,
    accentColor: String,
    fontFamily: String,
    logo: String,
  },
  { _id: false }
);

const publicLeadFormSchema = new mongoose.Schema(
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
    },
    slug: {
      type: String,
      required: true,
      trim: true,
      lowercase: true,
    },
    title: {
      type: String,
      trim: true,
      default: '',
    },
    description: {
      type: String,
      trim: true,
      default: '',
    },
    visibleFields: {
      type: [String],
      default: ['name', 'email', 'mobile', 'preferredCountries', 'interestedCourse', 'notes'],
    },
    requiredFields: {
      type: [String],
      default: ['name', 'mobile'],
    },
    defaultCountry: {
      type: String,
      trim: true,
      default: '',
    },
    defaultAssignedTo: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    defaultSource: {
      type: String,
      trim: true,
      default: 'website',
    },
    sourceType: {
      type: String,
      enum: ['website_form', 'website_widget', 'qr_form'],
      default: 'website_form',
    },
    sourceLabel: {
      type: String,
      trim: true,
      default: 'Website Form',
    },
    campaignTag: {
      type: String,
      trim: true,
      default: '',
    },
    targetCountries: {
      type: [String],
      default: [],
    },
    thankYouMessage: {
      type: String,
      trim: true,
      default: 'Thank you. Our team will contact you shortly.',
    },
    brandingOverride: {
      type: brandingOverrideSchema,
      default: () => ({}),
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
    collection: 'public_lead_forms',
  }
);

publicLeadFormSchema.index({ companyId: 1, slug: 1 }, { unique: true });
publicLeadFormSchema.virtual('tenantId').get(function tenantIdGetter() {
  return this.companyId;
});

module.exports = mongoose.model('PublicLeadForm', publicLeadFormSchema);
