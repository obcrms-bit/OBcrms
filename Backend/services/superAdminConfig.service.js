const Company = require('../models/Company');
const Subscription = require('../models/Subscription');
const Template = require('../models/Template');
const Role = require('../models/Role');
const CountryWorkflow = require('../models/CountryWorkflow');
const PublicLeadForm = require('../models/PublicLeadForm');
const AutomationRule = require('../models/AutomationRule');
const NotificationTemplate = require('../models/NotificationTemplate');
const DashboardConfig = require('../models/DashboardConfig');
const AssignmentRuleConfig = require('../models/AssignmentRuleConfig');
const BillingPlanConfig = require('../models/BillingPlanConfig');
const { ensureCompanySaaSSetup } = require('./tenantProvisioning.service');
const { PLAN_CONFIG, getPlanConfig } = require('./subscription.service');

const normalizeKey = (value, fallback = 'config') =>
  String(value || fallback)
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '') || fallback;

const slugify = (value, fallback = 'item') =>
  String(value || fallback)
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '') || fallback;

const DEFAULT_BILLING_PLANS = [
  {
    key: 'starter',
    name: 'Starter',
    description: 'Entry-level CRM + ERP for smaller consultancies.',
    priceMonthly: 79,
    priceYearly: 790,
    userLimit: PLAN_CONFIG.starter.userLimit,
    branchLimit: PLAN_CONFIG.starter.branchLimit,
    featureAccess: PLAN_CONFIG.starter.featureAccess,
    isDefault: true,
    sortOrder: 1,
  },
  {
    key: 'growth',
    name: 'Growth',
    description: 'Operational automation, workflows, branding, and imports for scaling teams.',
    priceMonthly: 199,
    priceYearly: 1990,
    userLimit: PLAN_CONFIG.growth.userLimit,
    branchLimit: PLAN_CONFIG.growth.branchLimit,
    featureAccess: PLAN_CONFIG.growth.featureAccess,
    sortOrder: 2,
  },
  {
    key: 'enterprise',
    name: 'Enterprise',
    description: 'Full multi-branch, branded, workflow-rich SaaS for enterprise consultancies.',
    priceMonthly: 499,
    priceYearly: 4990,
    userLimit: PLAN_CONFIG.enterprise.userLimit,
    branchLimit: PLAN_CONFIG.enterprise.branchLimit,
    featureAccess: PLAN_CONFIG.enterprise.featureAccess,
    sortOrder: 3,
  },
];

