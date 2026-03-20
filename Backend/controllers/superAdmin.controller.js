const jwt = require('jsonwebtoken');
const Company = require('../models/Company');
const Subscription = require('../models/Subscription');
const Branch = require('../models/Branch');
const User = require('../models/User');
const AuditLog = require('../models/AuditLog');
const CountryWorkflow = require('../models/CountryWorkflow');
const PublicLeadForm = require('../models/PublicLeadForm');
const QRCode = require('../models/QRCode');
const WebsiteIntegrationSetting = require('../models/WebsiteIntegrationSetting');
const AutomationRule = require('../models/AutomationRule');
const Template = require('../models/Template');
const BillingPlanConfig = require('../models/BillingPlanConfig');
const NotificationTemplate = require('../models/NotificationTemplate');
const DashboardConfig = require('../models/DashboardConfig');
const AssignmentRuleConfig = require('../models/AssignmentRuleConfig');
const { sendSuccess, sendError } = require('../utils/responseHandler');
const { buildEffectiveAccess } = require('../services/accessControl.service');
const { ensureCompanySaaSSetup } = require('../services/tenantProvisioning.service');
const { getEffectiveSubscription } = require('../services/subscription.service');
const {
  normalizeKey,
  ensureControlPlaneSeedData,
  applyTemplateToTenant,
  getBillingPlanFallback,
} = require('../services/superAdminConfig.service');

const JWT_SECRET = process.env.JWT_SECRET;

const normalizeStatus = (company, subscription) => {
  if (!company?.isActive || company?.isPaused || subscription?.status === 'inactive') {
    return 'suspended';
  }
  if (subscription?.status === 'past_due') {
    return 'past_due';
  }
  if (subscription?.status === 'trial') {
    return 'trial';
  }
  return 'active';
};

const getTenantWarnings = ({
  company,
  subscription,
  workflowCount,
  publicFormCount,
  integrationCount,
}) => {
  const warnings = [];

  if (!company?.owner) {
    warnings.push('No primary tenant owner assigned.');
  }
  if (!company?.headOfficeBranchId) {
    warnings.push('Head office branch is missing.');
  }
  if (subscription?.status === 'past_due') {
    warnings.push('Billing is past due.');
  }
  if (subscription?.status === 'inactive') {
    warnings.push('Subscription is inactive.');
  }
  if (!workflowCount) {
    warnings.push('No country workflows configured.');
  }
  if (!publicFormCount) {
    warnings.push('Public lead capture is not configured.');
  }
  if (!integrationCount) {
    warnings.push('No integrations are enabled.');
  }
  if (!company?.settings?.logo) {
    warnings.push('Tenant branding logo is missing.');
  }

  return warnings;
};

const buildHealthState = (details) => {
  const warnings = getTenantWarnings(details);
  const usage = details.subscription?.usage || {};
  let score = 100 - warnings.length * 12;

  if (details.subscription?.userLimit) {
    const ratio = usage.activeUsers / details.subscription.userLimit;
    if (ratio >= 0.9) {
      score -= 12;
    } else if (ratio >= 0.75) {
      score -= 6;
    }
  }

  if (details.subscription?.branchLimit) {
    const ratio = usage.branches / details.subscription.branchLimit;
    if (ratio >= 0.9) {
      score -= 10;
    } else if (ratio >= 0.75) {
      score -= 5;
    }
  }

  return {
    score: Math.max(0, Math.min(100, score)),
    warnings,
  };
};

