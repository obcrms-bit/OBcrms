const mongoose = require('mongoose');

const dashboardConfigSchema = new mongoose.Schema(
  {
    companyId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Company',
      index: true,
      default: null,
    },
    branchId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Branch',
      default: null,
    },
    scope: {
      type: String,
      enum: ['system', 'tenant', 'role', 'branch', 'template'],
      default: 'tenant',
      index: true,
    },
    key: {
      type: String,
      required: true,
      trim: true,
      lowercase: true,
      index: true,
    },
    name: {
      type: String,
      required: true,
      trim: true,
    },
    roleKey: {
      type: String,
      trim: true,
      lowercase: true,
    },
    widgets: {
      type: [mongoose.Schema.Types.Mixed],
      default: [],
    },
    navigation: {
      type: [mongoose.Schema.Types.Mixed],
      default: [],
    },
    filters: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    updatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    metadata: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
  },
  {
    timestamps: true,
    collection: 'dashboard_configs',
  }
);

dashboardConfigSchema.index({ companyId: 1, scope: 1, key: 1 }, { unique: true, sparse: true });

module.exports = mongoose.model('DashboardConfig', dashboardConfigSchema);