const buildDefaultTemplates = () => [
  {
    key: 'europe_consultancy',
    name: 'Europe Consultancy',
    description: 'UK and Europe focused consulting workflow with document-heavy applications.',
    category: 'regional',
    countries: ['United Kingdom', 'Germany', 'France'],
    tags: ['europe', 'consultancy', 'offers'],
    configuration: {
      branding: {
        primaryColor: '#1d4ed8',
        secondaryColor: '#0f172a',
        accentColor: '#38bdf8',
        fontFamily: 'Poppins',
      },
      workflows: [
        {
          country: 'United Kingdom',
          leadStages: ['Enquiry', 'Counselling', 'Conditional Offer', 'Final Offer', 'Visa'],
          applicationStages: ['Draft', 'Submitted', 'Offer', 'CAS', 'Visa', 'Completed'],
          documentChecklist: ['Passport', 'Academic Transcript', 'English Score', 'Statement of Purpose'],
          followUpRules: { initialHours: 6, recurringHours: 48, overdueReminderHours: 24 },
          slaRules: { firstResponseHours: 4, firstFollowUpHours: 8, offerDecisionHours: 72 },
        },
        {
          country: 'Germany',
          leadStages: ['Enquiry', 'Counselling', 'Eligibility', 'Docs', 'Visa'],
          applicationStages: ['Draft', 'University Review', 'Offer', 'APS', 'Visa'],
          documentChecklist: ['Passport', 'Academic Transcript', 'Blocked Account', 'Language Proof'],
          followUpRules: { initialHours: 8, recurringHours: 72, overdueReminderHours: 24 },
          slaRules: { firstResponseHours: 6, firstFollowUpHours: 12, offerDecisionHours: 96 },
        },
      ],
      featureFlags: {
        advancedWorkflows: true,
        publicForms: true,
        websiteIntegration: true,
        qrForms: true,
        reports: true,
      },
      publicForms: [
        {
          name: 'UK Counselling Inquiry',
          slug: 'uk-counselling-inquiry',
          title: 'Study in the UK Consultation',
          description: 'Capture UK and Europe-bound students with a guided intake form.',
          visibleFields: ['name', 'email', 'mobile', 'preferredCountries', 'interestedCourse'],
          requiredFields: ['name', 'mobile', 'preferredCountries'],
          defaultCountry: 'United Kingdom',
          defaultSource: 'website_form',
        },
      ],
      dashboard: {
        widgets: [
          { key: 'conversion_funnel', title: 'Conversion Funnel', module: 'reports', type: 'chart' },
          { key: 'overdue_followups', title: 'Overdue Follow-ups', module: 'followups', type: 'table' },
          { key: 'offers_pending', title: 'Offers Pending', module: 'applications', type: 'metric' },
        ],
      },
      notificationTemplates: [
        {
          key: 'uk_offer_followup',
          name: 'UK Offer Follow-up',
          channel: 'email',
          module: 'followups',
          subject: 'Offer follow-up required for {{leadName}}',
          body: 'Please review the latest offer status and schedule the next contact.',
          variables: ['leadName', 'assigneeName', 'nextFollowUpDate'],
        },
      ],
      assignmentRules: [
        {
          key: 'uk_country_match',
          name: 'UK Counsellor Matching',
          country: 'United Kingdom',
          strategy: 'least_workload',
        },
      ],
    },
  },
  {
    key: 'japan_us_canada',
    name: 'Japan / US / Canada',
    description: 'Country-specific workflows for mixed North America and Japan operations.',
    category: 'regional',
    countries: ['Japan', 'United States', 'Canada'],
    tags: ['north-america', 'japan', 'visa'],
    configuration: {
      branding: {
        primaryColor: '#7c3aed',
        secondaryColor: '#111827',
        accentColor: '#f59e0b',
        fontFamily: 'Manrope',
      },
      workflows: [
        {
          country: 'Canada',
          leadStages: ['Enquiry', 'Counselling', 'Docs', 'Submission', 'PAL', 'Visa'],
          applicationStages: ['Draft', 'Submitted', 'Offer', 'PAL', 'Visa', 'Completed'],
          documentChecklist: ['Passport', 'Transcripts', 'English Score', 'GIC', 'SOP'],
          followUpRules: { initialHours: 4, recurringHours: 36, overdueReminderHours: 18 },
          slaRules: { firstResponseHours: 4, firstFollowUpHours: 8, offerDecisionHours: 72 },
        },
        {
          country: 'Japan',
          leadStages: ['Enquiry', 'Counselling', 'Docs', 'School Review', 'COE', 'Visa'],
          applicationStages: ['Draft', 'School Review', 'COE', 'Visa', 'Completed'],
          documentChecklist: ['Passport', 'Academic Transcript', 'Bank Statement', 'Language Record'],
          followUpRules: { initialHours: 8, recurringHours: 48, overdueReminderHours: 24 },
          slaRules: { firstResponseHours: 6, firstFollowUpHours: 12, offerDecisionHours: 96 },
        },
      ],
      featureFlags: {
        advancedWorkflows: true,
        publicForms: true,
        websiteIntegration: true,
        automations: true,
        reports: true,
      },
      automations: [
        {
          key: 'lead_created_country_assignment',
          name: 'Assign counsellor by country and workload',
          module: 'leads',
          triggerEvent: 'lead.created',
          conditions: [{ field: 'preferredCountries', operator: 'exists' }],
          actions: [{ type: 'assign_country_counsellor' }],
          isActive: true,
        },
      ],
      dashboard: {
        widgets: [
          { key: 'country_performance', title: 'Country Performance', module: 'reports', type: 'chart' },
          { key: 'visa_pipeline', title: 'Visa Pipeline', module: 'applications', type: 'kanban' },
        ],
      },
    },
  },
  {
    key: 'ielts_pte_academy',
    name: 'IELTS / PTE Academy',
    description: 'Test-prep focused student operations template with course and batch follow-up logic.',
    category: 'test_prep',
    countries: ['Nepal', 'Australia', 'United Kingdom'],
    tags: ['test-prep', 'ielts', 'pte'],
    configuration: {
      branding: {
        primaryColor: '#059669',
        secondaryColor: '#022c22',
        accentColor: '#34d399',
        fontFamily: 'Nunito Sans',
      },
      workflows: [
        {
          country: 'Australia',
          leadStages: ['Enquiry', 'Counselling', 'Class Demo', 'Enrolled'],
          applicationStages: ['Draft', 'Completed'],
          documentChecklist: ['Photo', 'Placement Test', 'Fee Confirmation'],
          followUpRules: { initialHours: 2, recurringHours: 24, overdueReminderHours: 12 },
          slaRules: { firstResponseHours: 2, firstFollowUpHours: 4, offerDecisionHours: 24 },
        },
      ],
      featureFlags: {
        publicForms: true,
        websiteIntegration: true,
        reports: true,
        billing: true,
      },
      publicForms: [
        {
          name: 'IELTS Class Enquiry',
          slug: 'ielts-class-enquiry',
          title: 'Book Your IELTS / PTE Consultation',
          description: 'Collect quick training leads and route them to the right counsellor.',
          visibleFields: ['name', 'email', 'mobile', 'preferredCountries', 'interestedCourse'],
          requiredFields: ['name', 'mobile'],
          defaultCountry: 'Australia',
          defaultSource: 'website_widget',
        },
      ],
      dashboard: {
        widgets: [
          { key: 'batch_enquiries', title: 'Class Enquiries', module: 'leads', type: 'metric' },
          { key: 'today_followups', title: 'Today Follow-ups', module: 'followups', type: 'table' },
        ],
      },
    },
  },
  {
    key: 'global_consultancy',
    name: 'Global Consultancy',
    description: 'Broad multi-country operating model for high-volume, multi-branch consultancies.',
    category: 'global',
    countries: ['Australia', 'United Kingdom', 'Canada', 'United States'],
    tags: ['global', 'enterprise', 'multi-branch'],
    configuration: {
      branding: {
        primaryColor: '#0f766e',
        secondaryColor: '#0f172a',
        accentColor: '#2dd4bf',
        fontFamily: 'DM Sans',
      },
      workflows: [
        {
          country: 'Australia',
          leadStages: ['Enquiry', 'Counselling', 'Docs', 'Lodge', 'Visa'],
          applicationStages: ['Draft', 'Submitted', 'Offer', 'COE', 'Visa', 'Completed'],
          documentChecklist: ['Passport', 'Transcripts', 'English Score', 'SOP', 'Financials'],
          followUpRules: { initialHours: 4, recurringHours: 48, overdueReminderHours: 24 },
          slaRules: { firstResponseHours: 4, firstFollowUpHours: 8, offerDecisionHours: 72 },
        },
        {
          country: 'United States',
          leadStages: ['Enquiry', 'Counselling', 'Applications', 'Interview', 'Visa'],
          applicationStages: ['Draft', 'Submitted', 'I20', 'Interview', 'Visa', 'Completed'],
          documentChecklist: ['Passport', 'Academic Records', 'English Score', 'Financials', 'Essays'],
          followUpRules: { initialHours: 6, recurringHours: 48, overdueReminderHours: 24 },
          slaRules: { firstResponseHours: 4, firstFollowUpHours: 8, offerDecisionHours: 96 },
        },
      ],
      featureFlags: {
        bulkImports: true,
        advancedWorkflows: true,
        notifications: true,
        reports: true,
        transfers: true,
        commissions: true,
        customBranding: true,
        automations: true,
        publicForms: true,
        websiteIntegration: true,
        qrForms: true,
        billing: true,
      },
      automations: [
        {
          key: 'website_form_assign',
          name: 'Assign website leads by country',
          module: 'leads',
          triggerEvent: 'public_form.submitted',
          conditions: [{ field: 'sourceType', operator: 'equals', value: 'website_form' }],
          actions: [{ type: 'assign_country_counsellor' }, { type: 'notify_assignee' }],
          isActive: true,
        },
      ],
      dashboard: {
        widgets: [
          { key: 'revenue', title: 'Revenue', module: 'billing', type: 'metric' },
          { key: 'branch_performance', title: 'Branch Performance', module: 'reports', type: 'chart' },
          { key: 'sla_risk', title: 'SLA Risk', module: 'reports', type: 'table' },
        ],
      },
      assignmentRules: [
        {
          key: 'global_country_workload',
          name: 'Country workload balancing',
          strategy: 'least_workload',
        },
      ],
      notificationTemplates: [
        {
          key: 'daily_branch_digest',
          name: 'Daily Branch Digest',
          channel: 'email',
          module: 'notifications',
          subject: 'Daily branch summary for {{branchName}}',
          body: 'Review overdue follow-ups, pending approvals, and new website leads.',
          variables: ['branchName', 'overdueCount', 'newLeadCount'],
        },
      ],
    },
  },
];