const serializeTenantUser = async (user, company = null) => {
  const branch = user.branchId
    ? await Branch.findById(user.branchId).select('name code isHeadOffice').lean()
    : null;
  const effectiveAccess = await buildEffectiveAccess(user);

  return {
    id: user._id,
    name: user.name,
    email: user.email,
    role: user.role,
    primaryRoleKey: effectiveAccess.roleKey,
    roleName: effectiveAccess.roleName,
    companyId: user.companyId,
    tenantId: user.companyId,
    branchId: user.branchId || null,
    branch,
    countries: Array.isArray(user.countries) ? user.countries : [],
    isHeadOffice: effectiveAccess.isHeadOffice,
    managerEnabled: effectiveAccess.managerEnabled,
    effectivePermissions: effectiveAccess.permissions,
    fieldAccess: effectiveAccess.fieldAccess,
    permissionBundles: effectiveAccess.bundles,
    company: company
      ? {
        id: company._id,
        name: company.name,
        settings: company.settings,
        subscription: company.subscription,
      }
      : undefined,
    isActive: user.isActive,
  };
};

const generateCompanyId = async () => {
  for (let attempt = 0; attempt < 10; attempt += 1) {
    const companyId = `COMP_${Math.random().toString(36).substring(2, 11).toUpperCase()}`;
    const existing = await Company.findOne({ companyId }).select('_id').lean();
    if (!existing) {
      return companyId;
    }
  }
  throw new Error('Failed to generate a unique company identifier');
};

const getResolvedPlan = async (planKey) => {
  const normalized = normalizeKey(planKey || 'starter', 'starter');
  return (
    (await BillingPlanConfig.findOne({ key: normalized, isActive: true }).lean()) ||
    getBillingPlanFallback(normalized)
  );
};

const buildTenantSummary = async (company) => {
  const [subscription, workflowCount, publicFormCount, integrationCount] = await Promise.all([
    getEffectiveSubscription(company._id),
    CountryWorkflow.countDocuments({ companyId: company._id, isActive: true }),
    PublicLeadForm.countDocuments({ companyId: company._id, isActive: true }),
    WebsiteIntegrationSetting.countDocuments({ companyId: company._id, isActive: true }),
  ]);

  const countries = new Set([company.country].filter(Boolean));
  const branches = await Branch.find({ companyId: company._id, deletedAt: null })
    .select('name country')
    .lean();
  branches.forEach((branch) => {
    if (branch.country) {
      countries.add(branch.country);
    }
  });

  const health = buildHealthState({
    company,
    subscription,
    workflowCount,
    publicFormCount,
    integrationCount,
  });

  return {
    id: company._id,
    logo: company.settings?.logo || '',
    name: company.name,
    status: normalizeStatus(company, subscription),
    billingStatus: subscription.status,
    plan: subscription.plan,
    usersCount: subscription.usage?.activeUsers || 0,
    branchCount: subscription.usage?.branches || 0,
    countries: Array.from(countries),
    createdAt: company.createdAt,
    isPaused: company.isPaused,
    pauseReason: company.pauseReason || '',
    healthScore: health.score,
    warnings: health.warnings,
    company,
    subscription,
  };
};

const logOwnerAction = async (req, payload) => {
  await AuditLog.logAction(
    {
      companyId: payload.companyId || req.companyId,
      branchId: null,
      userId: req.user._id,
      userName: req.user.name,
      userEmail: req.user.email,
      userRole: req.user.role,
      action: payload.action,
      actionType: payload.actionType || 'super_admin',
      module: payload.module || 'super_admin',
      resource: payload.resource || 'tenant',
      resourceId: payload.resourceId,
      targetId: payload.targetId || payload.resourceId,
      resourceName: payload.resourceName,
      changes: payload.changes,
      status: payload.status || 'success',
      errorMessage: payload.errorMessage,
      ipAddress: req.ip,
      userAgent: req.get('user-agent'),
    },
    payload.metadata || {}
  );
};

