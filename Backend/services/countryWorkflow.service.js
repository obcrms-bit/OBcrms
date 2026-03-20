const CountryWorkflow = require('../models/CountryWorkflow');

const DEFAULT_LEAD_STAGE_OPTIONS = [
  { key: 'new', label: 'New', order: 1 },
  { key: 'contacted', label: 'Contacted', order: 2 },
  { key: 'qualified', label: 'Qualified', order: 3 },
  { key: 'counselling_scheduled', label: 'Counselling Scheduled', order: 4 },
  { key: 'counselling_done', label: 'Counselling Done', order: 5 },
  { key: 'application_started', label: 'Application Started', order: 6 },
  { key: 'documents_pending', label: 'Documents Pending', order: 7 },
  { key: 'application_submitted', label: 'Application Submitted', order: 8 },
  { key: 'offer_received', label: 'Offer Received', order: 9 },
  { key: 'visa_applied', label: 'Visa Applied', order: 10 },
  { key: 'enrolled', label: 'Enrolled', order: 11 },
  { key: 'lost', label: 'Lost', order: 12 },
];

const DEFAULT_APPLICATION_STAGE_OPTIONS = [
  { key: 'draft', label: 'Draft', order: 1 },
  { key: 'submitted', label: 'Submitted', order: 2 },
  { key: 'review', label: 'Review', order: 3 },
  { key: 'offer', label: 'Offer', order: 4 },
  { key: 'visa', label: 'Visa', order: 5 },
  { key: 'completed', label: 'Completed', order: 6 },
];

const DEFAULT_COUNTRY_WORKFLOWS = [
  {
    country: 'Australia',
    leadStages: [
      { key: 'enquiry', label: 'Enquiry', order: 1 },
      { key: 'counselling', label: 'Counselling', order: 2 },
      { key: 'docs', label: 'Docs', order: 3 },
      { key: 'lodge', label: 'Lodge', order: 4 },
      { key: 'visa', label: 'Visa', order: 5 },
    ],
    applicationStages: [
      { key: 'enquiry', label: 'Enquiry', order: 1 },
      { key: 'assessment', label: 'Assessment', order: 2 },
      { key: 'offer', label: 'Offer', order: 3 },
      { key: 'coe', label: 'COE', order: 4 },
      { key: 'visa', label: 'Visa', order: 5 },
    ],
    documentChecklist: [
      { name: 'Passport', required: true },
      { name: 'Academic Transcript', required: true },
      { name: 'English Test Score', required: true },
      { name: 'Genuine Student Statement', required: true },
    ],
    followUpRules: { initialHours: 6, recurringHours: 24, overdueReminderHours: 12, cadenceLabel: 'High-touch' },
    slaRules: { firstResponseHours: 2, firstFollowUpHours: 6, offerDecisionHours: 72 },
  },
  {
    country: 'United Kingdom',
    leadStages: [
      { key: 'enquiry', label: 'Enquiry', order: 1 },
      { key: 'counselling', label: 'Counselling', order: 2 },
      { key: 'conditional', label: 'Conditional', order: 3 },
      { key: 'final_offer', label: 'Final Offer', order: 4 },
      { key: 'visa', label: 'Visa', order: 5 },
    ],
    applicationStages: [
      { key: 'draft', label: 'Draft', order: 1 },
      { key: 'submitted', label: 'Submitted', order: 2 },
      { key: 'conditional', label: 'Conditional Offer', order: 3 },
      { key: 'final_offer', label: 'Final Offer', order: 4 },
      { key: 'cas', label: 'CAS', order: 5 },
      { key: 'visa', label: 'Visa', order: 6 },
    ],
    documentChecklist: [
      { name: 'Passport', required: true },
      { name: 'Academic Transcript', required: true },
      { name: 'Financial Evidence', required: true },
      { name: 'TB Test', required: false },
    ],
    followUpRules: { initialHours: 8, recurringHours: 48, overdueReminderHours: 24, cadenceLabel: 'Offer-focused' },
    slaRules: { firstResponseHours: 4, firstFollowUpHours: 8, offerDecisionHours: 96 },
  },
  {
    country: 'Canada',
    leadStages: [
      { key: 'enquiry', label: 'Enquiry', order: 1 },
      { key: 'counselling', label: 'Counselling', order: 2 },
      { key: 'docs', label: 'Docs', order: 3 },
      { key: 'submission', label: 'Submission', order: 4 },
      { key: 'visa', label: 'Visa', order: 5 },
    ],
    applicationStages: [
      { key: 'draft', label: 'Draft', order: 1 },
      { key: 'submitted', label: 'Submitted', order: 2 },
      { key: 'offer', label: 'Offer', order: 3 },
      { key: 'pal', label: 'PAL', order: 4 },
      { key: 'visa', label: 'Visa', order: 5 },
    ],
    documentChecklist: [
      { name: 'Passport', required: true },
      { name: 'Academic Transcript', required: true },
      { name: 'Statement of Purpose', required: true },
      { name: 'Proof of Funds', required: true },
    ],
    followUpRules: { initialHours: 8, recurringHours: 36, overdueReminderHours: 18, cadenceLabel: 'Document-driven' },
    slaRules: { firstResponseHours: 3, firstFollowUpHours: 8, offerDecisionHours: 72 },
  },
];

