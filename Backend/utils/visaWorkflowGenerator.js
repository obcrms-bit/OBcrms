/**
 * Visa Workflow Generator
 * Given a visa rule, generates: milestones, checklist items, deadlines
 */

const COUNTRY_WORKFLOW_MAP = {
  UK: {
    workflowStages: [
      'documents_collecting',
      'financial_review',
      'forms_completed',
      'biometrics_scheduled',
      'biometrics_done',
      'submitted',
      'under_processing',
      'approved',
    ],
    preDepartureChecklist: [
      'Collect BRP card on arrival',
      'Register with GP',
      'Open UK bank account',
      'Arrange accommodation',
      'Book airport pickup',
      'Get UK SIM card',
      'Attend university enrolment',
    ],
  },
  US: {
    workflowStages: [
      'documents_collecting',
      'forms_completed',
      'appointment_booked',
      'interview_scheduled',
      'interview_done',
      'submitted',
      'under_processing',
      'approved',
    ],
    preDepartureChecklist: [
      'Register for SEVIS',
      'Arrange housing on/off campus',
      'Get US health insurance',
      'Pack essentials',
      'Notify bank of travel',
      'Check-in with DSO upon arrival',
    ],
  },
  CA: {
    workflowStages: [
      'documents_collecting',
      'financial_review',
      'forms_completed',
      'biometrics_scheduled',
      'biometrics_done',
      'submitted',
      'under_processing',
      'approved',
    ],
    preDepartureChecklist: [
      'Activate GIC upon arrival',
      'Apply for SIN number',
      'Open Canadian bank account',
      'Find accommodation (homestay or campus)',
      'Register with provincial health insurance',
    ],
  },
  AU: {
    workflowStages: [
      'documents_collecting',
      'financial_review',
      'forms_completed',
      'submitted',
      'under_processing',
      'approved',
    ],
    preDepartureChecklist: [
      'Purchase OSHC',
      'Arrange accommodation',
      'Register with university',
      'Open Australian bank account',
      'Get Australian SIM card',
      'Understand work rights (20hrs/week)',
    ],
  },
  DE: {
    workflowStages: [
      'documents_collecting',
      'financial_review',
      'forms_completed',
      'appointment_booked',
      'interview_scheduled',
      'interview_done',
      'submitted',
      'under_processing',
      'approved',
    ],
    preDepartureChecklist: [
      'Activate blocked account',
      'Register at Einwohnermeldeamt',
      'Get German health insurance',
      'Open German bank account',
      'Register at university',
      'Get German SIM card',
    ],
  },
};

/**
 * Generate the workflow for a visa application based on the country rule.
 * @param {Object} visaApplication - the visa application document (mutable)
 * @param {Object} visaRule - the visa rule document
 * @returns {Object} updated fields to $set on the visa application
 */