exports.getOverview = async (req, res) => {
  try {
    await ensureControlPlaneSeedData();

    const [
      totalTenants,
      activeSubscriptions,
      totalUsers,
      totalBranches,
      companies,
      templates,
      billingPlans,
      recentAuditLogs,
      subscriptions,
    ] = await Promise.all([
      Company.countDocuments({ deletedAt: null }),
      Subscription.countDocuments({ status: { $in: ['trial', 'active'] } }),
      User.countDocuments({ isActive: true, deletedAt: null }),
      Branch.countDocuments({ isActive: true, deletedAt: null }),
      Company.find({ deletedAt: null }).sort({ createdAt: -1 }).limit(8).lean(),
      Template.find({ status: 'active' }).sort({ usageCount: -1, name: 1 }).limit(6).lean(),
      BillingPlanConfig.find({ isActive: true }).sort({ sortOrder: 1, name: 1 }).lean(),
      AuditLog.find({}).sort({ createdAt: -1 }).limit(12).lean(),
      Subscription.find({}).lean(),
    ]);

    const tenants = await Promise.all(companies.map((company) => buildTenantSummary(company)));
    const subscriptionDistribution = subscriptions.reduce((acc, subscription) => {
      acc[subscription.plan] = (acc[subscription.plan] || 0) + 1;
      return acc;
    }, {});
    const moduleUsage = subscriptions.reduce((acc, subscription) => {
      const featureAccess = subscription.featureAccess || {};
      Object.entries(featureAccess).forEach(([key, value]) => {
        if (value) {
          acc[key] = (acc[key] || 0) + 1;
        }
      });
      return acc;
    }, {});

    sendSuccess(res, 200, 'Super admin overview fetched successfully', {
      kpis: {
        totalTenants,
        activeSubscriptions,
        totalUsers,
        totalBranches,
      },
      tenants,
      templates,
      billingPlans,
      recentAuditLogs,
      subscriptionDistribution,
      moduleUsage,
      supportTools: {
        suspendedTenants: tenants.filter((tenant) => tenant.status === 'suspended').length,
        pastDueTenants: tenants.filter((tenant) => tenant.billingStatus === 'past_due').length,
        lowHealthTenants: tenants.filter((tenant) => tenant.healthScore < 70).length,
        onboardingAlerts: tenants.filter((tenant) => tenant.warnings.length >= 3).length,
      },
    });
  } catch (error) {
    sendError(res, 500, 'Failed to fetch super admin overview', error.message);
  }
};

exports.listTenants = async (req, res) => {
  try {
    await ensureControlPlaneSeedData();

    const { search, status, plan, billing, country } = req.query;
    const companyQuery = { deletedAt: null };

    if (search) {
      companyQuery.$or = [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
        { companyId: { $regex: search, $options: 'i' } },
      ];
    }

    if (country) {
      companyQuery.country = { $regex: `^${String(country).trim()}$`, $options: 'i' };
    }

    const companies = await Company.find(companyQuery).sort({ createdAt: -1 }).lean();
    let tenants = await Promise.all(companies.map((company) => buildTenantSummary(company)));

    if (status && status !== 'all') {
      tenants = tenants.filter((tenant) => tenant.status === status);
    }
    if (plan && plan !== 'all') {
      tenants = tenants.filter((tenant) => tenant.plan === plan);
    }
    if (billing && billing !== 'all') {
      tenants = tenants.filter((tenant) => tenant.billingStatus === billing);
    }

    sendSuccess(res, 200, 'Tenants fetched successfully', { tenants });
  } catch (error) {
    sendError(res, 500, 'Failed to fetch tenants', error.message);
  }
};

