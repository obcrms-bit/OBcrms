const mongoose = require('mongoose');

// ─── Checklist Item ─────────────────────────────────────────────────────────
const checklistItemSchema = new mongoose.Schema(
  {
    documentName: { type: String, required: true },
    category: {
      type: String,
      enum: [
        'identity',
        'financial',
        'academic',
        'language',
        'medical',
        'travel',
        'employment',
        'other',
      ],
      default: 'other',
    },
    required: { type: Boolean, default: true },
    status: {
      type: String,
      enum: ['pending', 'submitted', 'verified', 'rejected', 'not_applicable', 'expired'],
      default: 'pending',
    },
    submittedAt: { type: Date },
    verifiedAt: { type: Date },
    verifiedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    rejectedAt: { type: Date },
    rejectionReason: { type: String },
    expiryDate: { type: Date },
    comments: { type: String },
    fileReferences: [
      {
        fileName: { type: String },
        fileUrl: { type: String },
        uploadedAt: { type: Date, default: Date.now },
        uploadedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
      },
    ],
    versionHistory: [
      {
        version: { type: Number },
        fileName: { type: String },
        fileUrl: { type: String },
        uploadedAt: { type: Date },
      },
    ],
    aiIssueFlag: { type: Boolean, default: false },
    aiIssueNote: { type: String },
    isMissing: { type: Boolean, default: false },
    documentOwner: { type: String }, // student, sponsor, institution
  },
  { timestamps: true }
);

// ─── Financial Assessment ────────────────────────────────────────────────────
const financialAssessmentSchema = new mongoose.Schema(
  {
    requiredAmount: { type: Number, default: 0 },
    currency: { type: String, default: 'USD' },
    availableFunds: { type: Number, default: 0 },
    tuitionDepositPaid: { type: Boolean, default: false },
    tuitionDepositAmount: { type: Number, default: 0 },
    sponsorDetails: {
      name: { type: String },
      relationship: { type: String },
      occupation: { type: String },
      annualIncome: { type: Number },
      sponsorType: {
        type: String,
        enum: ['self', 'parent', 'sponsor', 'scholarship', 'loan'],
        default: 'parent',
      },
    },
    sourceOfFunds: [
      {
        type: { type: String }, // savings, loan, sale_of_property, etc.
        amount: { type: Number },
        currency: { type: String },
        description: { type: String },
      },
    ],
    livingCostRequirement: { type: Number, default: 0 },
    bankStatements: [
      {
        bankName: { type: String },
        accountType: { type: String },
        balance: { type: Number },
        currency: { type: String },
        statementDate: { type: Date },
        fileUrl: { type: String },
      },
    ],
    // Country-specific
    gicAmount: { type: Number }, // Canada GIC
    gicStatus: {
      type: String,
      enum: ['not_required', 'pending', 'completed'],
      default: 'not_required',
    },
    blockedAccountAmount: { type: Number }, // Germany
    blockedAccountStatus: {
      type: String,
      enum: ['not_required', 'pending', 'completed'],
      default: 'not_required',
    },
    oshcStatus: {
      type: String,
      enum: ['not_required', 'pending', 'purchased'],
      default: 'not_required',
    }, // Australia
    oshcProvider: { type: String },
    ihsStatus: { type: String, enum: ['not_required', 'pending', 'paid'], default: 'not_required' }, // UK
    ihsAmount: { type: Number },

    // Assessment
    affordabilitySummary: { type: String },
    riskFlags: [{ type: String }],
    recommendationResult: {
      type: String,
      enum: ['strong', 'adequate', 'borderline', 'insufficient', 'pending'],
      default: 'pending',
    },
    assessedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    assessedAt: { type: Date },
  },
  { timestamps: true }
);

// ─── Interview / Biometrics ──────────────────────────────────────────────────
const interviewSchema = new mongoose.Schema({
  scheduledDate: { type: Date },
  venue: { type: String },
  type: { type: String, enum: ['embassy', 'vac', 'online', 'phone'], default: 'embassy' },
  status: {
    type: String,
    enum: ['not_scheduled', 'scheduled', 'rescheduled', 'completed', 'no_show', 'cancelled'],
    default: 'not_scheduled',
  },
  appointmentRef: { type: String },
  preparationChecklist: [{ item: String, done: { type: Boolean, default: false } }],
  mockInterviewScore: { type: Number, min: 0, max: 10 },
  outcomeNotes: { type: String },
  completedAt: { type: Date },
  rescheduleHistory: [{ from: Date, to: Date, reason: String }],
});

