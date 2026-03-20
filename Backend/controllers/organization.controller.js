const Company = require('../models/Company');
const Branch = require('../models/Branch');
const Role = require('../models/Role');
const PermissionBundle = require('../models/PermissionBundle');
const User = require('../models/User');
const AuditLog = require('../models/AuditLog');
const SLAConfig = require('../models/SLAConfig');
const CountryWorkflow = require('../models/CountryWorkflow');
const { sendSuccess, sendError } = require('../utils/responseHandler');
const { ensureCompanySaaSSetup } = require('../services/tenantProvisioning.service');
const { getUserBranchIds } = require('../services/accessControl.service');
const {
  getEffectiveSubscription,
  getPlanConfig,
} = require('../services/subscription.service');
const {
  normalizeCountry,
  normalizeStage,
} = require('../services/countryWorkflow.service');

const normalizeKey = (value) =>
  String(value || '')
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '_');

const normalizeNumber = (value, fallback = 0) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
};

const parseStageInput = (value = []) => {
  const items = Array.isArray(value)
    ? value
    : String(value || '')
      .split(',')
      .map((item) => item.trim())
      .filter(Boolean);

  return items
    .map((item, index) => normalizeStage(item, index + 1))
    .filter(Boolean);
};

const parseChecklistInput = (value = []) => {
  const items = Array.isArray(value)
    ? value
    : String(value || '')
      .split(',')
      .map((item) => item.trim())
      .filter(Boolean);

  return items
    .map((item) => {
      if (!item) {
        return null;
      }

      if (typeof item === 'string') {
        return {
          name: item,
          required: true,
          description: '',
        };
      }

      if (!item?.name) {
        return null;
      }

      return {
        name: String(item.name).trim(),
        required: item.required !== false,
        description: String(item.description || '').trim(),
      };
    })
    .filter(Boolean);
};

exports.getOrganizationSummary = async (req, res) => {
  try {
    await ensureCompanySaaSSetup(req.companyId);
    const branchIds = req.user?.effectiveAccess?.isHeadOffice ? [] : getUserBranchIds(req.user);
    const branchFilter = branchIds.length ? { _id: { $in: branchIds } } : {};
    const userFilter = branchIds.length ? { branchId: { $in: branchIds } } : {};
    const auditFilter = branchIds.length ? { branchId: { $in: branchIds } } : {};

    const [company, branches, roles, bundles, users, slaConfig, workflows, recentAuditLogs, subscription] = await Promise.all([
      Company.findById(req.companyId).lean(),
      Branch.find({ companyId: req.companyId, deletedAt: null, ...branchFilter })
        .sort({ isHeadOffice: -1, name: 1 })
        .lean(),
      Role.find({ companyId: req.companyId, isActive: true }).sort({ isSystem: -1, name: 1 }).lean(),
      PermissionBundle.find({ companyId: req.companyId, isActive: true }).sort({ name: 1 }).lean(),
      User.find({ companyId: req.companyId, deletedAt: null, ...userFilter })
        .select('name email role primaryRoleKey branchId isActive isHeadOffice countries')
        .populate('branchId', 'name code isHeadOffice')
        .sort({ name: 1 })
        .lean(),
      SLAConfig.findOne({ companyId: req.companyId }).lean(),
      CountryWorkflow.find({ companyId: req.companyId, isActive: true })
        .sort({ country: 1 })
        .lean(),
      AuditLog.find({ companyId: req.companyId, ...auditFilter })
        .sort({ createdAt: -1 })
        .limit(20)
        .lean(),
      getEffectiveSubscription(req.companyId),
    ]);

    return sendSuccess(res, 200, 'Organization summary fetched', {
      company,
      branches,
      roles,
      permissionBundles: bundles,
      users,
      slaConfig,
      countryWorkflows: workflows,
      subscription,
      planConfig: getPlanConfig(subscription?.plan),
      recentAuditLogs,
      counts: {
        branches: branches.length,
        roles: roles.length,
        permissionBundles: bundles.length,
        users: users.length,
        activeUsers: users.filter((user) => user.isActive).length,
        countryWorkflows: workflows.length,
      },
    });
  } catch (error) {
    return sendError(res, 500, 'Failed to fetch organization summary', error.message);
  }
};

exports.getRoles = async (req, res) => {
  try {
    await ensureCompanySaaSSetup(req.companyId);
    const roles = await Role.find({ companyId: req.companyId, isActive: true }).sort({
      isSystem: -1,
      name: 1,
    });
    return sendSuccess(res, 200, 'Roles fetched successfully', { roles });
  } catch (error) {
    return sendError(res, 500, 'Failed to fetch roles', error.message);
  }
};

