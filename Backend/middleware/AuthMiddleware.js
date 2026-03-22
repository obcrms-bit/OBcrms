const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { sendError } = require('../utils/responseHandler');
const {
  buildEffectiveAccess,
  hasPermission,
} = require('../services/accessControl.service');
const { normalizeRoleKey } = require('../constants/rbac');
const { ensureCompanySaaSSetup } = require('../services/tenantProvisioning.service');
const {
  getEffectiveSubscription,
  hasFeatureAccess,
  isSubscriptionActive,
  isWithinLimit,
} = require('../services/subscription.service');

// JWT_SECRET is validated at server startup (server.js). Safe to use directly.
const JWT_SECRET = process.env.JWT_SECRET;
const AUTH_CONTEXT_CACHE_TTL_MS = 5 * 1000;
const authContextCache = new Map();
const PLATFORM_ROUTE_PREFIXES = ['/api/super-admin'];
const SHARED_ROUTE_PREFIXES = ['/api/auth'];

const AUTH_USER_SELECT =
  '_id name email role primaryRoleKey companyId branchId additionalBranchIds accessibleBranchIds countries permissions permissionBundleIds roleId isHeadOffice managerEnabled fieldAccessOverrides avatar isActive updatedAt';

const buildAuthCacheKey = (decoded) => `${decoded?.companyId || ''}:${decoded?.userId || ''}`;

const routeMatchesPrefix = (routePath = '', prefixes = []) =>
  prefixes.some((prefix) => routePath.startsWith(prefix));

const pruneAuthContextCache = () => {
  const now = Date.now();
  for (const [key, entry] of authContextCache.entries()) {
    if (!entry || (!entry.inflight && entry.expiresAt <= now)) {
      authContextCache.delete(key);
    }
  }
};

const loadAuthContext = async (decoded) => {
  const cacheKey = buildAuthCacheKey(decoded);
  const now = Date.now();
  const cachedEntry = authContextCache.get(cacheKey);

  if (cachedEntry?.value && cachedEntry.expiresAt > now) {
    return cachedEntry.value;
  }

  if (cachedEntry?.inflight) {
    return cachedEntry.inflight;
  }

  const inflight = (async () => {
    const userRecord = await User.findById(decoded.userId)
      .select(AUTH_USER_SELECT)
      .populate('companyId', 'name isActive subscription settings')
      .populate('branchId', 'name code isHeadOffice')
      .lean();

    if (!userRecord) {
      return null;
    }

    const companyRecord = userRecord.companyId;
    if (!companyRecord) {
      return {
        user: userRecord,
        company: null,
        subscription: null,
      };
    }

    const companyId = companyRecord._id?.toString() || String(companyRecord);
    await ensureCompanySaaSSetup(companyId);

    const effectiveAccess = await buildEffectiveAccess({
      ...userRecord,
      companyId: companyRecord._id || companyRecord,
    });
    const subscription = await getEffectiveSubscription(companyId, {
      includeUsage: false,
    });

    const nextUser = {
      ...userRecord,
      companyId: companyRecord._id || companyRecord,
      company: companyRecord,
      branchId: userRecord.branchId || null,
      effectiveAccess,
    };

    return {
      user: nextUser,
      company: companyRecord,
      subscription,
    };
  })();

  authContextCache.set(cacheKey, {
    inflight,
    expiresAt: now + AUTH_CONTEXT_CACHE_TTL_MS,
  });

  try {
    const value = await inflight;
    if (authContextCache.size > 500) {
      pruneAuthContextCache();
    }
    authContextCache.set(cacheKey, {
      value,
      expiresAt: Date.now() + AUTH_CONTEXT_CACHE_TTL_MS,
    });
    return value;
  } catch (error) {
    authContextCache.delete(cacheKey);
    throw error;
  }
};

