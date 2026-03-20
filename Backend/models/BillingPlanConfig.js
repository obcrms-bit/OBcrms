const mongoose = require('mongoose');

const billingPlanConfigSchema = new mongoose.Schema(
  {
    key: {
      type: String,
      required: true,
      trim: true,
      lowercase: true,
      unique: true,
      index: true,
    },
    name: {
      type: String,
      required: true,
      trim: true,
    },
    description: {
      type: String,
      trim: true,
    },
    priceMonthly: {
      type: Number,
      default: 0,
    },
    priceYearly: {
      type: Number,
      default: 0,
    },
    userLimit: {
      type: Number,
      default: 10,
    },
    branchLimit: {
      type: Number,
      default: 2,
    },
    featureAccess: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
    isDefault: {
      type: Boolean,
      default: false,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    sortOrder: {
      type: Number,
      default: 0,
    },
    metadata: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
  },
  {
    timestamps: true,
    collection: 'billing_plan_configs',
  }
);

module.exports = mongoose.model('BillingPlanConfig', billingPlanConfigSchema);
