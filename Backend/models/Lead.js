const mongoose = require('mongoose');

// ─── Activity Sub-Schema ─────────────────────────────────────────────────────
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
        'note_added',
        'converted_to_student',
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

// ─── Follow-up Sub-Schema ─────────────────────────────────────────────────────
const followUpSchema = new mongoose.Schema(
  {
    scheduledAt: { type: Date, required: true },
    type: {
      type: String,
      enum: ['call', 'email', 'whatsapp', 'meeting', 'sms'],
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
  },
  { timestamps: true }
);

// ─── Main Lead Schema ─────────────────────────────────────────────────────────
const leadSchema = new mongoose.Schema(
  {
    // Tenant / Branch fields
    companyId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Company',
      required: true,
      index: true,
    },
    branchId: { type: mongoose.Schema.Types.ObjectId, ref: 'Branch', index: true },

    // Basic contact info
    firstName: { type: String, required: [true, 'First name is required'], trim: true },
    lastName: { type: String, required: [true, 'Last name is required'], trim: true },
    email: { type: String, lowercase: true, trim: true },
    phone: { type: String, required: [true, 'Phone number is required'], trim: true },
    whatsappNumber: { type: String, trim: true },

    // Lead metadata
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
    status: {
      type: String,
      enum: [
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
      ],
      default: 'new',
      index: true,
    },
    tags: [{ type: String, trim: true }],

    // Study preferences
    preferredCountries: [{ type: String }],
    preferredStudyLevel: {
      type: String,
      enum: [
        'certificate',
        'diploma',
        'bachelor',
        'postgraduate',
        'phd',
        'english_course',
        'other',
      ],
    },
    preferredIntake: { type: String }, // e.g. "September 2025"
    budget: { type: Number, min: 0 },

    // Academic background
    education: {
      lastDegree: { type: String },
      institution: { type: String },
      percentage: { type: Number },
      passingYear: { type: Number },
      gpa: { type: Number },
    },

    // English test
    englishTest: {
      type: {
        type: String,
        enum: ['ielts', 'pte', 'toefl', 'duolingo', 'cambridge', 'none'],
        default: 'none',
      },
      score: { type: Number },
      dateTaken: { type: Date },
    },

    // Assignment
    assignedCounsellor: { type: mongoose.Schema.Types.ObjectId, ref: 'User', index: true },
    assignmentHistory: [
      {
        counsellor: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
        assignedAt: { type: Date, default: Date.now },
        assignedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
        reason: { type: String },
      },
    ],

    // Scoring
    leadScore: { type: Number, default: 0, min: 0, max: 100, index: true },
    leadCategory: { type: String, enum: ['hot', 'warm', 'cold'], default: 'cold' },

    // Follow-ups
    followUps: [followUpSchema],
    nextFollowUp: { type: Date, index: true },

    // Notes
    notes: [
      {
        content: { type: String, required: true },
        createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
        createdAt: { type: Date, default: Date.now },
      },
    ],

    // Activities / Timeline
    activities: [activitySchema],

    // Conversion
    convertedToStudent: { type: Boolean, default: false },
    studentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Student' },
    convertedAt: { type: Date },

    // Soft delete
    deletedAt: { type: Date, default: null },

    // Legacy fields (backward compat)
    name: { type: String }, // computed virtual below
    address: {
      city: { type: String },
      country: { type: String },
    },
    interestedCourse: { type: String },
    interestedCountry: { type: String },
    priority: { type: String, enum: ['low', 'medium', 'high', 'urgent'], default: 'medium' },
    assignedTo: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }, // alias for assignedCounsellor
    lastContactedAt: { type: Date },
    aiScore: { type: Number, min: 0, max: 100, default: 0 },
    metadata: { type: mongoose.Schema.Types.Mixed },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// ─── Virtuals ─────────────────────────────────────────────────────────────────
leadSchema.virtual('fullName').get(function () {
  return `${this.firstName || ''} ${this.lastName || ''}`.trim();
});

// ─── Pre-save: sync legacy name field ────────────────────────────────────────
leadSchema.pre('save', function (next) {
  if (this.firstName || this.lastName) {
    this.name = `${this.firstName || ''} ${this.lastName || ''}`.trim();
  }
  if (this.assignedCounsellor && !this.assignedTo) {
    this.assignedTo = this.assignedCounsellor;
  }
  next();
});

// ─── Indexes ──────────────────────────────────────────────────────────────────
leadSchema.index(
  { companyId: 1, phone: 1 },
  { unique: true, partialFilterExpression: { deletedAt: null } }
);
leadSchema.index({ companyId: 1, status: 1 });
leadSchema.index({ companyId: 1, leadScore: -1 });
leadSchema.index({ companyId: 1, nextFollowUp: 1 });
leadSchema.index({ companyId: 1, assignedCounsellor: 1 });
leadSchema.index({ companyId: 1, createdAt: -1 });
leadSchema.index({ firstName: 'text', lastName: 'text', email: 'text', phone: 'text' });

module.exports = mongoose.model('Lead', leadSchema);