function generateVisaWorkflow(visaApplication, visaRule) {
  const countryCode = (visaApplication.destinationCountryCode || '').toUpperCase();
  const countryConfig = COUNTRY_WORKFLOW_MAP[countryCode] || COUNTRY_WORKFLOW_MAP['UK'];

  // ── Generate checklist ───────────────────────────────────────────────────
  const checklist = [];

  const addDoc = (doc, required = true) => {
    checklist.push({
      documentName: doc.name,
      category: doc.category || 'other',
      required: required,
      status: 'pending',
      isMissing: true,
      documentOwner: 'student',
    });
  };

  if (Array.isArray(visaRule.requiredDocuments)) {
    visaRule.requiredDocuments.forEach((d) => addDoc(d, true));
  }
  if (Array.isArray(visaRule.optionalDocuments)) {
    visaRule.optionalDocuments.forEach((d) => addDoc(d, false));
  }

  // ── Generate milestones from rule ────────────────────────────────────────
  let milestones = [];
  if (Array.isArray(visaRule.workflowMilestones) && visaRule.workflowMilestones.length > 0) {
    milestones = visaRule.workflowMilestones.map((m) => ({
      key: m.key,
      label: m.label,
      description: m.description,
      estimatedDays: m.estimatedDays,
      completed: false,
      completedAt: null,
    }));
  }

  // ── Generate deadlines ───────────────────────────────────────────────────
  const now = new Date();
  const deadlines = [];

  // Document submission deadline: 2 weeks from now
  deadlines.push({
    label: 'Document Collection Deadline',
    date: new Date(now.getTime() + 14 * 24 * 60 * 60 * 1000),
    type: 'document',
    notified: false,
    overdue: false,
  });

  // Visa submission deadline: 6 weeks from now
  const processingWeeks = visaRule.processingTimeWeeksMax || 8;
  deadlines.push({
    label: 'Recommmended Visa Submission Date',
    date: new Date(now.getTime() + 21 * 24 * 60 * 60 * 1000),
    type: 'visa_submission',
    notified: false,
    overdue: false,
  });

  // ── Pre-departure checklist ──────────────────────────────────────────────
  const preDeparture = (countryConfig.preDepartureChecklist || []).map((task) => ({
    task,
    category: 'other',
    done: false,
  }));

  // Use rule's pre-departure if available (overrides)
  const rulePreDep = Array.isArray(visaRule.preDepartureChecklist)
    ? visaRule.preDepartureChecklist.map((task) => ({ task, category: 'other', done: false }))
    : preDeparture;

  // ── Country-specific flags ───────────────────────────────────────────────
  const countryFlags = {};
  if (countryCode === 'UK') {
    countryFlags.casReceived = false;
    countryFlags.tbTestDone = !visaRule.tbTestRequired;
  }
  if (countryCode === 'US') {
    countryFlags.i20Received = false;
    countryFlags.ds160Completed = false;
  }
  if (countryCode === 'CA') {
    countryFlags.loaReceived = false;
  }
  if (countryCode === 'AU') {
    countryFlags.coeReceived = false;
  }
  if (countryCode === 'DE') {
    countryFlags.apsStatus = visaRule.apsRequired ? 'pending' : 'not_required';
  }

  // ── Payment fields ───────────────────────────────────────────────────────
  const payment = {
    visaFeeAmount: visaRule.visaFee || 0,
    visaFeeCurrency: visaRule.visaFeeCurrency || 'USD',
    surchargeAmount: visaRule.surchargeFee || 0,
    sevisFeeAmount: visaRule.sevisFeeRequired ? visaRule.sevisFeeAmount || 350 : 0,
    totalPaid: 0,
  };

  // ── Financial assessment defaults ────────────────────────────────────────
  const fr = visaRule.financialRequirements || {};
  const financialAssessment = {
    requiredAmount: fr.maintenanceFundsRequired || 0,
    currency: fr.currency || 'USD',
    gicStatus: fr.gicRequired ? 'pending' : 'not_required',
    gicAmount: fr.gicAmount || 0,
    blockedAccountStatus: fr.blockedAccountRequired ? 'pending' : 'not_required',
    blockedAccountAmount: fr.blockedAccountAmount || 0,
    oshcStatus: fr.oshcRequired ? 'pending' : 'not_required',
    ihsStatus: fr.ihsRequired ? 'pending' : 'not_required',
    ihsAmount: fr.ihsCostPerYear || 0,
    livingCostRequirement: (fr.livingCostPerMonth || 0) * (fr.durationMonths || 12),
    recommendationResult: 'pending',
  };

  return {
    generatedChecklist: checklist,
    deadlines,
    'preDeparture.checklist': rulePreDep,
    payment,
    financialAssessment,
    currentStage: 'checklist_generated',
    ruleSnapshot: {
      country: visaRule.country,
      countryCode: visaRule.countryCode,
      visaType: visaRule.visaType,
      biometricRequired: visaRule.biometricRequired,
      interviewRequired: visaRule.interviewRequired,
      medicalRequired: visaRule.medicalRequired,
      policeClearanceRequired: visaRule.policeClearanceRequired,
      processingTimeWeeksMin: visaRule.processingTimeWeeksMin,
      processingTimeWeeksMax: visaRule.processingTimeWeeksMax,
      financialRequirements: visaRule.financialRequirements,
      languageRequirements: visaRule.languageRequirements,
      rejectionReasonsCatalog: visaRule.rejectionReasonsCatalog,
    },
    milestones,
    ...countryFlags,
  };
}

module.exports = { generateVisaWorkflow };