exports.saveRole = async (req, res) => {
  try {
    const { key, name, description, permissions, fieldAccess, managerEnabled, isHeadOffice } = req.body;
    if (!name) {
      return sendError(res, 400, 'Role name is required');
    }

    const role = await Role.findOneAndUpdate(
      { companyId: req.companyId, key: normalizeKey(key || name) },
      {
        $set: {
          name,
          description,
          permissions: Array.isArray(permissions) ? permissions : [],
          fieldAccess: fieldAccess || {},
          managerEnabled: Boolean(managerEnabled),
          isHeadOffice: Boolean(isHeadOffice),
          isActive: true,
        },
        $setOnInsert: {
          companyId: req.companyId,
          key: normalizeKey(key || name),
          isSystem: false,
        },
      },
      { upsert: true, new: true, runValidators: true }
    );

    await AuditLog.logAction({
      companyId: req.companyId,
      branchId: req.user?.branchId?._id || req.user?.branchId,
      userId: req.user._id,
      userName: req.user.name,
      userEmail: req.user.email,
      userRole: req.user.role,
      action: 'role_saved',
      actionType: 'rbac',
      module: 'roles',
      resource: 'role',
      resourceId: role._id,
      targetId: role._id,
      resourceName: role.name,
      changes: { after: req.body },
    });

    return sendSuccess(res, 200, 'Role saved successfully', { role });
  } catch (error) {
    return sendError(res, 400, 'Failed to save role', error.message);
  }
};

exports.getPermissionBundles = async (req, res) => {
  try {
    const bundles = await PermissionBundle.find({ companyId: req.companyId, isActive: true }).sort({
      name: 1,
    });
    return sendSuccess(res, 200, 'Permission bundles fetched successfully', { bundles });
  } catch (error) {
    return sendError(res, 500, 'Failed to fetch permission bundles', error.message);
  }
};

exports.savePermissionBundle = async (req, res) => {
  try {
    const { key, name, description, permissions, fieldAccess, expiresAt } = req.body;
    if (!name) {
      return sendError(res, 400, 'Bundle name is required');
    }

    const bundle = await PermissionBundle.findOneAndUpdate(
      { companyId: req.companyId, key: normalizeKey(key || name) },
      {
        $set: {
          name,
          description,
          permissions: Array.isArray(permissions) ? permissions : [],
          fieldAccess: fieldAccess || {},
          expiresAt: expiresAt || null,
          isActive: true,
        },
        $setOnInsert: {
          companyId: req.companyId,
          key: normalizeKey(key || name),
        },
      },
      { upsert: true, new: true, runValidators: true }
    );

    await AuditLog.logAction({
      companyId: req.companyId,
      branchId: req.user?.branchId?._id || req.user?.branchId,
      userId: req.user._id,
      userName: req.user.name,
      userEmail: req.user.email,
      userRole: req.user.role,
      action: 'permission_bundle_saved',
      actionType: 'rbac',
      module: 'permissions',
      resource: 'permission_bundle',
      resourceId: bundle._id,
      targetId: bundle._id,
      resourceName: bundle.name,
      changes: { after: req.body },
    });

    return sendSuccess(res, 200, 'Permission bundle saved successfully', { bundle });
  } catch (error) {
    return sendError(res, 400, 'Failed to save permission bundle', error.message);
  }
};

exports.updateUserAccess = async (req, res) => {
  try {
    const {
      branchId,
      primaryRoleKey,
      role,
      permissionBundleIds,
      supervisor,
      isHeadOffice,
      managerEnabled,
      isActive,
    } = req.body;

    const user = await User.findOneAndUpdate(
      { _id: req.params.id, companyId: req.companyId },
      {
        $set: {
          branchId: branchId || null,
          primaryRoleKey: primaryRoleKey || role || undefined,
          role: role || undefined,
          permissionBundleIds: Array.isArray(permissionBundleIds) ? permissionBundleIds : undefined,
          supervisor: supervisor || null,
          reportsTo: supervisor || null,
          isHeadOffice: typeof isHeadOffice === 'boolean' ? isHeadOffice : undefined,
          managerEnabled: typeof managerEnabled === 'boolean' ? managerEnabled : undefined,
          isActive: typeof isActive === 'boolean' ? isActive : undefined,
        },
      },
      { new: true, runValidators: true }
    )
      .populate('branchId', 'name code isHeadOffice')
      .lean();

    if (!user) {
      return sendError(res, 404, 'User not found');
    }

    await AuditLog.logAction({
      companyId: req.companyId,
      branchId: req.user?.branchId?._id || req.user?.branchId,
      userId: req.user._id,
      userName: req.user.name,
      userEmail: req.user.email,
      userRole: req.user.role,
      action: 'user_access_updated',
      actionType: 'rbac',
      module: 'users',
      resource: 'user',
      resourceId: user._id,
      targetId: user._id,
      resourceName: user.name,
      changes: { after: req.body },
    });

    return sendSuccess(res, 200, 'User access updated successfully', { user });
  } catch (error) {
    return sendError(res, 400, 'Failed to update user access', error.message);
  }
};

