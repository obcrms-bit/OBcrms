const mongoose = require('mongoose');
const QRCodeGenerator = require('qrcode');
const Company = require('../models/Company');
const Branch = require('../models/Branch');
const IntegrationSetting = require('../models/IntegrationSetting');
const WebsiteIntegrationSetting = require('../models/WebsiteIntegrationSetting');
const AutomationRule = require('../models/AutomationRule');
const AutomationLog = require('../models/AutomationLog');
const PublicLeadForm = require('../models/PublicLeadForm');
const QRCode = require('../models/QRCode');
const Invoice = require('../models/Invoice');
const Commission = require('../models/Commission');
const AuditLog = require('../models/AuditLog');
const { sendSuccess, sendError } = require('../utils/responseHandler');
const { getEffectiveBranding, normalizeBranding } = require('../utils/branding');
const { getEffectiveSubscription, getPlanConfig } = require('../services/subscription.service');
const { getUserBranchIds, mergeFiltersWithAnd } = require('../services/accessControl.service');

const FRONTEND_BASE_URL = String(
  process.env.FRONTEND_URL || 'https://your-frontend-domain.vercel.app'
).replace(/\/$/, '');

const SENSITIVE_KEY_REGEX = /(password|secret|token|key|client_secret|smtp_pass)/i;

const slugify = (value) =>
  String(value || '')
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '') || `form-${Date.now()}`;

const parseArray = (value) =>
  Array.isArray(value)
    ? value.map((item) => String(item || '').trim()).filter(Boolean)
    : String(value || '')
      .split(',')
      .map((item) => item.trim())
      .filter(Boolean);

const toObjectId = (value) =>
  value && mongoose.Types.ObjectId.isValid(value) ? new mongoose.Types.ObjectId(value) : null;

const maskSensitiveConfig = (value) => {
  if (Array.isArray(value)) {
    return value.map(maskSensitiveConfig);
  }

  if (!value || typeof value !== 'object') {
    return value;
  }

  return Object.entries(value).reduce((accumulator, [key, nestedValue]) => {
    accumulator[key] = SENSITIVE_KEY_REGEX.test(key) ? '********' : maskSensitiveConfig(nestedValue);
    return accumulator;
  }, {});
};

const resolveBranchScope = async (req, branchId) => {
  if (!branchId) {
    return null;
  }

  if (!mongoose.Types.ObjectId.isValid(branchId)) {
    throw new Error('Invalid branchId');
  }

  const branch = await Branch.findOne({
    _id: branchId,
    companyId: req.companyId,
    deletedAt: null,
  });

  if (!branch) {
    throw new Error('Branch not found');
  }

  if (req.user?.effectiveAccess?.isHeadOffice) {
    return branch;
  }

  const allowedBranchIds = getUserBranchIds(req.user);
  if (!allowedBranchIds.includes(String(branch._id))) {
    throw new Error('You do not have access to this branch');
  }

  return branch;
};

const buildScopedFilter = (req, explicitBranchId = null) => {
  const companyFilter = { companyId: req.companyId };
  const branchIds = getUserBranchIds(req.user);

  if (explicitBranchId) {
    return { ...companyFilter, branchId: explicitBranchId };
  }

  if (req.user?.effectiveAccess?.isHeadOffice || !branchIds.length) {
    return companyFilter;
  }

  return mergeFiltersWithAnd(companyFilter, {
    $or: [{ branchId: null }, { branchId: { $in: branchIds } }],
  });
};

const logAudit = async (req, action, module, target, changes = {}) => {
  await AuditLog.logAction({
    companyId: req.companyId,
    branchId: req.user?.branchId?._id || req.user?.branchId || target?.branchId || null,
    userId: req.user._id,
    userName: req.user.name,
    userEmail: req.user.email,
    userRole: req.user.role,
    action,
    actionType: module,
    module,
    resource: module,
    resourceId: target?._id,
    targetId: target?._id,
    resourceName: target?.name || target?.label || target?.title || target?.country || module,
    changes,
  });
};