// verify token and attach user to req
exports.protect = async (req, res, next) => {
  try {
    const header = req.headers.authorization;
    if (!header || !header.startsWith('Bearer ')) {
      return sendError(res, 401, 'Authorization token missing');
    }
    const token = header.split(' ')[1];
    const decoded = jwt.verify(token, JWT_SECRET);

    const authContext = await loadAuthContext(decoded);
    if (!authContext?.user) {
      return sendError(res, 401, 'User not found');
    }

    // Multi-tenancy check
    // Ensure company matches and is active
    const user = authContext.user;
    const company = authContext.company;
    if (!company) {
      return sendError(res, 403, 'Access denied: company context missing');
    }

    const normalizedRoleKey = normalizeRoleKey(
      user.primaryRoleKey || user.effectiveAccess?.roleKey || user.role
    );
    const isPlatformUser = ['super_admin', 'super_admin_manager'].includes(normalizedRoleKey);
    const isOwnerImpersonation = Boolean(decoded.ownerImpersonation && decoded.impersonatedBy);
    const routePath = req.originalUrl || req.url || '';
    const isPlatformRoute = routeMatchesPrefix(routePath, PLATFORM_ROUTE_PREFIXES);
    const isSharedRoute = routeMatchesPrefix(routePath, SHARED_ROUTE_PREFIXES);

    if (!company.isActive && !isPlatformUser && !isOwnerImpersonation) {
      return sendError(res, 403, 'Access denied: company is inactive');
    }

    if (company._id.toString() !== decoded.companyId) {
      return sendError(res, 403, 'Access denied: tenant mismatch');
    }

    req.subscription = authContext.subscription;
    if (!isSubscriptionActive(req.subscription) && !isPlatformUser && !isOwnerImpersonation) {
      return sendError(res, 402, 'Subscription inactive. Please reactivate billing to continue.');
    }
    req.user = user;
    req.company = company;
    req.companyId = company._id.toString();
    req.userId = user._id.toString();
    req.tenantId = company._id.toString();
    req.isOwnerImpersonation = isOwnerImpersonation;
    req.impersonatedBy = decoded.impersonatedBy || null;
    req.workspaceZone = isPlatformUser && !isOwnerImpersonation ? 'platform' : 'tenant';

    if (isPlatformUser && !isOwnerImpersonation && !isPlatformRoute && !isSharedRoute) {
      return sendError(
        res,
        403,
        'Platform users can only access platform routes directly. Impersonate a tenant to enter tenant operations.'
      );
    }

    if (!isPlatformUser && isPlatformRoute) {
      return sendError(res, 403, 'Tenant users cannot access platform control routes.');
    }

    next();
  } catch (error) {
    sendError(res, 401, 'Invalid or expired token', error.message);
  }
};

// restrict to specific roles (case-insensitive)
exports.restrict = (...roles) => {
  return (req, res, next) => {
    const userRole = req.user?.effectiveAccess?.roleKey || req.user?.primaryRoleKey || req.user?.role?.toLowerCase();
    const allowedRoles = roles.map((r) => r.toLowerCase());
    if (!req.user) {
      return sendError(res, 403, 'Forbidden: insufficient role');
    }

    if (['super_admin', 'head_office_admin'].includes(userRole)) {
      return next();
    }

    if (!allowedRoles.includes(userRole) && !allowedRoles.includes(req.user?.role?.toLowerCase())) {
      return sendError(res, 403, 'Forbidden: insufficient role');
    }
    next();
  };
};

exports.requirePermission = (moduleKey, action = 'view') => {
  return (req, res, next) => {
    if (!req.user) {
      return sendError(res, 401, 'Authentication required');
    }

    if (!hasPermission(req.user, moduleKey, action)) {
      return sendError(res, 403, `Forbidden: missing permission ${moduleKey}.${action}`);
    }

    next();
  };
};

exports.requireFeature = (featureKey) => {
  return async (req, res, next) => {
    try {
      const subscription =
        req.subscription ||
        (await getEffectiveSubscription(req.companyId, { includeUsage: false }));
      if (!hasFeatureAccess(subscription, featureKey)) {
        return sendError(
          res,
          403,
          `Your current subscription plan does not include ${featureKey}.`
        );
      }
      req.subscription = subscription;
      next();
    } catch (error) {
      return sendError(res, 500, 'Failed to validate subscription feature access', error.message);
    }
  };
};

exports.enforceLimit = (limitKey) => {
  return async (req, res, next) => {
    try {
      const withinLimit = await isWithinLimit(req.companyId, limitKey);
      if (!withinLimit) {
        return sendError(
          res,
          403,
          `Your subscription ${limitKey} limit has been reached. Upgrade your plan to continue.`
        );
      }
      next();
    } catch (error) {
      return sendError(res, 500, 'Failed to validate subscription limits', error.message);
    }
  };
};