exports.getAuditLogs = async (req, res) => {
  try {
    const { module, action, limit = 50 } = req.query;
    const query = { companyId: req.companyId };
    if (!req.user?.effectiveAccess?.isHeadOffice && req.user?.branchId) {
      query.branchId = req.user.branchId._id || req.user.branchId;
    }
    if (module) {
      query.module = module;
    }
    if (action) {
      query.action = action;
    }

    const logs = await AuditLog.find(query)
      .sort({ createdAt: -1 })
      .limit(Number(limit))
      .lean();

    return sendSuccess(res, 200, 'Audit logs fetched successfully', { logs });
  } catch (error) {
    return sendError(res, 500, 'Failed to fetch audit logs', error.message);
  }
};

exports.getSlaConfig = async (req, res) => {
  try {
    await ensureCompanySaaSSetup(req.companyId);
    const slaConfig = await SLAConfig.findOne({ companyId: req.companyId }).lean();
    return sendSuccess(res, 200, 'SLA configuration fetched successfully', { slaConfig });
  } catch (error) {
    return sendError(res, 500, 'Failed to fetch SLA configuration', error.message);
  }
};

exports.updateSlaConfig = async (req, res) => {
  try {
    const slaConfig = await SLAConfig.findOneAndUpdate(
      { companyId: req.companyId },
      {
        $set: {
          ...req.body,
          companyId: req.companyId,
        },
      },
      { new: true, upsert: true, runValidators: true }
    );

    await Company.findByIdAndUpdate(req.companyId, {
      'settings.transferApprovalRequired': Boolean(slaConfig.transferApprovalRequired),
    });

    await AuditLog.logAction({
      companyId: req.companyId,
      branchId: req.user?.branchId?._id || req.user?.branchId,
      userId: req.user._id,
      userName: req.user.name,
      userEmail: req.user.email,
      userRole: req.user.role,
      action: 'sla_config_updated',
      actionType: 'sla',
      module: 'sla',
      resource: 'sla_config',
      resourceId: slaConfig._id,
      targetId: slaConfig._id,
      resourceName: 'SLA Configuration',
      changes: { after: req.body },
    });

    return sendSuccess(res, 200, 'SLA configuration updated successfully', { slaConfig });
  } catch (error) {
    return sendError(res, 400, 'Failed to update SLA configuration', error.message);
  }
};

exports.getCountryWorkflows = async (req, res) => {
  try {
    await ensureCompanySaaSSetup(req.companyId);
    const workflows = await CountryWorkflow.find({
      companyId: req.companyId,
      isActive: true,
    })
      .sort({ country: 1 })
      .lean();

    return sendSuccess(res, 200, 'Country workflows fetched successfully', { workflows });
  } catch (error) {
    return sendError(res, 500, 'Failed to fetch country workflows', error.message);
  }
};

