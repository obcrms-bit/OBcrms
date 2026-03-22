const Company = require('../models/Company');
const Branch = require('../models/Branch');
const Subscription = require('../models/Subscription');
const User = require('../models/User');

const BASE_SUBSCRIPTION_CACHE_TTL_MS = 60 * 1000;
const SUBSCRIPTION_USAGE_CACHE_TTL_MS = 30 * 1000;

const baseSubscriptionCache = new Map();
const usageSnapshotCache = new Map();

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

const toCacheKey = (companyId) => String(companyId || '');

const toPlainObject = (value) =>
  value?.toObject ? value.toObject() : value ? { ...value } : null;

const pruneCache = (cache) => {
  const now = Date.now();
  for (const [key, entry] of cache.entries()) {
    if (!entry || entry.expiresAt <= now) {
      cache.delete(key);
    }
  }
};

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

const getBaseSubscription = async (companyId, { forceRefresh = false } = {}) => {
  const cacheKey = toCacheKey(companyId);
  const cached = baseSubscriptionCache.get(cacheKey);

  if (!forceRefresh && cached && cached.expiresAt > Date.now()) {
    return cached.value;
  }

  const subscription = toPlainObject(await ensureTenantSubscription(companyId));
  const nextValue = {
    ...(subscription || {}),
    companyId: subscription?.companyId || companyId,
  };

  if (baseSubscriptionCache.size > 200) {
    pruneCache(baseSubscriptionCache);
  }

  baseSubscriptionCache.set(cacheKey, {
    value: nextValue,
    expiresAt: Date.now() + BASE_SUBSCRIPTION_CACHE_TTL_MS,
  });

  return nextValue;
};

const getSubscriptionUsageSnapshot = async (companyId, { forceRefresh = false } = {}) => {
  const cacheKey = toCacheKey(companyId);
  const cached = usageSnapshotCache.get(cacheKey);

  if (!forceRefresh && cached && cached.expiresAt > Date.now()) {
    return cached.value;
  }

  const usage = {
    activeUsers: await User.countDocuments({ companyId, isActive: true, deletedAt: null }),
    branches: await Branch.countDocuments({ companyId, deletedAt: null, isActive: true }),
  };

  if (usageSnapshotCache.size > 200) {
    pruneCache(usageSnapshotCache);
  }

  usageSnapshotCache.set(cacheKey, {
    value: usage,
    expiresAt: Date.now() + SUBSCRIPTION_USAGE_CACHE_TTL_MS,
  });

  return usage;
};

const getEffectiveSubscription = async (
  companyId,
  { includeUsage = true, forceRefresh = false } = {}
) => {
  const subscription = await getBaseSubscription(companyId, { forceRefresh });
  if (!includeUsage) {
    return subscription;
  }

  const usage = await getSubscriptionUsageSnapshot(companyId, { forceRefresh });
  return {
    ...subscription,
    usage: {
      ...(subscription?.usage || {}),
      ...usage,
    },
  };
};

const isSubscriptionActive = (subscription) =>
  ['trial', 'active'].includes(String(subscription?.status || '').toLowerCase());

const hasFeatureAccess = (subscription, featureKey) =>
  Boolean(subscription?.featureAccess?.[featureKey]);

const isWithinLimit = async (companyId, limitKey) => {
  const subscription = await getEffectiveSubscription(companyId, {
    includeUsage: true,
    forceRefresh: true,
  });
  if (limitKey === 'users') {
    return Number(subscription?.usage?.activeUsers || 0) < Number(subscription?.userLimit || 0);
  }
  if (limitKey === 'branches') {
    return Number(subscription?.usage?.branches || 0) < Number(subscription?.branchLimit || 0);
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