const buildEmbedSnippet = (form, integrationSetting) => {
  const hostedUrl = `${FRONTEND_BASE_URL}/forms/${form.slug}`;
  const iframeSnippet = `<iframe src="${hostedUrl}" title="${form.title || form.name}" style="width:100%;min-height:720px;border:0;border-radius:18px;"></iframe>`;

  if (integrationSetting.embedMode === 'script') {
    return `<div id="trust-form-${integrationSetting._id}"></div><script>(function(){var root=document.getElementById('trust-form-${integrationSetting._id}');if(!root)return;var iframe=document.createElement('iframe');iframe.src='${hostedUrl}';iframe.title='${form.title || form.name}';iframe.style.width='100%';iframe.style.minHeight='720px';iframe.style.border='0';iframe.style.borderRadius='18px';root.appendChild(iframe);})();</script>`;
  }

  if (integrationSetting.embedMode === 'popup') {
    return `<button type="button" onclick="window.open('${hostedUrl}','trust-form','width=520,height=760')">Open enquiry form</button>`;
  }

  if (integrationSetting.embedMode === 'hosted_url') {
    return hostedUrl;
  }

  return iframeSnippet;
};

exports.getBranding = async (req, res) => {
  try {
    const branch = await resolveBranchScope(req, req.query.branchId).catch(() => null);
    const company = await Company.findById(req.companyId).lean();

    if (!company) {
      return sendError(res, 404, 'Company not found');
    }

    const effectiveBranding = getEffectiveBranding(company, branch);

    return sendSuccess(res, 200, 'Branding fetched successfully', {
      company: {
        id: company._id,
        name: company.name,
      },
      branch,
      tenantBranding: getEffectiveBranding(company),
      branchBranding: branch?.branding || null,
      effectiveBranding,
    });
  } catch (error) {
    return sendError(res, 400, 'Failed to fetch branding', error.message);
  }
};

exports.updateBranding = async (req, res) => {
  try {
    const scope = String(req.body.scope || 'tenant').toLowerCase();
    const normalizedBranding = normalizeBranding(req.body);

    if (scope === 'branch') {
      const branch = await resolveBranchScope(req, req.body.branchId || req.query.branchId);
      branch.branding = {
        ...(branch.branding || {}),
        ...normalizedBranding,
        inheritFromTenant: req.body.inheritFromTenant !== false,
        branchName: req.body.branchName || branch.branding?.branchName || branch.name,
      };
      await branch.save();
      await logAudit(req, 'branding_updated', 'branding', branch, { after: branch.branding });
      const company = await Company.findById(req.companyId).lean();
      return sendSuccess(res, 200, 'Branch branding updated', {
        branch,
        effectiveBranding: getEffectiveBranding(company, branch),
      });
    }

    const company = await Company.findByIdAndUpdate(
      req.companyId,
      {
        $set: {
          name: req.body.companyName || undefined,
          'settings.logo': normalizedBranding.logo,
          'settings.favicon': normalizedBranding.favicon,
          'settings.primaryColor': normalizedBranding.primaryColor,
          'settings.secondaryColor': normalizedBranding.secondaryColor,
          'settings.accentColor': normalizedBranding.accentColor,
          'settings.fontFamily': normalizedBranding.fontFamily,
          'settings.loginHeading': normalizedBranding.loginHeading,
          'settings.loginSubheading': normalizedBranding.loginSubheading,
          'settings.supportEmail': req.body.supportEmail || undefined,
          'settings.theme': req.body.theme || undefined,
        },
      },
      { new: true, runValidators: true }
    ).lean();

    await logAudit(req, 'branding_updated', 'branding', company, { after: company?.settings || {} });

    return sendSuccess(res, 200, 'Tenant branding updated', {
      company,
      effectiveBranding: getEffectiveBranding(company),
    });
  } catch (error) {
    return sendError(res, 400, 'Failed to update branding', error.message);
  }
};

exports.getIntegrations = async (req, res) => {
  try {
    const branch = await resolveBranchScope(req, req.query.branchId).catch(() => null);
    const integrations = await IntegrationSetting.find(buildScopedFilter(req, branch?._id || null))
      .sort({ type: 1, provider: 1 })
      .lean();

    return sendSuccess(res, 200, 'Integrations fetched successfully', {
      integrations: integrations.map((integration) => ({
        ...integration,
        config: maskSensitiveConfig(integration.config || {}),
      })),
    });
  } catch (error) {
    return sendError(res, 400, 'Failed to fetch integrations', error.message);
  }
};