exports.getTenantDetail = async (req, res) => {
  try {
    await ensureControlPlaneSeedData();

    const company = await Company.findById(req.params.id).lean();
    if (!company) {
      return sendError(res, 404, 'Tenant not found');
    }

    const [
      subscription,
      branches,
      users,
      workflows,
      forms,
      qrCodes,
      websiteIntegrations,
      automations,
      notificationTemplates,
      dashboardConfigs,
      assignmentRules,
      auditLogs,
      templates,
      billingPlans,
    ] = await Promise.all([
      getEffectiveSubscription(company._id),
      Branch.find({ companyId: company._id, deletedAt: null })
        .sort({ isHeadOffice: -1, name: 1 })
        .lean(),
      User.find({ companyId: company._id, deletedAt: null })
        .select('name email role primaryRoleKey branchId isActive countries isHeadOffice lastLogin')
        .populate('branchId', 'name code isHeadOffice')
        .sort({ name: 1 })
        .lean(),
      CountryWorkflow.find({ companyId: company._id, isActive: true }).sort({ country: 1 }).lean(),
      PublicLeadForm.find({ companyId: company._id }).sort({ createdAt: -1 }).lean(),
      QRCode.find({ companyId: company._id }).sort({ createdAt: -1 }).lean(),
      WebsiteIntegrationSetting.find({ companyId: company._id }).sort({ createdAt: -1 }).lean(),
      AutomationRule.find({ companyId: company._id }).sort({ createdAt: -1 }).lean(),
      NotificationTemplate.find({ companyId: company._id }).sort({ name: 1 }).lean(),
      DashboardConfig.find({ companyId: company._id }).sort({ createdAt: -1 }).lean(),
      AssignmentRuleConfig.find({ companyId: company._id }).sort({ createdAt: -1 }).lean(),
      AuditLog.find({ companyId: company._id }).sort({ createdAt: -1 }).limit(50).lean(),
      Template.find({ status: 'active' }).sort({ usageCount: -1, name: 1 }).lean(),
      BillingPlanConfig.find({ isActive: true }).sort({ sortOrder: 1, name: 1 }).lean(),
    ]);

    const health = buildHealthState({
      company,
      subscription,
      workflowCount: workflows.length,
      publicFormCount: forms.length,
      integrationCount: websiteIntegrations.length,
    });

    return sendSuccess(res, 200, 'Tenant detail fetched successfully', {
      tenant: {
        ...company,
        status: normalizeStatus(company, subscription),
      },
      subscription,
      branches,
      users,
      workflows,
      forms,
      qrCodes,
      websiteIntegrations,
      automations,
      notificationTemplates,
      dashboardConfigs,
      assignmentRules,
      templates,
      billingPlans,
      auditLogs,
      health,
      usageAlerts: [
        subscription.userLimit
          ? `${subscription.usage?.activeUsers || 0}/${subscription.userLimit} users in plan`
          : null,
        subscription.branchLimit
          ? `${subscription.usage?.branches || 0}/${subscription.branchLimit} branches in plan`
          : null,
      ].filter(Boolean),
    });
  } catch (error) {
    return sendError(res, 500, 'Failed to fetch tenant detail', error.message);
  }
};