const biometricsSchema = new mongoose.Schema({
  scheduledDate: { type: Date },
  venue: { type: String },
  status: {
    type: String,
    enum: ['not_required', 'not_scheduled', 'scheduled', 'completed', 'no_show'],
    default: 'not_required',
  },
  appointmentRef: { type: String },
  completedAt: { type: Date },
  rescheduleHistory: [{ from: Date, to: Date, reason: String }],
});

// ─── Risk Assessment ─────────────────────────────────────────────────────────
const riskAssessmentSchema = new mongoose.Schema({
  visaSuccessProbability: { type: Number, min: 0, max: 100, default: 0 },
  riskCategory: { type: String, enum: ['low', 'medium', 'high', 'very_high'], default: 'medium' },
  reasons: [{ type: String }],
  recommendations: [{ type: String }],
  factors: {
    academicScore: { type: Number, default: 0 },
    financialScore: { type: Number, default: 0 },
    languageScore: { type: Number, default: 0 },
    documentScore: { type: Number, default: 0 },
    travelHistoryScore: { type: Number, default: 0 },
    interviewScore: { type: Number, default: 0 },
    gapYearsPenalty: { type: Number, default: 0 },
    refusalPenalty: { type: Number, default: 0 },
  },
  assessedAt: { type: Date },
  assessedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
});

// ─── Timeline Activity ───────────────────────────────────────────────────────
const visaTimelineSchema = new mongoose.Schema(
  {
    stage: { type: String },
    action: { type: String, required: true },
    description: { type: String },
    performedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    metadata: { type: mongoose.Schema.Types.Mixed },
  },
  { timestamps: true }
);

// ─── Visa Decision ───────────────────────────────────────────────────────────
const visaDecisionSchema = new mongoose.Schema({
  decision: {
    type: String,
    enum: ['approved', 'rejected', 'appeal_in_progress', 'withdrawn', 'pending'],
  },
  decisionDate: { type: Date },
  visaValidFrom: { type: Date },
  visaValidTo: { type: Date },
  rejectionReason: { type: String },
  rejectionCategory: { type: String },
  appealDeadline: { type: Date },
  appealNotes: { type: String },
  refusalLetter: { type: String }, // fileUrl
  approvalLetter: { type: String }, // fileUrl
  recordedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  recordedAt: { type: Date },
});

// ─── Pre-Departure Checklist ──────────────────────────────────────────────────
const preDepartureItemSchema = new mongoose.Schema({
  task: { type: String, required: true },
  category: {
    type: String,
    enum: ['travel', 'accommodation', 'finance', 'health', 'documents', 'other'],
    default: 'other',
  },
  done: { type: Boolean, default: false },
  completedAt: { type: Date },
  notes: { type: String },
});

// ─── Payment ─────────────────────────────────────────────────────────────────
const paymentSchema = new mongoose.Schema({
  visaFeeAmount: { type: Number, default: 0 },
  visaFeeCurrency: { type: String, default: 'USD' },
  visaFeePaid: { type: Boolean, default: false },
  visaFeeDate: { type: Date },
  surchargeAmount: { type: Number, default: 0 },
  surchargePaid: { type: Boolean, default: false },
  sevisFeeAmount: { type: Number, default: 0 },
  sevisFeePaid: { type: Boolean, default: false },
  totalPaid: { type: Number, default: 0 },
  receipts: [{ fileUrl: String, uploadedAt: Date }],
});