exports.saveIntegration = async (req, res) => {
  try {
    const branch = await resolveBranchScope(req, req.body.branchId || req.query.branchId).catch(
      () => null
    );
    const integration = await IntegrationSetting.findOneAndUpdate(
      {
        companyId: req.companyId,
        type: String(req.body.type || '').toLowerCase(),
        provider: String(req.body.provider || '').toLowerCase(),
        branchId: branch?._id || null,
      },
      {
        $set: {
          label: req.body.label || req.body.provider,
          isEnabled: req.body.isEnabled !== false,
          config: req.body.config || {},
          metadata: req.body.metadata || {},
          updatedBy: req.user._id,
        },
        $setOnInsert: {
          createdBy: req.user._id,
          companyId: req.companyId,
          branchId: branch?._id || null,
        },
      },
      { new: true, upsert: true, runValidators: true }
    );

    await logAudit(req, 'integration_saved', 'integrations', integration, { after: req.body });

    return sendSuccess(res, 200, 'Integration saved successfully', {
      integration: {
        ...integration.toObject(),
        config: maskSensitiveConfig(integration.config || {}),
      },
    });
  } catch (error) {
    return sendError(res, 400, 'Failed to save integration', error.message);
  }
};

exports.getAutomations = async (req, res) => {
  try {
    const branch = await resolveBranchScope(req, req.query.branchId).catch(() => null);
    const [rules, logs] = await Promise.all([
      AutomationRule.find(buildScopedFilter(req, branch?._id || null)).sort({ updatedAt: -1 }).lean(),
      AutomationLog.find(buildScopedFilter(req, branch?._id || null)).sort({ runAt: -1 }).limit(50).lean(),
    ]);

    return sendSuccess(res, 200, 'Automations fetched successfully', {
      rules,
      logs,
    });
  } catch (error) {
    return sendError(res, 400, 'Failed to fetch automations', error.message);
  }
};

exports.saveAutomation = async (req, res) => {
  try {
    const branch = await resolveBranchScope(req, req.body.branchId || req.query.branchId).catch(
      () => null
    );
    const payload = {
      name: req.body.name,
      module: String(req.body.module || 'leads').toLowerCase(),
      triggerEvent: String(req.body.triggerEvent || 'lead.created').toLowerCase(),
      conditions: Array.isArray(req.body.conditions) ? req.body.conditions : [],
      actions: Array.isArray(req.body.actions) ? req.body.actions : [],
      isActive: req.body.isActive !== false,
      updatedBy: req.user._id,
    };

    if (!payload.name) {
      return sendError(res, 400, 'Automation name is required');
    }

    const automation = req.body.id
      ? await AutomationRule.findOneAndUpdate(
        { _id: req.body.id, companyId: req.companyId },
        {
          $set: payload,
        },
        { new: true, runValidators: true }
      )
      : await AutomationRule.create({
        ...payload,
        companyId: req.companyId,
        branchId: branch?._id || null,
        createdBy: req.user._id,
      });

    await logAudit(req, 'automation_saved', 'automations', automation, { after: payload });

    return sendSuccess(res, 200, 'Automation saved successfully', { automation });
  } catch (error) {
    return sendError(res, 400, 'Failed to save automation', error.message);
  }
};

exports.getPublicForms = async (req, res) => {
  try {
    const branch = await resolveBranchScope(req, req.query.branchId).catch(() => null);
    const forms = await PublicLeadForm.find(buildScopedFilter(req, branch?._id || null))
      .populate('branchId', 'name')
      .populate('defaultAssignedTo', 'name email')
      .sort({ updatedAt: -1 })
      .lean();

    return sendSuccess(res, 200, 'Public forms fetched successfully', { forms });
  } catch (error) {
    return sendError(res, 400, 'Failed to fetch public forms', error.message);
  }
};