exports.createTenant = async (req, res) => {
  try {
    await ensureControlPlaneSeedData();

    const {
      consultancy = {},
      adminUser = {},
      plan = {},
      branding = {},
      branches = [],
      templateKey,
    } = req.body;

    if (
      !consultancy.name ||
      !consultancy.email ||
      !adminUser.name ||
      !adminUser.email ||
      !adminUser.password
    ) {
      return sendError(
        res,
        400,
        'Consultancy name/email and admin user name/email/password are required'
      );
    }

    const existingCompany = await Company.findOne({ email: consultancy.email }).lean();
    if (existingCompany) {
      return sendError(res, 409, 'A tenant with this company email already exists');
    }

    const existingUser = await User.findOne({ email: adminUser.email }).lean();
    if (existingUser) {
      return sendError(res, 409, 'The admin user email is already in use');
    }

    const resolvedPlan = await getResolvedPlan(plan.key || plan.plan || 'starter');
    const company = await Company.create({
      companyId: await generateCompanyId(),
      name: consultancy.name,
      email: consultancy.email,
      country: consultancy.country || 'Nepal',
      timezone: consultancy.timezone || 'Asia/Kathmandu',
      website: consultancy.website || undefined,
      description: consultancy.description || '',
      settings: {
        currency: consultancy.currency || 'USD',
        primaryColor: branding.primaryColor || '#0f766e',
        secondaryColor: branding.secondaryColor || '#0f172a',
        accentColor: branding.accentColor || '#2dd4bf',
        fontFamily: branding.fontFamily || 'DM Sans',
        logo: branding.logo || '',
        loginHeading:
          branding.loginHeading || 'Sign in to your education operations workspace',
        loginSubheading:
          branding.loginSubheading ||
          'Manage counselling, applications, billing, and branch operations from one tenant-safe CRM.',
        supportEmail: branding.supportEmail || consultancy.email,
      },
      adminContact: {
        name: adminUser.name,
        email: adminUser.email,
        phone: adminUser.phone || '',
      },
      subscription: {
        plan:
          resolvedPlan.key === 'enterprise'
            ? 'enterprise'
            : resolvedPlan.key === 'growth'
              ? 'professional'
              : 'free',
        status: plan.status || 'trial',
        nextBillingDate: plan.nextBillingDate || null,
      },
      limits: {
        maxUsers: resolvedPlan.userLimit,
        maxCounselors: Math.max(3, Math.min(resolvedPlan.userLimit, 20)),
        maxStudents: 1000,
      },
      isActive: true,
      metadata: {
        onboardingCompletedAt: null,
        createdFromSuperAdmin: true,
      },
    });

    await ensureCompanySaaSSetup(company._id);

    const headOfficeBranch =
      (await Branch.findOne({ companyId: company._id, isHeadOffice: true })) ||
      (await Branch.create({
        companyId: company._id,
        name: 'Head Office',
        code: 'HO',
        location: consultancy.country || 'Head Office',
        country: consultancy.country || 'Nepal',
        isHeadOffice: true,
        visibility: 'tenant',
        isActive: true,
      }));

    const admin = new User({
      companyId: company._id,
      branchId: headOfficeBranch._id,
      name: adminUser.name,
      email: adminUser.email,
      password: adminUser.password,
      phone: adminUser.phone || '',
      role: 'head_office_admin',
      primaryRoleKey: 'head_office_admin',
      countries: Array.isArray(adminUser.countries) ? adminUser.countries : [],
      isHeadOffice: true,
      managerEnabled: true,
      isActive: true,
      invitedBy: req.user?._id,
    });
    await admin.save();

    const branchPayloads = branches
      .filter((branch) => branch?.name)
      .map((branch, index) => ({
        companyId: company._id,
        name: branch.name,
        code: branch.code || `BR${index + 1}`,
        city: branch.city || '',
        state: branch.state || '',
        country: branch.country || consultancy.country || '',
        location: [branch.city, branch.country].filter(Boolean).join(', '),
        email: branch.email || '',
        contactNumber: branch.contactNumber || '',
        visibility: branch.visibility || 'branch',
        isActive: branch.isActive !== false,
        isHeadOffice: false,
      }));

    if (branchPayloads.length) {
      for (const branchPayload of branchPayloads) {
        const exists = await Branch.findOne({
          companyId: company._id,
          name: branchPayload.name,
        }).lean();
        if (!exists) {
          await Branch.create(branchPayload);
        }
      }
    }

    await Company.findByIdAndUpdate(company._id, {
      owner: admin._id,
      headOfficeBranchId: headOfficeBranch._id,
      metadata: {
        createdFromSuperAdmin: true,
        onboardingCompletedAt: new Date(),
      },
    });

    const subscription = await Subscription.findOne({ companyId: company._id });
    if (subscription) {
      subscription.plan = resolvedPlan.key;
      subscription.status = plan.status || 'trial';
      subscription.billingCycle = plan.billingCycle || 'monthly';
      subscription.userLimit = Number(plan.userLimit || resolvedPlan.userLimit);
      subscription.branchLimit = Number(plan.branchLimit || resolvedPlan.branchLimit);
      subscription.featureAccess = {
        ...(resolvedPlan.featureAccess || {}),
        ...(plan.featureAccess || {}),
      };
      subscription.nextInvoiceDate = plan.nextBillingDate || subscription.nextInvoiceDate;
      await subscription.save();
    }

    let appliedTemplateSummary = null;
    if (templateKey) {
      const template = await Template.findOne({
        key: normalizeKey(templateKey),
        status: 'active',
      });
      if (template) {
        appliedTemplateSummary = await applyTemplateToTenant({
          companyId: company._id,
          template,
          actorUserId: req.user._id,
        });
      }
    }

    await logOwnerAction(req, {
      companyId: company._id,
      action: 'tenant_created',
      module: 'tenants',
      resource: 'tenant',
      resourceId: company._id,
      resourceName: company.name,
      changes: {
        after: {
          consultancy,
          plan: {
            key: resolvedPlan.key,
            status: plan.status || 'trial',
            billingCycle: plan.billingCycle || 'monthly',
          },
          templateKey: templateKey || null,
        },
      },
    });

    const tenantSummary = await buildTenantSummary(await Company.findById(company._id).lean());

    return sendSuccess(res, 201, 'Tenant created successfully', {
      tenant: tenantSummary,
      admin: {
        id: admin._id,
        name: admin.name,
        email: admin.email,
      },
      appliedTemplateSummary,
    });
  } catch (error) {
    return sendError(res, 500, 'Failed to create tenant', error.message);
  }
};

