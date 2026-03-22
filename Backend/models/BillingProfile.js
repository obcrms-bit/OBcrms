const mongoose = require('mongoose');

const billingProfileSchema = new mongoose.Schema(
  {
    companyId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Company',
      required: true,
      index: true,
      unique: true,
    },
    billingEmail: {
      type: String,
      trim: true,
      lowercase: true,
    },
    currency: {
      type: String,
      trim: true,
      uppercase: true,
      default: 'USD',
    },
    billingCycle: {
      type: String,
      enum: ['monthly', 'quarterly', 'yearly'],
      default: 'monthly',
    },
    paymentTermsDays: {
      type: Number,
      default: 30,
    },
    status: {
      type: String,
      enum: ['draft', 'active', 'past_due', 'suspended'],
      default: 'draft',
    },
    taxId: {
      type: String,
      trim: true,
    },
    address: {
      type: String,
      trim: true,
    },
    metadata: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
  },
  {
    timestamps: true,
    collection: 'billing_profiles',
  }
);

billingProfileSchema.virtual('tenantId').get(function tenantIdGetter() {
  return this.companyId;
});

module.exports = mongoose.model('BillingProfile', billingProfileSchema);