exports.savePublicForm = async (req, res) => {
  try {
    const branch = await resolveBranchScope(req, req.body.branchId || req.query.branchId).catch(
      () => null
    );
    const payload = {
      name: req.body.name,
      slug: slugify(req.body.slug || req.body.name),
      title: req.body.title || req.body.name,
      description: req.body.description || '',
      visibleFields: parseArray(req.body.visibleFields),
      requiredFields: parseArray(req.body.requiredFields),
      defaultCountry: req.body.defaultCountry || '',
      defaultAssignedTo: toObjectId(req.body.defaultAssignedTo),
      defaultSource: req.body.defaultSource || 'website',
      sourceType: req.body.sourceType || 'website_form',
      sourceLabel: req.body.sourceLabel || 'Website Form',
      campaignTag: req.body.campaignTag || '',
      targetCountries: parseArray(req.body.targetCountries),
      thankYouMessage: req.body.thankYouMessage || 'Thank you. Our team will contact you shortly.',
      brandingOverride: req.body.brandingOverride || {},
      isActive: req.body.isActive !== false,
      updatedBy: req.user._id,
    };

    if (!payload.name) {
      return sendError(res, 400, 'Form name is required');
    }

    const form = req.body.id
      ? await PublicLeadForm.findOneAndUpdate(
        { _id: req.body.id, companyId: req.companyId },
        {
          $set: {
            ...payload,
            branchId: branch?._id || null,
          },
        },
        { new: true, runValidators: true }
      )
      : await PublicLeadForm.create({
        ...payload,
        companyId: req.companyId,
        branchId: branch?._id || null,
        createdBy: req.user._id,
      });

    await logAudit(req, 'public_form_saved', 'publicforms', form, { after: payload });

    return sendSuccess(res, 200, 'Public form saved successfully', { form });
  } catch (error) {
    return sendError(res, 400, 'Failed to save public form', error.message);
  }
};

exports.getWebsiteIntegrations = async (req, res) => {
  try {
    const branch = await resolveBranchScope(req, req.query.branchId).catch(() => null);
    const integrations = await WebsiteIntegrationSetting.find(buildScopedFilter(req, branch?._id || null))
      .populate('formId', 'name slug title')
      .populate('defaultBranchId', 'name')
      .populate('defaultAssignedTo', 'name email')
      .sort({ updatedAt: -1 })
      .lean();

    return sendSuccess(res, 200, 'Website integrations fetched successfully', { integrations });
  } catch (error) {
    return sendError(res, 400, 'Failed to fetch website integrations', error.message);
  }
};

exports.saveWebsiteIntegration = async (req, res) => {
  try {
    const branch = await resolveBranchScope(req, req.body.branchId || req.query.branchId).catch(
      () => null
    );
    const form = await PublicLeadForm.findOne({
      _id: req.body.formId,
      companyId: req.companyId,
    });

    if (!form) {
      return sendError(res, 404, 'Public form not found');
    }

    const integration = req.body.id
      ? await WebsiteIntegrationSetting.findOne({ _id: req.body.id, companyId: req.companyId })
      : new WebsiteIntegrationSetting({ companyId: req.companyId });

    integration.branchId = branch?._id || null;
    integration.formId = form._id;
    integration.widgetType = req.body.widgetType || 'inline_form';
    integration.embedMode = req.body.embedMode || 'iframe';
    integration.targetCountries = parseArray(req.body.targetCountries);
    integration.defaultAssignedTo = toObjectId(req.body.defaultAssignedTo);
    integration.defaultBranchId = toObjectId(req.body.defaultBranchId) || branch?._id || null;
    integration.sourceLabel = req.body.sourceLabel || 'Website';
    integration.campaignTag = req.body.campaignTag || '';
    integration.allowedDomains = parseArray(req.body.allowedDomains);
    integration.webhookUrl = req.body.webhookUrl || '';
    integration.themeMode = req.body.themeMode || 'tenant';
    integration.widgetConfig = req.body.widgetConfig || {};
    integration.isActive = req.body.isActive !== false;
    integration.updatedBy = req.user._id;
    if (!integration.createdBy) {
      integration.createdBy = req.user._id;
    }

    integration.embedSnippet = buildEmbedSnippet(form, integration);
    await integration.save();

    await logAudit(req, 'website_integration_saved', 'websiteintegration', integration, {
      after: req.body,
    });

    return sendSuccess(res, 200, 'Website integration saved successfully', { integration });
  } catch (error) {
    return sendError(res, 400, 'Failed to save website integration', error.message);
  }
};

