const Company = require('../models/Company');
const Branch = require('../models/Branch');
const Subscription = require('../models/Subscription');
const User = require('../models/User');

const PLAN_CONFIG = {
  starter: {
    userLimit: 10,
    branchLimit: 2,
    featureAccess: {
      transfers: true,
      commissions: true,
      reports: true,
      bulkImports: false,
      advancedWorkflows: false,
      notifications: true,
      customBranding: false,
      automations: false,
      publicForms: true,
      websiteIntegration: true,
      qrForms: false,
      billing: true,
      stripeReady: false,
    },
  },
  growth: {
    userLimit: 35,
    branchLimit: 8,
    featureAccess: {
      transfers: true,
      commissions: true,
      reports: true,
      bulkImports: true,
      advancedWorkflows: true,
      notifications: true,
      customBranding: true,
      automations: true,
      publicForms: true,
      websiteIntegration: true,
      qrForms: true,
      billing: true,
      stripeReady: true,
    },
  },
  enterprise: {
    userLimit: 250,
    branchLimit: 50,
    featureAccess: {
      transfers: true,
      commissions: true,
      reports: true,
      bulkImports: true,
      advancedWorkflows: true,
      notifications: true,
      customBranding: true,
      automations: true,
      publicForms: true,
      websiteIntegration: true,
      qrForms: true,
      billing: true,
      stripeReady: true,
    },
  },
};

const getPlanConfig = (plan = 'starter') => PLAN_CONFIG[plan] || PLAN_CONFIG.starter;

const ensureTenantSubscription = async (companyId) => {
  let subscription = await Subscription.findOne({ companyId });
  if (subscription) {
    return subscription;
  }

  const company = await Company.findById(companyId).lean();
  const plan = company?.subscription?.plan === 'enterprise'
    ? 'enterprise'
    : company?.subscription?.plan === 'professional'
      ? 'growth'
      : company?.subscription?.plan === 'small'
        ? 'growth'
        : 'starter';
  const planConfig = getPlanConfig(plan);

  subscription = await Subscription.create({
    companyId,
    plan,
    userLimit: company?.limits?.maxUsers || planConfig.userLimit,
    branchLimit: company?.subscription?.plan === 'enterprise'
      ? 50
      : company?.subscription?.plan === 'small'
        ? 5
        : planConfig.branchLimit,
    status:
      company?.subscription?.status === 'suspended'
        ? 'inactive'
        : company?.subscription?.status || 'trial',
    billingCycle: 'monthly',
    featureAccess: {
      ...planConfig.featureAccess,
      transfers: true,
      commissions: true,
      reports: true,
      notifications: true,
      bulkImports: plan !== 'starter',
      advancedWorkflows: plan !== 'starter',
      customBranding: plan !== 'starter',
      automations: plan !== 'starter',
      publicForms: true,
      websiteIntegration: true,
      qrForms: plan !== 'starter',
      billing: true,
    },
    provider: 'manual',
  });

  return subscription;
};

const getEffectiveSubscription = async (companyId) => {
  const subscription = await ensureTenantSubscription(companyId);
  const usage = {
    activeUsers: await User.countDocuments({ companyId, isActive: true, deletedAt: null }),
    branches: await Branch.countDocuments({ companyId, deletedAt: null, isActive: true }),
  };

  subscription.usage = {
    ...(subscription.usage?.toObject ? subscription.usage.toObject() : subscription.usage || {}),
    ...usage,
  };
  await subscription.save();
  return subscription;
};

const isSubscriptionActive = (subscription) =>
  ['trial', 'active'].includes(String(subscription?.status || '').toLowerCase());

const hasFeatureAccess = (subscription, featureKey) =>
  Boolean(subscription?.featureAccess?.[featureKey]);

const isWithinLimit = async (companyId, limitKey) => {
  const subscription = await getEffectiveSubscription(companyId);
  if (limitKey === 'users') {
    return subscription.usage.activeUsers < subscription.userLimit;
  }
  if (limitKey === 'branches') {
    return subscription.usage.branches < subscription.branchLimit;
  }
  return true;
};

module.exports = {
  PLAN_CONFIG,
  ensureTenantSubscription,
  getEffectiveSubscription,
  getPlanConfig,
  hasFeatureAccess,
  isSubscriptionActive,
  isWithinLimit,
};
