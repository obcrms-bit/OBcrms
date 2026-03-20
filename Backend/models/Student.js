const mongoose = require('mongoose');

const studentSchema = new mongoose.Schema(
  {
    companyId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Company',
      required: true,
      index: true,
    },
    branchId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Branch',
      index: true,
    },
    branchName: { type: String, trim: true },
    leadId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Lead',
    },
    fullName: {
      type: String,
      required: [true, 'Full name is required'],
      trim: true,
    },
    firstName: { type: String, trim: true },
    lastName: { type: String, trim: true },
    email: {
      type: String,
      lowercase: true,
      trim: true,
    },
    phone: {
      type: String,
      required: [true, 'Phone number is required'],
      trim: true,
    },
    mobile: { type: String, trim: true },
    passportNumber: String,
    dateOfBirth: Date,
    gender: { type: String, trim: true },
    source: { type: String, trim: true },
    stream: { type: String, trim: true },
    interestedCourse: { type: String, trim: true },
    preferredLocation: { type: String, trim: true },
    address: {
      street: String,
      city: String,
      state: String,
      country: String,
      zipCode: String,
      fullAddress: String,
    },
    guardianName: { type: String, trim: true },
    guardianContact: { type: String, trim: true },
    educationHistory: [
      {
        institution: String,
        degree: String,
        major: String,
        percentage: Number,
        passingYear: Number,
        level: String,
        country: String,
        universityTitle: String,
        point: String,
        percentageValue: String,
      },
    ],
    testScores: {
      ielts: {
        reading: Number,
        writing: Number,
        listening: Number,
        speaking: Number,
        overall: Number,
      },
      pte: { overall: Number },
      gre: { overall: Number },
      gmat: { overall: Number },
      toefl: { overall: Number },
    },
    interestedCountries: [String],
    interestedCourses: [String],
    status: {
      type: String,
      enum: [
        'prospect',
        'counseling',
        'document-collection',
        'application-submitted',
        'visa-processing',
        'visa-approved',
        'enrolled',
        'rejected',
        'withdrawn',
      ],
      default: 'prospect',
      index: true,
    },
    assignedCounselor: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      index: true,
    },
    documents: [
      {
        name: String,
        url: String,
        status: { type: String, enum: ['pending', 'verified', 'rejected'], default: 'pending' },
        uploadedAt: { type: Date, default: Date.now },
      },
    ],
    notes: [
      {
        content: String,
        createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
        createdAt: { type: Date, default: Date.now },
      },
    ],
    leadSnapshot: mongoose.Schema.Types.Mixed,
    metadata: mongoose.Schema.Types.Mixed,
    deletedAt: { type: Date, default: null },
  },
  {
    timestamps: true,
  }
);

studentSchema.pre('save', function syncStudentAliases(next) {
  if (!this.mobile && this.phone) {
    this.mobile = this.phone;
  }
  if (!this.phone && this.mobile) {
    this.phone = this.mobile;
  }
  if (!this.fullName) {
    this.fullName = `${this.firstName || ''} ${this.lastName || ''}`.trim();
  }
  next();
});

studentSchema.index(
  { companyId: 1, email: 1 },
  { unique: true, partialFilterExpression: { email: { $type: 'string' } } }
);
studentSchema.index({ companyId: 1, phone: 1 }, { unique: true });

module.exports = mongoose.model('Student', studentSchema);