exports.getQRCodes = async (req, res) => {
  try {
    const branch = await resolveBranchScope(req, req.query.branchId).catch(() => null);
    const qrCodes = await QRCode.find(buildScopedFilter(req, branch?._id || null))
      .populate('formId', 'name slug title')
      .populate('branchId', 'name')
      .sort({ createdAt: -1 })
      .lean();

    return sendSuccess(res, 200, 'QR codes fetched successfully', { qrCodes });
  } catch (error) {
    return sendError(res, 400, 'Failed to fetch QR codes', error.message);
  }
};

exports.createQRCode = async (req, res) => {
  try {
    const branch = await resolveBranchScope(req, req.body.branchId || req.query.branchId).catch(
      () => null
    );
    const form = await PublicLeadForm.findOne({
      _id: req.body.formId,
      companyId: req.companyId,
    });

    if (!form) {
      return sendError(res, 404, 'Public form not found');
    }

    const qrCode = await QRCode.create({
      companyId: req.companyId,
      branchId: branch?._id || form.branchId || null,
      formId: form._id,
      label: req.body.label || `${form.name} QR`,
      targetUrl: `${FRONTEND_BASE_URL}/qr/${new mongoose.Types.ObjectId()}`,
      campaignId: req.body.campaignId || '',
      targetCountries: parseArray(req.body.targetCountries),
      createdBy: req.user._id,
    });

    qrCode.targetUrl = `${FRONTEND_BASE_URL}/qr/${qrCode._id}`;
    qrCode.imageUrl = await QRCodeGenerator.toDataURL(qrCode.targetUrl, {
      margin: 1,
      width: 720,
      color: {
        dark: '#0f172a',
        light: '#ffffff',
      },
    });
    await qrCode.save();

    await logAudit(req, 'qr_generated', 'qrcodes', qrCode, { after: { formId: form._id } });

    return sendSuccess(res, 201, 'QR code generated successfully', { qrCode });
  } catch (error) {
    return sendError(res, 400, 'Failed to generate QR code', error.message);
  }
};

exports.getBillingOverview = async (req, res) => {
  try {
    const branch = await resolveBranchScope(req, req.query.branchId).catch(() => null);
    const filter = buildScopedFilter(req, branch?._id || null);
    const [subscription, invoices, commissions] = await Promise.all([
      getEffectiveSubscription(req.companyId),
      Invoice.find(filter).sort({ createdAt: -1 }).limit(20).lean(),
      Commission.find(filter).sort({ createdAt: -1 }).limit(20).lean(),
    ]);

    const invoiceSummary = invoices.reduce(
      (accumulator, invoice) => {
        accumulator.total += Number(invoice.totalAmount || 0);
        if (invoice.status === 'paid') {
          accumulator.paid += Number(invoice.totalAmount || 0);
        }
        if (['sent', 'draft', 'overdue', 'partially-paid'].includes(invoice.status)) {
          accumulator.outstanding += Number(invoice.totalAmount || 0);
        }
        return accumulator;
      },
      { total: 0, paid: 0, outstanding: 0 }
    );

    const commissionSummary = commissions.reduce(
      (accumulator, commission) => {
        accumulator.total += Number(commission.amount || 0);
        if (commission.status === 'paid') {
          accumulator.paid += Number(commission.amount || 0);
        }
        if (commission.status === 'pending') {
          accumulator.pending += Number(commission.amount || 0);
        }
        return accumulator;
      },
      { total: 0, paid: 0, pending: 0 }
    );

    return sendSuccess(res, 200, 'Billing overview fetched successfully', {
      subscription,
      planConfig: getPlanConfig(subscription.plan),
      invoiceSummary,
      commissionSummary,
      recentInvoices: invoices,
      recentCommissions: commissions,
      paymentHistory: subscription.paymentHistory || [],
    });
  } catch (error) {
    return sendError(res, 400, 'Failed to fetch billing overview', error.message);
  }
};
