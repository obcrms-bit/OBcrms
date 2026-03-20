const mongoose = require('mongoose');
const Company = require('../models/Company');
const Branch = require('../models/Branch');
const Lead = require('../models/Lead');
const PublicLeadForm = require('../models/PublicLeadForm');
const QRCode = require('../models/QRCode');
const WebsiteIntegrationSetting = require('../models/WebsiteIntegrationSetting');
const CountryWorkflow = require('../models/CountryWorkflow');
const { sendSuccess, sendError } = require('../utils/responseHandler');
const { calculateLeadScore } = require('../utils/leadScoring');
const { getEffectiveBranding } = require('../utils/branding');
const {
  findBestCounsellorMatch,
  normalizeCountryList,
} = require('../services/counsellorMatching.service');
const { runAutomationEvent } = require('../services/automation.service');
const { createNotification } = require('../services/notification.service');

const splitName = (value = '') => {
  const parts = String(value || '')
    .trim()
    .split(/\s+/)
    .filter(Boolean);

  return {
    name: parts.join(' '),
    firstName: parts[0] || 'Lead',
    lastName: parts.slice(1).join(' '),
  };
};

const normalizeArray = (value) =>
  Array.isArray(value)
    ? value.map((item) => String(item || '').trim()).filter(Boolean)
    : String(value || '')
      .split(',')
      .map((item) => item.trim())
      .filter(Boolean);

const normalizeDate = (value) => {
  const nextValue = value ? new Date(value) : null;
  return nextValue && !Number.isNaN(nextValue.getTime()) ? nextValue : undefined;
};

const buildAutoFollowUp = (workflow, actorName = 'System') => {
  if (!workflow?.followUpRules?.initialHours) {
    return null;
  }

  return {
    scheduledAt: new Date(Date.now() + workflow.followUpRules.initialHours * 60 * 60 * 1000),
    type: 'call',
    notes: `Auto-scheduled by ${workflow.country} workflow`,
    status: 'pending',
    counsellorName: actorName,
  };
};

const findDuplicateLead = async (companyId, payload) => {
  const conditions = [];
  if (payload.email) {
    conditions.push({ email: payload.email });
  }
  if (payload.mobile) {
    conditions.push({ mobile: payload.mobile }, { phone: payload.mobile });
  }

  if (!conditions.length) {
    return null;
  }

  return Lead.findOne({
    companyId,
    deletedAt: null,
    $or: conditions,
  }).select('name email phone mobile');
};

const resolveWorkflow = async (companyId, countries = []) => {
  const normalizedCountries = normalizeCountryList(countries);

  if (!normalizedCountries.length) {
    return null;
  }

  return CountryWorkflow.findOne({
    companyId,
    country: { $in: normalizedCountries },
    isActive: true,
  })
    .sort({ country: 1 })
    .lean();
};

const incrementFormView = async (formId) => {
  await PublicLeadForm.updateOne({ _id: formId }, { $inc: { 'analytics.views': 1 } });
};

exports.getBranding = async (req, res) => {
  try {
    let companyId = null;

    if (req.query.companyId && mongoose.Types.ObjectId.isValid(req.query.companyId)) {
      companyId = req.query.companyId;
    }

    if (!companyId && req.query.formSlug) {
      const form = await PublicLeadForm.findOne({ slug: req.query.formSlug }).select('companyId').lean();
      companyId = form?.companyId;
    }

    if (!companyId) {
      return sendError(res, 400, 'companyId or formSlug is required');
    }

    const company = await Company.findById(companyId).lean();
    const branch =
      req.query.branchId && mongoose.Types.ObjectId.isValid(req.query.branchId)
        ? await Branch.findOne({ _id: req.query.branchId, companyId: company._id }).lean()
        : null;

    return sendSuccess(res, 200, 'Branding fetched successfully', {
      branding: getEffectiveBranding(company, branch),
    });
  } catch (error) {
    return sendError(res, 400, 'Failed to fetch branding', error.message);
  }
};

exports.getPublicForm = async (req, res) => {
  try {
    const form = await PublicLeadForm.findOne({
      slug: req.params.slug,
      isActive: true,
    })
      .populate('branchId', 'name branding')
      .populate('defaultAssignedTo', 'name email')
      .lean();

    if (!form) {
      return sendError(res, 404, 'Public form not found');
    }

    const company = await Company.findById(form.companyId).lean();
    await incrementFormView(form._id);

    return sendSuccess(res, 200, 'Public form fetched successfully', {
      form,
      branding: getEffectiveBranding(company, form.branchId, form.brandingOverride),
    });
  } catch (error) {
    return sendError(res, 400, 'Failed to fetch public form', error.message);
  }
};

