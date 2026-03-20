const mongoose = require('mongoose');

const PIPELINE_STATUSES = [
  'new',
  'contacted',
  'qualified',
  'counselling_scheduled',
  'counselling_done',
  'application_started',
  'documents_pending',
  'application_submitted',
  'offer_received',
  'visa_applied',
  'enrolled',
  'lost',
];

const FOLLOW_UP_METHODS = [
  'call',
  'whatsapp',
  'email',
  'in_person',
  'meeting',
  'sms',
  'other',
];

const FOLLOW_UP_OUTCOMES = [
  'next_followup_needed',
  'converted_to_student',
  'closed_not_interested',
  'no_response',
  'other',
];

const mapPipelineStatusToStage = (status) => {
  switch (status) {
  case 'new':
    return 1;
  case 'contacted':
  case 'qualified':
    return 2;
  case 'counselling_scheduled':
  case 'counselling_done':
    return 3;
  case 'application_started':
  case 'documents_pending':
  case 'application_submitted':
  case 'offer_received':
    return 4;
  case 'visa_applied':
    return 5;
  case 'enrolled':
  case 'lost':
    return 6;
  default:
    return 1;
  }
};

const activitySchema = new mongoose.Schema(
  {
    type: {
      type: String,
      enum: [
        'lead_created',
        'lead_updated',
        'status_changed',
        'assignment_changed',
        'followup_scheduled',
        'followup_completed',
        'followup_rescheduled',
        'followup_marked_overdue',
        'reminder_sent',
        'reminder_failed',
        'note_added',
        'converted_to_student',
        'transfer_requested',
        'transfer_approved',
        'transfer_rejected',
        'transfer_completed',
        'ownership_locked',
        'ownership_unlocked',
        'communication_logged',
        'score_updated',
        'document_uploaded',
      ],
      required: true,
    },
    description: { type: String, required: true },
    performedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    metadata: { type: mongoose.Schema.Types.Mixed, default: {} },
  },
  { timestamps: true }
);

const noteSchema = new mongoose.Schema(
  {
    content: { type: String, required: true, trim: true },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    createdAt: { type: Date, default: Date.now },
  },
  { _id: true }
);

const qualificationSchema = new mongoose.Schema(
  {
    country: { type: String, trim: true },
    institution: { type: String, trim: true },
    degree: { type: String, trim: true },
    course: { type: String, trim: true },
    gradeType: { type: String, trim: true },
    point: { type: String, trim: true },
    percentageValue: { type: String, trim: true },
    universityTitle: { type: String, trim: true },
    level: { type: String, trim: true },
    passedYear: { type: String, trim: true },
    startedAt: { type: Date },
    completedAt: { type: Date },
    resultDate: { type: Date },
  },
  { _id: true }
);

const reminderHistorySchema = new mongoose.Schema(
  {
    sentAt: { type: Date, default: Date.now },
    status: { type: String, enum: ['sent', 'failed', 'skipped'], default: 'sent' },
    message: { type: String, trim: true },
    error: { type: String, trim: true },
  },
  { _id: false }
);

const reminderMetaSchema = new mongoose.Schema(
  {
    isOverdue: { type: Boolean, default: false },
    lastReminderSentAt: { type: Date },
    reminderCount: { type: Number, default: 0 },
    reminderStatus: {
      type: String,
      enum: ['pending', 'sent', 'failed', 'skipped'],
      default: 'pending',
    },
    nextReminderAt: { type: Date },
    lastError: { type: String, trim: true },
    history: { type: [reminderHistorySchema], default: [] },
  },
  { _id: false }
);