exports.updateTenantStatus = async (req, res) => {
  try {
    const company = await Company.findById(req.params.id);
    if (!company) {
      return sendError(res, 404, 'Tenant not found');
    }

    const nextStatus = String(req.body.status || '').toLowerCase();
    const pauseReason = String(req.body.pauseReason || '').trim();

    if (!['active', 'trial', 'suspended', 'cancelled', 'past_due'].includes(nextStatus)) {
      return sendError(res, 400, 'Invalid tenant status');
    }

    company.isActive = !['suspended', 'cancelled'].includes(nextStatus);
    company.isPaused = nextStatus === 'suspended';
    company.pauseReason = pauseReason;
    company.subscription = {
      ...(company.subscription?.toObject ? company.subscription.toObject() : company.subscription || {}),
      status:
        nextStatus === 'past_due'
          ? 'trial'
          : nextStatus === 'suspended'
            ? 'suspended'
            : nextStatus === 'cancelled'
              ? 'cancelled'
              : nextStatus,
    };
    await company.save();

    await Subscription.findOneAndUpdate(
      { companyId: company._id },
      {
        $set: {
          status:
            nextStatus === 'suspended'
              ? 'inactive'
              : nextStatus === 'cancelled'
                ? 'cancelled'
                : nextStatus,
        },
      }
    );

    await logOwnerAction(req, {
      companyId: company._id,
      action: 'tenant_status_updated',
      module: 'tenants',
      resource: 'tenant',
      resourceId: company._id,
      resourceName: company.name,
      changes: { after: { status: nextStatus, pauseReason } },
    });

    return sendSuccess(res, 200, 'Tenant status updated successfully');
  } catch (error) {
    return sendError(res, 500, 'Failed to update tenant status', error.message);
  }
};

