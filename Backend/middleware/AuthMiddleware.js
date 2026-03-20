const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { sendError } = require('../utils/responseHandler');
const {
  buildEffectiveAccess,
  hasPermission,
} = require('../services/accessControl.service');
const { ensureCompanySaaSSetup } = require('../services/tenantProvisioning.service');
const {
  getEffectiveSubscription,
  hasFeatureAccess,
  isSubscriptionActive,
  isWithinLimit,
} = require('../services/subscription.service');

// JWT_SECRET is validated at server startup (server.js). Safe to use directly.
const JWT_SECRET = process.env.JWT_SECRET;

// verify token and attach user to req
exports.protect = async (req, res, next) => {
  try {
    const header = req.headers.authorization;
    if (!header || !header.startsWith('Bearer ')) {
      return sendError(res, 401, 'Authorization token missing');
    }
    const token = header.split(' ')[1];
    const decoded = jwt.verify(token, JWT_SECRET);

    // decoded contains { userId, companyId, role, ... }
    const user = await User.findById(decoded.userId)
      .select('-password')
      .populate('companyId')
      .populate('branchId', 'name code isHeadOffice');
    if (!user) {
      return sendError(res, 401, 'User not found');
    }

    // Multi-tenancy check
    // Ensure company matches and is active
    const company = user.companyId;
    if (!company) {
      return sendError(res, 403, 'Access denied: company context missing');
    }

    const isSuperAdmin = user.role === 'super_admin';
    const isOwnerImpersonation = Boolean(decoded.ownerImpersonation && decoded.impersonatedBy);

    if (!company.isActive && !isSuperAdmin && !isOwnerImpersonation) {
      return sendError(res, 403, 'Access denied: company is inactive');
    }

    if (company._id.toString() !== decoded.companyId) {
      return sendError(res, 403, 'Access denied: tenant mismatch');
    }

    await ensureCompanySaaSSetup(company._id);
    user.effectiveAccess = await buildEffectiveAccess(user);
    req.subscription = await getEffectiveSubscription(company._id);
    if (!isSubscriptionActive(req.subscription) && !isSuperAdmin && !isOwnerImpersonation) {
      return sendError(res, 402, 'Subscription inactive. Please reactivate billing to continue.');
    }
    req.user = user;
    req.companyId = company._id.toString();
    req.userId = user._id.toString();
    req.tenantId = company._id.toString();
    req.isOwnerImpersonation = isOwnerImpersonation;
    req.impersonatedBy = decoded.impersonatedBy || null;
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
      const subscription = req.subscription || (await getEffectiveSubscription(req.companyId));
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