exports.submitPublicForm = async (req, res) => {
  try {
    const form = await PublicLeadForm.findOne({
      slug: req.params.slug,
      isActive: true,
    })
      .populate('branchId', 'name')
      .populate('defaultAssignedTo', 'name email')
      .lean();

    if (!form) {
      return sendError(res, 404, 'Public form not found');
    }

    const company = await Company.findById(form.companyId).lean();
    if (!company || !company.isActive) {
      return sendError(res, 404, 'Company not found');
    }

    const websiteIntegration =
      req.body.websiteIntegrationId && mongoose.Types.ObjectId.isValid(req.body.websiteIntegrationId)
        ? await WebsiteIntegrationSetting.findOne({
          _id: req.body.websiteIntegrationId,
          companyId: form.companyId,
          isActive: true,
        }).lean()
        : null;
    const qrCode =
      req.body.qrCodeId && mongoose.Types.ObjectId.isValid(req.body.qrCodeId)
        ? await QRCode.findOne({
          _id: req.body.qrCodeId,
          companyId: form.companyId,
          isActive: true,
        }).lean()
        : null;

    const requiredFields = new Set(form.requiredFields || []);
    const payload = {
      name: req.body.name,
      email: String(req.body.email || '').trim().toLowerCase(),
      mobile: String(req.body.mobile || req.body.phone || '').trim(),
      phone: String(req.body.phone || req.body.mobile || '').trim(),
      interestedFor: req.body.interestedFor,
      courseLevel: req.body.courseLevel,
      stream: req.body.stream,
      interestedCourse: req.body.interestedCourse,
      serviceType: req.body.serviceType === 'test_prep' ? 'test_prep' : 'consultancy',
      preferredCountries: normalizeArray(
        req.body.preferredCountries || form.targetCountries || form.defaultCountry
      ),
      preferredLocation: req.body.preferredLocation || '',
      notes: String(req.body.notes || '').trim(),
      dob: normalizeDate(req.body.dob),
    };

    const missingFields = [...requiredFields].filter((field) => {
      if (field === 'preferredCountries') {
        return !payload.preferredCountries.length;
      }
      return !String(req.body[field] || payload[field] || '').trim();
    });

    if (!payload.name || !payload.mobile) {
      missingFields.push(...['name', 'mobile'].filter((field) => !missingFields.includes(field)));
    }

    if (missingFields.length) {
      return sendError(res, 400, `Missing required fields: ${missingFields.join(', ')}`);
    }

    const duplicateLead = await findDuplicateLead(form.companyId, payload);
    if (duplicateLead) {
      return sendError(res, 409, 'Duplicate lead detected with the same email or mobile.', {
        duplicateLead,
      });
    }

    const workflow = await resolveWorkflow(form.companyId, payload.preferredCountries);
    const assignedCounsellor =
      form.defaultAssignedTo?._id ||
      websiteIntegration?.defaultAssignedTo ||
      (
        await findBestCounsellorMatch({
          companyId: form.companyId,
          branchId: websiteIntegration?.defaultBranchId || form.branchId?._id || form.branchId || null,
          preferredCountries: payload.preferredCountries,
        })
      )?.counsellor?._id ||
      null;

    const nameParts = splitName(payload.name);
    const lead = new Lead({
      ...nameParts,
      name: payload.name,
      email: payload.email || undefined,
      mobile: payload.mobile,
      phone: payload.phone || payload.mobile,
      branchId: websiteIntegration?.defaultBranchId || form.branchId?._id || form.branchId || null,
      branchName: form.branchId?.name || '',
      companyId: form.companyId,
      serviceType: payload.serviceType,
      entityType: payload.serviceType === 'test_prep' ? 'student' : 'client',
      interestedFor: payload.interestedFor || 'Counselling',
      courseLevel: payload.courseLevel || 'General',
      stream: payload.stream || 'General',
      interestedCourse: payload.interestedCourse || '',
      preferredCountries: payload.preferredCountries,
      preferredLocation: payload.preferredLocation || '',
      assignedCounsellor,
      assignedTo: assignedCounsellor,
      ownerUserId: assignedCounsellor || undefined,
      status: workflow?.leadStages?.[0]?.key || 'new',
      pipelineStage: workflow?.leadStages?.[0]?.key || 'new',
      source: form.defaultSource || 'website',
      sourceType: qrCode?._id ? 'qr_form' : form.sourceType || 'website_form',
      sourceMeta: {
        publicFormId: form._id,
        qrCodeId: qrCode?._id || null,
        websiteIntegrationId: websiteIntegration?._id || null,
        sourceLabel: websiteIntegration?.sourceLabel || form.sourceLabel,
        campaignTag: req.body.campaignTag || websiteIntegration?.campaignTag || form.campaignTag,
        pageUrl: req.body.pageUrl || '',
        referrer: req.get('referer') || '',
        userAgent: req.get('user-agent') || '',
      },
      metadata: {
        publicLeadFormId: form._id,
        sourceLabel: websiteIntegration?.sourceLabel || form.sourceLabel,
      },
    });

    if (payload.notes) {
      lead.notes.push({
        content: payload.notes,
      });
    }

    const autoFollowUp = buildAutoFollowUp(workflow, form.defaultAssignedTo?.name || 'System');
    if (autoFollowUp) {
      lead.followUps.push(autoFollowUp);
    }

    const { score, category } = calculateLeadScore(lead);
    lead.leadScore = score;
    lead.leadCategory = category;
    lead.activities.push({
      type: 'lead_created',
      description: `Lead submitted via ${qrCode?._id ? 'QR form' : 'public form'}`,
      metadata: {
        formId: form._id,
        qrCodeId: qrCode?._id || null,
        websiteIntegrationId: websiteIntegration?._id || null,
      },
    });

    await lead.save();

    await PublicLeadForm.updateOne(
      { _id: form._id },
      {
        $inc: { 'analytics.submissions': 1 },
        $set: { 'analytics.lastSubmittedAt': new Date() },
      }
    );

    if (websiteIntegration?._id) {
      await WebsiteIntegrationSetting.updateOne(
        { _id: websiteIntegration._id },
        {
          $inc: { 'analytics.submissions': 1 },
          $set: { 'analytics.lastSubmittedAt': new Date() },
        }
      );
    }

    if (qrCode?._id) {
      await QRCode.updateOne({ _id: qrCode._id }, { $inc: { submissionCount: 1 } });
    }

    if (assignedCounsellor) {
      await createNotification({
        companyId: form.companyId,
        branchId: lead.branchId,
        userId: assignedCounsellor,
        type: 'crm',
        title: 'New website enquiry assigned',
        message: `${lead.name} submitted an enquiry via ${qrCode?._id ? 'QR form' : 'public form'}.`,
        entityType: 'lead',
        entityId: lead._id,
        metadata: {
          sourceType: lead.sourceType,
        },
      });
    }

    await runAutomationEvent({
      companyId: form.companyId,
      branchId: lead.branchId,
      triggerEvent: 'public_form.submitted',
      module: 'leads',
      target: lead,
      context: {
        preferredCountries: lead.preferredCountries,
        sourceType: lead.sourceType,
      },
    });
    await runAutomationEvent({
      companyId: form.companyId,
      branchId: lead.branchId,
      triggerEvent: 'lead.created',
      module: 'leads',
      target: lead,
      context: {
        preferredCountries: lead.preferredCountries,
        sourceType: lead.sourceType,
      },
    });

    return sendSuccess(res, 201, 'Lead submitted successfully', {
      thankYouMessage: form.thankYouMessage,
      leadId: lead._id,
    });
  } catch (error) {
    return sendError(res, 400, 'Failed to submit public form', error.message);
  }
};

exports.getQRCodeLanding = async (req, res) => {
  try {
    const qrCode = await QRCode.findOne({
      _id: req.params.id,
      isActive: true,
    })
      .populate('formId', 'name slug title description companyId branchId brandingOverride')
      .lean();

    if (!qrCode) {
      return sendError(res, 404, 'QR code not found');
    }

    const company = await Company.findById(qrCode.companyId).lean();
    const branch = qrCode.branchId
      ? await Branch.findById(qrCode.branchId).lean()
      : qrCode.formId?.branchId
        ? await Branch.findById(qrCode.formId.branchId).lean()
        : null;

    await QRCode.updateOne({ _id: qrCode._id }, { $inc: { scanCount: 1 } });

    const frontendUrl = String(process.env.FRONTEND_URL || '').replace(/\/$/, '');

    return sendSuccess(res, 200, 'QR code fetched successfully', {
      qrCode,
      redirectUrl: `${frontendUrl}/forms/${qrCode.formId.slug}?qr=${qrCode._id}`,
      branding: getEffectiveBranding(company, branch, qrCode.formId.brandingOverride),
    });
  } catch (error) {
    return sendError(res, 400, 'Failed to fetch QR code', error.message);
  }
};