exports.updateTenantSubscription = async (req, res) => {
  try {
    const company = await Company.findById(req.params.id);
    if (!company) {
      return sendError(res, 404, 'Tenant not found');
    }

    const subscription = await Subscription.findOne({ companyId: company._id });
    if (!subscription) {
      return sendError(res, 404, 'Tenant subscription not found');
    }

    const resolvedPlan = await getResolvedPlan(req.body.plan || subscription.plan || 'starter');
    subscription.plan = resolvedPlan.key;
    subscription.status = req.body.status || subscription.status;
    subscription.billingCycle = req.body.billingCycle || subscription.billingCycle;
    subscription.userLimit = Number(req.body.userLimit || resolvedPlan.userLimit);
    subscription.branchLimit = Number(req.body.branchLimit || resolvedPlan.branchLimit);
    subscription.featureAccess = {
      ...(resolvedPlan.featureAccess || {}),
      ...(subscription.featureAccess?.toObject
        ? subscription.featureAccess.toObject()
        : subscription.featureAccess || {}),
      ...(req.body.featureAccess || {}),
    };
    subscription.provider = req.body.provider || subscription.provider;
    subscription.nextInvoiceDate = req.body.nextInvoiceDate || subscription.nextInvoiceDate;
    await subscription.save();

    company.subscription = {
      ...(company.subscription?.toObject ? company.subscription.toObject() : company.subscription || {}),
      plan:
        resolvedPlan.key === 'enterprise'
          ? 'enterprise'
          : resolvedPlan.key === 'growth'
            ? 'professional'
            : 'free',
      status:
        subscription.status === 'inactive'
          ? 'suspended'
          : subscription.status === 'active'
            ? 'active'
            : subscription.status,
      nextBillingDate: req.body.nextInvoiceDate || company.subscription?.nextBillingDate || null,
    };
    company.limits = {
      ...(company.limits?.toObject ? company.limits.toObject() : company.limits || {}),
      maxUsers: subscription.userLimit,
    };
    await company.save();

    await logOwnerAction(req, {
      companyId: company._id,
      action: 'tenant_subscription_updated',
      module: 'billing',
      resource: 'subscription',
      resourceId: subscription._id,
      resourceName: company.name,
      changes: { after: req.body },
    });

    return sendSuccess(res, 200, 'Tenant subscription updated successfully', {
      subscription,
    });
  } catch (error) {
    return sendError(res, 500, 'Failed to update tenant subscription', error.message);
  }
};

exports.getTemplates = async (req, res) => {
  try {
    await ensureControlPlaneSeedData();
    const templates = await Template.find({}).sort({ status: 1, usageCount: -1, name: 1 }).lean();
    return sendSuccess(res, 200, 'Templates fetched successfully', { templates });
  } catch (error) {
    return sendError(res, 500, 'Failed to fetch templates', error.message);
  }
};

exports.saveTemplate = async (req, res) => {
  try {
    const key = normalizeKey(req.body.key || req.body.name, 'template');
    const template = await Template.findOneAndUpdate(
      { key },
      {
        $set: {
          name: req.body.name || key,
          description: req.body.description || '',
          category: req.body.category || 'custom',
          status: req.body.status || 'active',
          countries: Array.isArray(req.body.countries) ? req.body.countries : [],
          tags: Array.isArray(req.body.tags) ? req.body.tags : [],
          configuration: req.body.configuration || {},
          updatedBy: req.user._id,
          metadata: req.body.metadata || {},
        },
        $setOnInsert: {
          key,
          createdBy: req.user._id,
        },
      },
      { upsert: true, new: true, runValidators: true }
    );

    await logOwnerAction(req, {
      action: 'template_saved',
      module: 'templates',
      resource: 'template',
      resourceId: template._id,
      resourceName: template.name,
      changes: { after: req.body },
    });

    return sendSuccess(res, 200, 'Template saved successfully', { template });
  } catch (error) {
    return sendError(res, 400, 'Failed to save template', error.message);
  }
};

exports.applyTemplate = async (req, res) => {
  try {
    const company = await Company.findById(req.params.id);
    if (!company) {
      return sendError(res, 404, 'Tenant not found');
    }

    const template = await Template.findOne({
      key: normalizeKey(req.body.templateKey || req.body.key),
      status: 'active',
    });
    if (!template) {
      return sendError(res, 404, 'Template not found');
    }

    const summary = await applyTemplateToTenant({
      companyId: company._id,
      template,
      actorUserId: req.user._id,
    });

    await logOwnerAction(req, {
      companyId: company._id,
      action: 'template_applied',
      module: 'templates',
      resource: 'tenant',
      resourceId: company._id,
      resourceName: company.name,
      changes: {
        after: {
          templateKey: template.key,
          summary,
        },
      },
    });

    return sendSuccess(res, 200, 'Template applied successfully', { summary, template });
  } catch (error) {
    return sendError(res, 500, 'Failed to apply template', error.message);
  }
};

