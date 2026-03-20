const mongoose = require('mongoose');

const usageSchema = new mongoose.Schema(
  {
    activeUsers: { type: Number, default: 0 },
    branches: { type: Number, default: 0 },
    apiCallsThisMonth: { type: Number, default: 0 },
    leadsThisMonth: { type: Number, default: 0 },
  },
  { _id: false }
);

const subscriptionSchema = new mongoose.Schema(
  {
    companyId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Company',
      required: true,
      unique: true,
      index: true,
    },
    plan: {
      type: String,
      enum: ['starter', 'growth', 'enterprise'],
      default: 'starter',
      index: true,
    },
    userLimit: { type: Number, default: 10 },
    branchLimit: { type: Number, default: 2 },
    status: {
      type: String,
      enum: ['trial', 'active', 'past_due', 'inactive', 'cancelled'],
      default: 'trial',
      index: true,
    },
    billingCycle: {
      type: String,
      enum: ['monthly', 'yearly'],
      default: 'monthly',
    },
    featureAccess: {
      transfers: { type: Boolean, default: true },
      commissions: { type: Boolean, default: true },
      reports: { type: Boolean, default: true },
      bulkImports: { type: Boolean, default: false },
      advancedWorkflows: { type: Boolean, default: false },
      notifications: { type: Boolean, default: true },
      customBranding: { type: Boolean, default: false },
      automations: { type: Boolean, default: false },
      publicForms: { type: Boolean, default: true },
      websiteIntegration: { type: Boolean, default: true },
      qrForms: { type: Boolean, default: false },
      billing: { type: Boolean, default: true },
      stripeReady: { type: Boolean, default: false },
    },
    provider: { type: String, default: 'manual' },
    providerCustomerId: { type: String, trim: true },
    providerSubscriptionId: { type: String, trim: true },
    currentPeriodStart: { type: Date, default: Date.now },
    currentPeriodEnd: { type: Date },
    nextInvoiceDate: { type: Date },
    paymentHistory: {
      type: [
        {
          amount: Number,
          currency: { type: String, default: 'USD' },
          status: {
            type: String,
            enum: ['draft', 'due', 'paid', 'failed', 'void'],
            default: 'draft',
          },
          invoiceNumber: String,
          providerInvoiceId: String,
          hostedInvoiceUrl: String,
          dueAt: Date,
          paidAt: Date,
          notes: String,
        },
      ],
      default: [],
    },
    usage: { type: usageSchema, default: () => ({}) },
    metadata: { type: mongoose.Schema.Types.Mixed, default: {} },
  },
  { timestamps: true, collection: 'subscriptions' }
);

subscriptionSchema.virtual('tenantId').get(function tenantIdGetter() {
  return this.companyId;
});

module.exports = mongoose.model('Subscription', subscriptionSchema);