const ensureDefaultBillingPlans = async () => {
  await Promise.all(
    DEFAULT_BILLING_PLANS.map((plan) =>
      BillingPlanConfig.findOneAndUpdate(
        { key: plan.key },
        {
          $setOnInsert: plan,
        },
        { upsert: true, new: true }
      )
    )
  );
};

const ensureDefaultTemplates = async () => {
  const templates = buildDefaultTemplates();
  await Promise.all(
    templates.map((template) =>
      Template.findOneAndUpdate(
        { key: template.key },
        {
          $setOnInsert: template,
        },
        { upsert: true, new: true }
      )
    )
  );
};

const ensureControlPlaneSeedData = async () => {
  await Promise.all([ensureDefaultBillingPlans(), ensureDefaultTemplates()]);
};

const applyTemplateToTenant = async ({ companyId, template, actorUserId = null }) => {
  if (!companyId || !template) {
    throw new Error('companyId and template are required to apply a template');
  }

  await ensureCompanySaaSSetup(companyId);

  const company = await Company.findById(companyId);
  if (!company) {
    throw new Error('Tenant not found');
  }

  const subscription = await Subscription.findOne({ companyId });
  const config = template.configuration || {};
  const summary = {
    workflows: 0,
    roles: 0,
    publicForms: 0,
    automations: 0,
    notificationTemplates: 0,
    assignmentRules: 0,
    dashboardConfigs: 0,
  };

  if (config.branding && Object.keys(config.branding).length) {
    company.settings = {
      ...(company.settings?.toObject ? company.settings.toObject() : company.settings || {}),
      ...config.branding,
    };
  }

  if (subscription && config.featureFlags && Object.keys(config.featureFlags).length) {
    subscription.featureAccess = {
      ...(subscription.featureAccess?.toObject
        ? subscription.featureAccess.toObject()
        : subscription.featureAccess || {}),
      ...config.featureFlags,
    };
    await subscription.save();
  }

  for (const roleConfig of config.roles || []) {
    const key = normalizeKey(roleConfig.key || roleConfig.name, 'custom_role');
    await Role.findOneAndUpdate(
      { companyId, key },
      {
        $set: {
          name: roleConfig.name || key,
          description: roleConfig.description || '',
          permissions: Array.isArray(roleConfig.permissions) ? roleConfig.permissions : [],
          fieldAccess: roleConfig.fieldAccess || {},
          managerEnabled: Boolean(roleConfig.managerEnabled),
          isHeadOffice: Boolean(roleConfig.isHeadOffice),
          isActive: roleConfig.isActive !== false,
        },
        $setOnInsert: {
          companyId,
          key,
          isSystem: false,
        },
      },
      { upsert: true, new: true, runValidators: true }
    );
    summary.roles += 1;
  }

  for (const workflow of config.workflows || []) {
    if (!workflow?.country) {
      continue;
    }

    await CountryWorkflow.findOneAndUpdate(
      { companyId, country: workflow.country },
      {
        $set: {
          leadStages: (workflow.leadStages || []).map((label, index) => ({
            key: normalizeKey(label, `stage_${index + 1}`),
            label: String(label).trim(),
            order: index + 1,
          })),
          applicationStages: (workflow.applicationStages || []).map((label, index) => ({
            key: normalizeKey(label, `stage_${index + 1}`),
            label: String(label).trim(),
            order: index + 1,
          })),
          documentChecklist: (workflow.documentChecklist || []).map((item) => ({
            name: typeof item === 'string' ? item : item?.name,
            required: typeof item === 'string' ? true : item?.required !== false,
            description: typeof item === 'string' ? '' : item?.description || '',
          })),
          followUpRules: workflow.followUpRules || {},
          slaRules: workflow.slaRules || {},
          automationRules: workflow.automationRules || {},
          isActive: workflow.isActive !== false,
          createdBy: actorUserId,
          updatedBy: actorUserId,
        },
        $setOnInsert: {
          companyId,
          country: workflow.country,
        },
      },
      { upsert: true, new: true, runValidators: true }
    );
    summary.workflows += 1;
  }

  for (const formConfig of config.publicForms || []) {
    const slug = slugify(formConfig.slug || `${company.name}-${formConfig.name || 'form'}`);
    await PublicLeadForm.findOneAndUpdate(
      { companyId, slug },
      {
        $set: {
          branchId: formConfig.branchId || company.headOfficeBranchId || null,
          name: formConfig.name || slug,
          title: formConfig.title || formConfig.name || 'Public lead form',
          description: formConfig.description || '',
          visibleFields: Array.isArray(formConfig.visibleFields)
            ? formConfig.visibleFields
            : [],
          requiredFields: Array.isArray(formConfig.requiredFields)
            ? formConfig.requiredFields
            : [],
          defaultCountry: formConfig.defaultCountry || '',
          defaultAssignedTo: formConfig.defaultAssignedTo || null,
          defaultSource: formConfig.defaultSource || 'website_form',
          sourceType: formConfig.sourceType || 'website_form',
          sourceLabel: formConfig.sourceLabel || formConfig.title || formConfig.name || 'Website Form',
          targetCountries: Array.isArray(formConfig.targetCountries)
            ? formConfig.targetCountries
            : [],
          isActive: formConfig.isActive !== false,
          thankYouMessage:
            formConfig.thankYouMessage ||
            formConfig.successMessage ||
            'Thank you. Our counselling team will reach out shortly.',
          brandingOverride: formConfig.brandingOverride || {},
        },
        $setOnInsert: {
          companyId,
          slug,
          createdBy: actorUserId,
        },
      },
      { upsert: true, new: true, runValidators: true }
    );
    summary.publicForms += 1;
  }

  for (const automation of config.automations || []) {
    const key = normalizeKey(automation.key || automation.name, 'automation');
    await AutomationRule.findOneAndUpdate(
      { companyId, key },
      {
        $set: {
          name: automation.name || key,
          module: automation.module || 'crm',
          triggerEvent: automation.triggerEvent || 'lead.created',
          conditions: Array.isArray(automation.conditions) ? automation.conditions : [],
          actions: Array.isArray(automation.actions) ? automation.actions : [],
          isActive: automation.isActive !== false,
          metadata: automation.metadata || {},
          updatedBy: actorUserId,
        },
        $setOnInsert: {
          companyId,
          key,
          createdBy: actorUserId,
        },
      },
      { upsert: true, new: true, runValidators: true }
    );
    summary.automations += 1;
  }

  for (const notification of config.notificationTemplates || []) {
    const key = normalizeKey(notification.key || notification.name, 'notification');
    await NotificationTemplate.findOneAndUpdate(
      { companyId, key },
      {
        $set: {
          scope: 'tenant',
          name: notification.name || key,
          channel: notification.channel || 'email',
          module: notification.module || 'crm',
          subject: notification.subject || '',
          body: notification.body || '',
          variables: Array.isArray(notification.variables) ? notification.variables : [],
          isActive: notification.isActive !== false,
          updatedBy: actorUserId,
        },
        $setOnInsert: {
          companyId,
          key,
          createdBy: actorUserId,
        },
      },
      { upsert: true, new: true, runValidators: true }
    );
    summary.notificationTemplates += 1;
  }

  for (const assignmentRule of config.assignmentRules || []) {
    const key = normalizeKey(assignmentRule.key || assignmentRule.name, 'assignment_rule');
    await AssignmentRuleConfig.findOneAndUpdate(
      { companyId, key },
      {
        $set: {
          branchId: assignmentRule.branchId || null,
          name: assignmentRule.name || key,
          country: assignmentRule.country || '',
          strategy: assignmentRule.strategy || 'country_match',
          conditions: Array.isArray(assignmentRule.conditions) ? assignmentRule.conditions : [],
          actions: Array.isArray(assignmentRule.actions) ? assignmentRule.actions : [],
          defaultAssigneeId: assignmentRule.defaultAssigneeId || null,
          isActive: assignmentRule.isActive !== false,
          metadata: assignmentRule.metadata || {},
          updatedBy: actorUserId,
        },
        $setOnInsert: {
          companyId,
          key,
          createdBy: actorUserId,
        },
      },
      { upsert: true, new: true, runValidators: true }
    );
    summary.assignmentRules += 1;
  }

  if (config.dashboard && (config.dashboard.widgets?.length || config.dashboard.navigation?.length)) {
    await DashboardConfig.findOneAndUpdate(
      { companyId, scope: 'tenant', key: 'default_tenant_dashboard' },
      {
        $set: {
          name: `${company.name} Dashboard`,
          widgets: Array.isArray(config.dashboard.widgets) ? config.dashboard.widgets : [],
          navigation: Array.isArray(config.dashboard.navigation) ? config.dashboard.navigation : [],
          filters: config.dashboard.filters || {},
          isActive: true,
          updatedBy: actorUserId,
        },
        $setOnInsert: {
          companyId,
          scope: 'tenant',
          key: 'default_tenant_dashboard',
          createdBy: actorUserId,
        },
      },
      { upsert: true, new: true, runValidators: true }
    );
    summary.dashboardConfigs += 1;
  }

  const currentMetadata = company.metadata || {};
  const appliedTemplates = Array.isArray(currentMetadata.appliedTemplates)
    ? [...new Set([...currentMetadata.appliedTemplates, template.key])]
    : [template.key];
  company.metadata = {
    ...currentMetadata,
    appliedTemplates,
    lastAppliedTemplateAt: new Date(),
  };
  await company.save();

  await Template.findByIdAndUpdate(template._id, { $inc: { usageCount: 1 } });

  return summary;
};

const getBillingPlanFallback = (plan) => {
  const key = normalizeKey(plan || 'starter', 'starter');
  const config = getPlanConfig(key);
  return {
    key,
    name: key.charAt(0).toUpperCase() + key.slice(1),
    description: '',
    priceMonthly: 0,
    priceYearly: 0,
    userLimit: config.userLimit,
    branchLimit: config.branchLimit,
    featureAccess: config.featureAccess,
  };
};

module.exports = {
  normalizeKey,
  slugify,
  ensureControlPlaneSeedData,
  applyTemplateToTenant,
  getBillingPlanFallback,
};