// ─── Main VisaApplication Schema ─────────────────────────────────────────────
const visaApplicationSchema = new mongoose.Schema(
  {
    visaId: { type: String, unique: true, index: true },

    // Tenant
    companyId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Company',
      required: true,
      index: true,
    },
    branchId: { type: mongoose.Schema.Types.ObjectId, ref: 'Branch', index: true },

    // Relations
    student: { type: mongoose.Schema.Types.ObjectId, ref: 'Student' },
    lead: { type: mongoose.Schema.Types.ObjectId, ref: 'Lead', index: true },

    // Destination
    destinationCountry: { type: String, required: true },
    destinationCountryCode: { type: String, required: true, uppercase: true },
    flagEmoji: { type: String },
    visaType: {
      type: String,
      enum: [
        'student',
        'tier4',
        'f1',
        'm1',
        'study_permit',
        'student_visa',
        'national_visa',
        'other',
      ],
      default: 'student',
    },

    // Stage & Status
    currentStage: {
      type: String,
      enum: [
        'not_started',
        'checklist_generated',
        'documents_collecting',
        'documents_ready',
        'financial_review',
        'forms_completed',
        'appointment_booked',
        'biometrics_scheduled',
        'biometrics_done',
        'interview_scheduled',
        'interview_done',
        'submitted',
        'under_processing',
        'additional_docs_requested',
        'approved',
        'rejected',
        'appeal_in_progress',
        'pre_departure_ready',
        'completed',
      ],
      default: 'not_started',
      index: true,
    },
    status: {
      type: String,
      enum: ['active', 'on_hold', 'cancelled', 'completed'],
      default: 'active',
      index: true,
    },

    // Assignment
    counsellor: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },

    // Rule snapshot (frozen copy at time of application)
    ruleSnapshot: { type: mongoose.Schema.Types.Mixed },

    // Generated checklist
    generatedChecklist: [checklistItemSchema],

    // Financial
    financialAssessment: { type: financialAssessmentSchema, default: () => ({}) },

    // Interview / Biometrics
    interview: { type: interviewSchema, default: () => ({}) },
    biometrics: { type: biometricsSchema, default: () => ({}) },

    // Decision
    decision: { type: visaDecisionSchema, default: () => ({}) },

    // Payment
    payment: { type: paymentSchema, default: () => ({}) },

    // Risk
    riskAssessment: { type: riskAssessmentSchema, default: () => ({}) },

    // Timeline
    timeline: [visaTimelineSchema],

    // Pre-departure
    preDeparture: {
      checklist: [preDepartureItemSchema],
      departureDate: { type: Date },
      flightDetails: { type: String },
      accommodationConfirmed: { type: Boolean, default: false },
      completedAt: { type: Date },
    },

    // Deadlines
    deadlines: [
      {
        label: { type: String },
        date: { type: Date },
        type: {
          type: String,
          enum: ['visa_submission', 'document', 'financial', 'appointment', 'departure', 'other'],
        },
        notified: { type: Boolean, default: false },
        overdue: { type: Boolean, default: false },
      },
    ],

    // Country-specific flags
    casNumber: { type: String }, // UK
    casReceived: { type: Boolean, default: false },
    i20Received: { type: Boolean, default: false }, // USA
    ds160Completed: { type: Boolean, default: false }, // USA
    sevisFeeReferenceNo: { type: String }, // USA
    loaReceived: { type: Boolean, default: false }, // Canada
    coeReceived: { type: Boolean, default: false }, // Australia
    apsStatus: {
      type: String,
      enum: ['not_required', 'pending', 'completed'],
      default: 'not_required',
    }, // Germany
    tbTestDone: { type: Boolean, default: false }, // UK

    // Notes
    notes: [
      {
        content: { type: String },
        createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
        createdAt: { type: Date, default: Date.now },
        isInternal: { type: Boolean, default: true },
      },
    ],

    // Additional docs requested
    additionalDocsRequest: {
      requestedAt: { type: Date },
      deadline: { type: Date },
      items: [{ type: String }],
      notes: { type: String },
    },

    // Study info
    universityName: { type: String },
    courseName: { type: String },
    studyLevel: { type: String },
    intakeDate: { type: Date },
    courseStartDate: { type: Date },
    courseDuration: { type: String },

    // Applicant info snapshot
    applicantSnapshot: {
      firstName: { type: String },
      lastName: { type: String },
      email: { type: String },
      phone: { type: String },
      dateOfBirth: { type: Date },
      nationality: { type: String },
      passportNumber: { type: String },
      passportExpiry: { type: Date },
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// ─── Pre-save: Auto-generate visaId ─────────────────────────────────────────
visaApplicationSchema.pre('save', async function (next) {
  if (!this.visaId) {
    const count = await this.constructor.countDocuments();
    this.visaId = `VISA-${String(count + 1).padStart(5, '0')}`;
  }
  next();
});

// Virtuals
visaApplicationSchema.virtual('checklistCompletionRate').get(function () {
  if (!this.generatedChecklist || this.generatedChecklist.length === 0) return 0;
  const done = this.generatedChecklist.filter((i) => i.status === 'verified').length;
  return Math.round((done / this.generatedChecklist.length) * 100);
});

// Indexes
visaApplicationSchema.index({ companyId: 1, currentStage: 1 });
visaApplicationSchema.index({ companyId: 1, destinationCountryCode: 1 });
visaApplicationSchema.index({ companyId: 1, createdAt: -1 });

module.exports = mongoose.model('VisaApplication', visaApplicationSchema);