exports.getBillingPlans = async (req, res) => {
  try {
    await ensureControlPlaneSeedData();
    const plans = await BillingPlanConfig.find({}).sort({ sortOrder: 1, name: 1 }).lean();
    return sendSuccess(res, 200, 'Billing plans fetched successfully', { plans });
  } catch (error) {
    return sendError(res, 500, 'Failed to fetch billing plans', error.message);
  }
};

exports.saveBillingPlan = async (req, res) => {
  try {
    const key = normalizeKey(req.body.key || req.body.name, 'starter');
    const plan = await BillingPlanConfig.findOneAndUpdate(
      { key },
      {
        $set: {
          name: req.body.name || key,
          description: req.body.description || '',
          priceMonthly: Number(req.body.priceMonthly || 0),
          priceYearly: Number(req.body.priceYearly || 0),
          userLimit: Number(req.body.userLimit || 10),
          branchLimit: Number(req.body.branchLimit || 2),
          featureAccess: req.body.featureAccess || {},
          isDefault: Boolean(req.body.isDefault),
          isActive: req.body.isActive !== false,
          sortOrder: Number(req.body.sortOrder || 0),
          metadata: req.body.metadata || {},
        },
        $setOnInsert: {
          key,
        },
      },
      { upsert: true, new: true, runValidators: true }
    );

    await logOwnerAction(req, {
      action: 'billing_plan_saved',
      module: 'billing',
      resource: 'billing_plan',
      resourceId: plan._id,
      resourceName: plan.name,
      changes: { after: req.body },
    });

    return sendSuccess(res, 200, 'Billing plan saved successfully', { plan });
  } catch (error) {
    return sendError(res, 400, 'Failed to save billing plan', error.message);
  }
};

exports.impersonateTenant = async (req, res) => {
  try {
    const company = await Company.findById(req.params.id).lean();
    if (!company) {
      return sendError(res, 404, 'Tenant not found');
    }

    const user =
      (await User.findOne({
        companyId: company._id,
        isActive: true,
        role: { $in: ['head_office_admin', 'admin', 'branch_manager'] },
      })
        .sort({ isHeadOffice: -1, createdAt: 1 })
        .select('-password')) ||
      (await User.findOne({ companyId: company._id, isActive: true })
        .sort({ createdAt: 1 })
        .select('-password'));

    if (!user) {
      return sendError(res, 404, 'No active tenant user available for impersonation');
    }

    await ensureCompanySaaSSetup(company._id);
    const serializedUser = await serializeTenantUser(user, company);
    const token = jwt.sign(
      {
        userId: user._id,
        companyId: company._id,
        role: user.role,
        primaryRoleKey: user.primaryRoleKey || user.role,
        email: user.email,
        impersonatedBy: req.user._id,
        ownerImpersonation: true,
      },
      JWT_SECRET,
      { expiresIn: '2h' }
    );

    await logOwnerAction(req, {
      companyId: company._id,
      action: 'tenant_impersonated',
      module: 'support',
      resource: 'tenant',
      resourceId: company._id,
      resourceName: company.name,
      changes: {
        after: {
          userId: user._id,
          userEmail: user.email,
        },
      },
    });

    return sendSuccess(res, 200, 'Impersonation token issued successfully', {
      token,
      user: serializedUser,
      company: {
        id: company._id,
        name: company.name,
        settings: company.settings,
      },
    });
  } catch (error) {
    return sendError(res, 500, 'Failed to impersonate tenant', error.message);
  }
};

exports.getAuditLogs = async (req, res) => {
  try {
    const query = {};
    if (req.query.tenantId) {
      query.companyId = req.query.tenantId;
    }
    if (req.query.module) {
      query.module = req.query.module;
    }
    if (req.query.action) {
      query.action = req.query.action;
    }

    const limit = Math.min(Number(req.query.limit || 100), 250);
    const logs = await AuditLog.find(query).sort({ createdAt: -1 }).limit(limit).lean();
    return sendSuccess(res, 200, 'Owner audit logs fetched successfully', { logs });
  } catch (error) {
    return sendError(res, 500, 'Failed to fetch owner audit logs', error.message);
  }
};