const normalizeCountry = (value) => String(value || '').trim();

const normalizeStage = (stage, fallbackOrder = 0) => {
  const key = String(stage?.key || stage || '')
    .trim()
    .toLowerCase()
    .replace(/\s+/g, '_');

  if (!key) {
    return null;
  }

  return {
    key,
    label:
      String(stage?.label || key)
        .replace(/_/g, ' ')
        .replace(/\b\w/g, (char) => char.toUpperCase()),
    order: Number.isFinite(Number(stage?.order)) ? Number(stage.order) : fallbackOrder,
  };
};

const mergeStageCollections = (...collections) => {
  const stageMap = new Map();

  collections
    .flat()
    .map((stage, index) => normalizeStage(stage, index + 1))
    .filter(Boolean)
    .forEach((stage) => {
      const existing = stageMap.get(stage.key);
      if (!existing || existing.order > stage.order) {
        stageMap.set(stage.key, stage);
      }
    });

  return Array.from(stageMap.values()).sort((left, right) => left.order - right.order);
};

const ensureDefaultCountryWorkflows = async (companyId) => {
  await Promise.all(
    DEFAULT_COUNTRY_WORKFLOWS.map((workflow) =>
      CountryWorkflow.findOneAndUpdate(
        { companyId, country: workflow.country },
        {
          $setOnInsert: {
            companyId,
            ...workflow,
            isActive: true,
          },
        },
        { upsert: true, new: true }
      )
    )
  );
};

const getCountryWorkflow = async (companyId, country) => {
  const normalizedCountry = normalizeCountry(country);
  if (!normalizedCountry) {
    return null;
  }

  return CountryWorkflow.findOne({
    companyId,
    country: normalizedCountry,
    isActive: true,
  }).lean();
};

const getCountryWorkflowsForCountries = async (companyId, countries = []) => {
  const normalizedCountries = countries.map(normalizeCountry).filter(Boolean);
  if (!normalizedCountries.length) {
    return [];
  }
  return CountryWorkflow.find({
    companyId,
    country: { $in: normalizedCountries },
    isActive: true,
  }).lean();
};

const getPrimaryCountryWorkflow = async (companyId, preferredCountries = []) => {
  const workflows = await getCountryWorkflowsForCountries(companyId, preferredCountries);
  if (!workflows.length) {
    return null;
  }

  const byCountry = new Map(workflows.map((workflow) => [normalizeCountry(workflow.country), workflow]));
  const match = preferredCountries.find((country) => byCountry.has(normalizeCountry(country)));
  return match ? byCountry.get(normalizeCountry(match)) : workflows[0];
};

const getTenantLeadStages = async (companyId) => {
  const workflows = await CountryWorkflow.find({
    companyId,
    isActive: true,
  })
    .select('leadStages')
    .lean();

  return mergeStageCollections(
    DEFAULT_LEAD_STAGE_OPTIONS,
    workflows.flatMap((workflow) => workflow.leadStages || [])
  );
};

const getTenantApplicationStages = async (companyId) => {
  const workflows = await CountryWorkflow.find({
    companyId,
    isActive: true,
  })
    .select('applicationStages')
    .lean();

  return mergeStageCollections(
    DEFAULT_APPLICATION_STAGE_OPTIONS,
    workflows.flatMap((workflow) => workflow.applicationStages || [])
  );
};

module.exports = {
  DEFAULT_COUNTRY_WORKFLOWS,
  DEFAULT_LEAD_STAGE_OPTIONS,
  DEFAULT_APPLICATION_STAGE_OPTIONS,
  ensureDefaultCountryWorkflows,
  getCountryWorkflow,
  getCountryWorkflowsForCountries,
  getPrimaryCountryWorkflow,
  getTenantApplicationStages,
  getTenantLeadStages,
  mergeStageCollections,
  normalizeStage,
  normalizeCountry,
};