const followUpSchema = new mongoose.Schema(
  {
    scheduledAt: { type: Date, required: true },
    scheduledBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    type: {
      type: String,
      enum: FOLLOW_UP_METHODS,
      default: 'call',
    },
    notes: { type: String, trim: true },
    completedAt: { type: Date },
    status: {
      type: String,
      enum: ['pending', 'completed', 'overdue', 'cancelled'],
      default: 'pending',
    },
    completedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    outcomeType: {
      type: String,
      enum: FOLLOW_UP_OUTCOMES,
    },
    completionNotes: { type: String, trim: true },
    completionMethod: {
      type: String,
      enum: FOLLOW_UP_METHODS,
    },
    followUpTime: { type: String, trim: true },
    counsellorName: { type: String, trim: true },
    nextFollowUpDate: { type: Date },
    convertedStudentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Student' },
    convertedAt: { type: Date },
    reminderMeta: { type: reminderMetaSchema, default: () => ({}) },
  },
  { timestamps: true }
);

const leadSchema = new mongoose.Schema(
  {
    companyId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Company',
      required: true,
      index: true,
    },
    branchId: { type: mongoose.Schema.Types.ObjectId, ref: 'Branch', index: true },
    createdByUser: { type: mongoose.Schema.Types.ObjectId, ref: 'User', index: true },
    createdByAgentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Agent', index: true },
    ownerUserId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', index: true },
    sharedWithBranchIds: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Branch' }],

    serviceType: {
      type: String,
      enum: ['consultancy', 'test_prep'],
      default: 'consultancy',
      index: true,
    },
    entityType: {
      type: String,
      enum: ['client', 'student'],
      default: 'client',
      index: true,
    },

    firstName: { type: String, required: [true, 'First name is required'], trim: true },
    lastName: { type: String, trim: true, default: '' },
    name: { type: String, trim: true },
    email: { type: String, lowercase: true, trim: true },
    phone: { type: String, trim: true },
    mobile: { type: String, trim: true },
    whatsappNumber: { type: String, trim: true },
    fullAddress: { type: String, trim: true },
    dob: { type: Date },
    gender: {
      type: String,
      enum: ['male', 'female', 'other', 'prefer_not_to_say'],
    },
    guardianName: { type: String, trim: true },
    guardianContact: { type: String, trim: true },
    maritalStatus: {
      type: String,
      enum: ['single', 'married', 'divorced', 'widowed', 'other'],
    },
    appliedCountryBefore: { type: Boolean, default: false },
    howDidYouKnowUs: { type: String, trim: true },

    source: {
      type: String,
      enum: [
        'website',
        'facebook',
        'instagram',
        'walk-in',
        'referral',
        'tiktok',
        'youtube',
        'event',
        'other',
      ],
      default: 'website',
    },
    sourceType: {
      type: String,
      enum: ['website_form', 'website_widget', 'qr_form', 'manual_entry', 'agent_portal', 'import', 'api'],
      default: 'manual_entry',
      index: true,
    },
    sourceMeta: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
    campaign: { type: String, trim: true },
    branchName: { type: String, trim: true },
    stream: { type: String, trim: true },
    interestedFor: { type: String, trim: true },
    courseLevel: { type: String, trim: true },
    preferredLocation: { type: String, trim: true },
    interestedCourse: { type: String, trim: true },

    preferredCountries: [{ type: String, trim: true }],
    preferredStudyLevel: { type: String, trim: true },
    preferredIntake: { type: String, trim: true },
    budget: { type: Number, min: 0 },
    preparationClass: { type: String, trim: true },
    overallScore: { type: String, trim: true },
    workExperience: { type: String, trim: true },

    qualifications: { type: [qualificationSchema], default: [] },

    education: {
      lastDegree: { type: String, trim: true },
      institution: { type: String, trim: true },
      percentage: { type: Number },
      passingYear: { type: Number },
      gpa: { type: Number },
    },

    englishTest: {
      type: {
        type: String,
        enum: ['ielts', 'pte', 'toefl', 'duolingo', 'cambridge', 'none'],
        default: 'none',
      },
      score: { type: Number },
      dateTaken: { type: Date },
    },

    status: {
      type: String,
      default: 'new',
      index: true,
    },
    pipelineStage: {
      type: String,
      default: 'new',
      index: true,
    },
    stage: { type: Number, min: 1, max: 6, default: 1 },
    recordType: {
      type: String,
      enum: ['lead', 'student', 'applicant'],
      default: 'lead',
      index: true,
    },
    tags: [{ type: String, trim: true }],

    assignedCounsellor: { type: mongoose.Schema.Types.ObjectId, ref: 'User', index: true },
    assignedTo: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    assignmentHistory: [
      {
        counsellor: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
        assignedAt: { type: Date, default: Date.now },
        assignedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
        reason: { type: String, trim: true },
      },
    ],

    leadScore: { type: Number, default: 0, min: 0, max: 100, index: true },
    leadCategory: { type: String, enum: ['hot', 'warm', 'cold'], default: 'cold' },

    followUps: { type: [followUpSchema], default: [] },
    nextFollowUp: { type: Date, index: true },
    lastContactedAt: { type: Date },

    notes: { type: [noteSchema], default: [] },
    activities: { type: [activitySchema], default: [] },

    convertedToStudent: { type: Boolean, default: false },
    studentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Student' },
    convertedAt: { type: Date },

    ownershipLocked: { type: Boolean, default: false, index: true },
    ownershipLockedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    ownershipLockedAt: { type: Date },
    ownershipLockReason: { type: String, trim: true },
    transferHistory: {
      type: [
        {
          fromBranchId: { type: mongoose.Schema.Types.ObjectId, ref: 'Branch' },
          toBranchId: { type: mongoose.Schema.Types.ObjectId, ref: 'Branch' },
          transferredBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
          transferDate: { type: Date, default: Date.now },
          reason: { type: String, trim: true },
          approvedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
          status: {
            type: String,
            enum: ['pending', 'approved', 'rejected', 'completed'],
            default: 'completed',
          },
        },
      ],
      default: [],
    },
    slaMetrics: {
      firstResponseMinutes: { type: Number, default: null },
      firstFollowUpMinutes: { type: Number, default: null },
      overdueFollowUpCount: { type: Number, default: 0 },
      agingDays: { type: Number, default: 0 },
      lastCalculatedAt: { type: Date },
    },

    deletedAt: { type: Date, default: null },

    address: {
      city: { type: String, trim: true },
      country: { type: String, trim: true },
    },
    interestedCountry: { type: String, trim: true },
    priority: { type: String, enum: ['low', 'medium', 'high', 'urgent'], default: 'medium' },
    aiScore: { type: Number, min: 0, max: 100, default: 0 },
    metadata: { type: mongoose.Schema.Types.Mixed },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

leadSchema.virtual('fullName').get(function fullNameGetter() {
  if (this.name) {
    return this.name;
  }
  return `${this.firstName || ''} ${this.lastName || ''}`.trim();
});

leadSchema.virtual('notesHistory').get(function notesHistoryGetter() {
  return this.notes || [];
});

leadSchema.virtual('activityLogs').get(function activityLogsGetter() {
  return this.activities || [];
});

leadSchema.pre('save', function syncLegacyFields(next) {
  if (this.name && (!this.firstName || !this.lastName)) {
    const parts = String(this.name).trim().split(/\s+/);
    this.firstName = parts.shift() || this.firstName || 'Lead';
    this.lastName = parts.join(' ') || this.lastName || '';
  }

  this.name = `${this.firstName || ''} ${this.lastName || ''}`.trim();

  if (this.mobile && !this.phone) {
    this.phone = this.mobile;
  }
  if (this.phone && !this.mobile) {
    this.mobile = this.phone;
  }

  if (this.assignedCounsellor && !this.assignedTo) {
    this.assignedTo = this.assignedCounsellor;
  }
  if (this.assignedTo && !this.assignedCounsellor) {
    this.assignedCounsellor = this.assignedTo;
  }
  if (this.assignedCounsellor && !this.ownerUserId) {
    this.ownerUserId = this.assignedCounsellor;
  }
  if (!this.ownerUserId && this.createdByUser) {
    this.ownerUserId = this.createdByUser;
  }

  if (this.courseLevel && !this.preferredStudyLevel) {
    this.preferredStudyLevel = this.courseLevel;
  }
  if (this.preferredStudyLevel && !this.courseLevel) {
    this.courseLevel = this.preferredStudyLevel;
  }

  if (this.interestedCountry && (!this.preferredCountries || !this.preferredCountries.length)) {
    this.preferredCountries = [this.interestedCountry];
  }
  if (this.preferredCountries?.length && !this.interestedCountry) {
    this.interestedCountry = this.preferredCountries[0];
  }

  this.pipelineStage = this.status || this.pipelineStage || 'new';
  this.status = this.pipelineStage;
  this.stage = mapPipelineStatusToStage(this.status);
  this.entityType = this.serviceType === 'test_prep' ? 'student' : 'client';

  const nextPendingFollowUp = (this.followUps || [])
    .filter((item) => ['pending', 'overdue'].includes(item.status))
    .sort((left, right) => new Date(left.scheduledAt) - new Date(right.scheduledAt))[0];

  this.nextFollowUp = nextPendingFollowUp ? nextPendingFollowUp.scheduledAt : null;

  const firstScheduledFollowUp = (this.followUps || [])
    .slice()
    .sort((left, right) => new Date(left.scheduledAt) - new Date(right.scheduledAt))[0];
  const firstCompletedFollowUp = (this.followUps || [])
    .filter((item) => item.completedAt)
    .sort((left, right) => new Date(left.completedAt) - new Date(right.completedAt))[0];
  const overdueFollowUpCount = (this.followUps || []).filter((item) => item.status === 'overdue').length;

  this.slaMetrics = {
    ...(this.slaMetrics || {}),
    firstResponseMinutes:
      this.createdAt && firstCompletedFollowUp?.completedAt
        ? Math.round(
          (new Date(firstCompletedFollowUp.completedAt).getTime() -
              new Date(this.createdAt).getTime()) /
              60000
        )
        : this.slaMetrics?.firstResponseMinutes ?? null,
    firstFollowUpMinutes:
      this.createdAt && firstScheduledFollowUp?.scheduledAt
        ? Math.round(
          (new Date(firstScheduledFollowUp.scheduledAt).getTime() -
              new Date(this.createdAt).getTime()) /
              60000
        )
        : this.slaMetrics?.firstFollowUpMinutes ?? null,
    overdueFollowUpCount,
    agingDays: this.createdAt
      ? Math.max(
        0,
        Math.floor((Date.now() - new Date(this.createdAt).getTime()) / (24 * 60 * 60 * 1000))
      )
      : 0,
    lastCalculatedAt: new Date(),
  };

  next();
});

leadSchema.index(
  { companyId: 1, phone: 1 },
  { unique: true, partialFilterExpression: { deletedAt: null, phone: { $type: 'string' } } }
);
leadSchema.index({ companyId: 1, email: 1 });
leadSchema.index({ companyId: 1, status: 1 });
leadSchema.index({ companyId: 1, pipelineStage: 1 });
leadSchema.index({ companyId: 1, stage: 1 });
leadSchema.index({ companyId: 1, leadScore: -1 });
leadSchema.index({ companyId: 1, nextFollowUp: 1 });
leadSchema.index({ companyId: 1, assignedCounsellor: 1 });
leadSchema.index({ companyId: 1, branchId: 1, assignedCounsellor: 1 });
leadSchema.index({ companyId: 1, serviceType: 1, entityType: 1 });
leadSchema.index({ companyId: 1, ownershipLocked: 1 });
leadSchema.index({ companyId: 1, createdAt: -1 });
leadSchema.index({
  firstName: 'text',
  lastName: 'text',
  name: 'text',
  email: 'text',
  phone: 'text',
  mobile: 'text',
  interestedCourse: 'text',
  branchName: 'text',
});

module.exports = mongoose.model('Lead', leadSchema);
