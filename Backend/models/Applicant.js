const mongoose = require('mongoose');

const applicantSchema = new mongoose.Schema(
  {
    companyId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Company',
      required: true,
      index: true,
    },
    studentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Student',
      required: true,
      index: true,
    },
    branchId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Branch',
      index: true,
    },
    createdByUser: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    universityName: {
      type: String,
      required: true,
      trim: true,
    },
    country: {
      type: String,
      required: true,
    },
    countryWorkflowId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'CountryWorkflow',
    },
    courseName: {
      type: String,
      required: true,
    },
    intake: {
      month: String,
      year: Number,
    },
    applicationFee: {
      amount: Number,
      currency: { type: String, default: 'USD' },
      status: { type: String, enum: ['pending', 'paid'], default: 'pending' },
    },
    tuitionFee: {
      amount: Number,
      currency: { type: String, default: 'USD' },
    },
    status: {
      type: String,
      default: 'draft',
      index: true,
    },
    stage: {
      type: String,
      default: 'draft',
      index: true,
    },
    timeline: {
      type: [
        {
          stage: { type: String, required: true },
          label: { type: String, trim: true },
          notes: { type: String, trim: true },
          changedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
          changedAt: { type: Date, default: Date.now },
        },
      ],
      default: [],
    },
    documents: {
      type: [
        {
          name: { type: String, trim: true },
          required: { type: Boolean, default: true },
          status: {
            type: String,
            enum: ['pending', 'uploaded', 'verified', 'rejected'],
            default: 'pending',
          },
          notes: { type: String, trim: true },
        },
      ],
      default: [],
    },
    offerLetterUrl: String,
    casLetterUrl: String,
    visaUrl: String,
    assignedOfficer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    notes: [
      {
        content: String,
        createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
        createdAt: { type: Date, default: Date.now },
      },
    ],
    metadata: mongoose.Schema.Types.Mixed,
  },
  {
    timestamps: true,
  }
);

applicantSchema.index({ companyId: 1, branchId: 1, status: 1 });
applicantSchema.virtual('tenantId').get(function tenantIdGetter() {
  return this.companyId;
});

module.exports = mongoose.model('Applicant', applicantSchema);
