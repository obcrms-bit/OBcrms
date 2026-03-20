const mongoose = require('mongoose');

const branchSchema = new mongoose.Schema(
  {
    companyId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Company',
      required: [true, 'Company ID is required'],
      index: true,
    },
    name: {
      type: String,
      required: [true, 'Branch name is required'],
      trim: true,
    },
    code: {
      type: String,
      trim: true,
      uppercase: true,
    },
    location: String,
    city: { type: String, trim: true },
    state: { type: String, trim: true },
    country: { type: String, trim: true },
    contactNumber: String,
    email: { type: String, trim: true, lowercase: true },
    address: { type: String, trim: true },
    managerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    isHeadOffice: {
      type: Boolean,
      default: false,
      index: true,
    },
    visibility: {
      type: String,
      enum: ['branch', 'tenant'],
      default: 'branch',
    },
    allowedViewerBranchIds: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Branch',
      },
    ],
    isActive: {
      type: Boolean,
      default: true,
    },
    metadata: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
    branding: {
      inheritFromTenant: {
        type: Boolean,
        default: true,
      },
      branchName: { type: String, trim: true },
      logo: { type: String, trim: true },
      favicon: { type: String, trim: true },
      primaryColor: { type: String, trim: true },
      secondaryColor: { type: String, trim: true },
      accentColor: { type: String, trim: true },
      fontFamily: { type: String, trim: true },
      loginHeading: { type: String, trim: true },
      loginSubheading: { type: String, trim: true },
    },
    deletedAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

branchSchema.index({ companyId: 1, name: 1 }, { unique: true });
branchSchema.index({ companyId: 1, code: 1 }, { unique: true, sparse: true });

branchSchema.virtual('tenantId').get(function tenantIdGetter() {
  return this.companyId;
});

module.exports = mongoose.model('Branch', branchSchema);