exports.saveCountryWorkflow = async (req, res) => {
  try {
    const country = normalizeCountry(req.body.country);
    if (!country) {
      return sendError(res, 400, 'Country is required');
    }

    const workflow = await CountryWorkflow.findOneAndUpdate(
      { companyId: req.companyId, country },
      {
        $set: {
          branchId: req.body.branchId || null,
          leadStages: parseStageInput(req.body.leadStages),
          applicationStages: parseStageInput(req.body.applicationStages),
          documentChecklist: parseChecklistInput(req.body.documentChecklist),
          followUpRules: {
            initialHours: normalizeNumber(req.body.followUpRules?.initialHours, 8),
            recurringHours: normalizeNumber(req.body.followUpRules?.recurringHours, 48),
            overdueReminderHours: normalizeNumber(
              req.body.followUpRules?.overdueReminderHours,
              24
            ),
            cadenceLabel: String(req.body.followUpRules?.cadenceLabel || '').trim(),
          },
          slaRules: {
            firstResponseHours: normalizeNumber(req.body.slaRules?.firstResponseHours, 4),
            firstFollowUpHours: normalizeNumber(req.body.slaRules?.firstFollowUpHours, 8),
            offerDecisionHours: normalizeNumber(req.body.slaRules?.offerDecisionHours, 72),
          },
          isActive: req.body.isActive !== false,
          metadata: req.body.metadata || {},
        },
        $setOnInsert: {
          companyId: req.companyId,
          country,
        },
      },
      { upsert: true, new: true, runValidators: true }
    );

    await AuditLog.logAction({
      companyId: req.companyId,
      branchId: req.user?.branchId?._id || req.user?.branchId,
      userId: req.user._id,
      userName: req.user.name,
      userEmail: req.user.email,
      userRole: req.user.role,
      action: 'country_workflow_saved',
      actionType: 'workflow',
      module: 'settings',
      resource: 'country_workflow',
      resourceId: workflow._id,
      targetId: workflow._id,
      resourceName: workflow.country,
      changes: { after: req.body },
    });

    return sendSuccess(res, 200, 'Country workflow saved successfully', { workflow });
  } catch (error) {
    return sendError(res, 400, 'Failed to save country workflow', error.message);
  }
};

exports.getSubscriptionSummary = async (req, res) => {
  try {
    const subscription = await getEffectiveSubscription(req.companyId);
    return sendSuccess(res, 200, 'Subscription summary fetched successfully', {
      subscription,
      planConfig: getPlanConfig(subscription.plan),
    });
  } catch (error) {
    return sendError(res, 500, 'Failed to fetch subscription summary', error.message);
  }
};

exports.updateSubscription = async (req, res) => {
  try {
    const currentSubscription = await getEffectiveSubscription(req.companyId);
    const plan = String(req.body.plan || currentSubscription.plan || 'starter').toLowerCase();
    const planConfig = getPlanConfig(plan);

    currentSubscription.plan = plan;
    currentSubscription.status = req.body.status || currentSubscription.status;
    currentSubscription.billingCycle = req.body.billingCycle || currentSubscription.billingCycle;
    currentSubscription.userLimit = normalizeNumber(
      req.body.userLimit,
      planConfig.userLimit
    );
    currentSubscription.branchLimit = normalizeNumber(
      req.body.branchLimit,
      planConfig.branchLimit
    );
    currentSubscription.featureAccess = {
      ...planConfig.featureAccess,
      ...(currentSubscription.featureAccess?.toObject
        ? currentSubscription.featureAccess.toObject()
        : currentSubscription.featureAccess || {}),
      ...(req.body.featureAccess || {}),
    };
    currentSubscription.provider = req.body.provider || currentSubscription.provider;
    currentSubscription.providerCustomerId =
      req.body.providerCustomerId || currentSubscription.providerCustomerId;
    currentSubscription.providerSubscriptionId =
      req.body.providerSubscriptionId || currentSubscription.providerSubscriptionId;
    currentSubscription.currentPeriodStart =
      req.body.currentPeriodStart || currentSubscription.currentPeriodStart;
    currentSubscription.currentPeriodEnd =
      req.body.currentPeriodEnd || currentSubscription.currentPeriodEnd;
    currentSubscription.nextInvoiceDate =
      req.body.nextInvoiceDate || currentSubscription.nextInvoiceDate;
    await currentSubscription.save();

    await Company.findByIdAndUpdate(req.companyId, {
      $set: {
        'subscription.plan':
          plan === 'growth' ? 'professional' : plan === 'starter' ? 'free' : plan,
        'subscription.status':
          ['inactive', 'past_due'].includes(currentSubscription.status)
            ? 'suspended'
            : currentSubscription.status,
        'limits.maxUsers': currentSubscription.userLimit,
      },
    });

    await AuditLog.logAction({
      companyId: req.companyId,
      branchId: req.user?.branchId?._id || req.user?.branchId,
      userId: req.user._id,
      userName: req.user.name,
      userEmail: req.user.email,
      userRole: req.user.role,
      action: 'subscription_updated',
      actionType: 'billing',
      module: 'settings',
      resource: 'subscription',
      resourceId: currentSubscription._id,
      targetId: currentSubscription._id,
      resourceName: currentSubscription.plan,
      changes: { after: req.body },
    });

    return sendSuccess(res, 200, 'Subscription updated successfully', {
      subscription: currentSubscription,
      planConfig,
    });
  } catch (error) {
    return sendError(res, 400, 'Failed to update subscription', error.message);
  }
};
