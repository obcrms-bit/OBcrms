const mongoose = require("mongoose");

const applicantSchema = new mongoose.Schema(
  {
    companyId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Company",
      required: true,
      index: true,
    },
    studentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Student",
      required: true,
      index: true,
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
      currency: { type: String, default: "USD" },
      status: { type: String, enum: ["pending", "paid"], default: "pending" },
    },
    tuitionFee: {
      amount: Number,
      currency: { type: String, default: "USD" },
    },
    status: {
      type: String,
      enum: ["draft", "submitted", "offer-received", "conditioned", "unconditioned", "cas-issued", "visa-applied", "visa-granted", "visa-rejected", "enrolled"],
      default: "draft",
      index: true,
    },
    offerLetterUrl: String,
    casLetterUrl: String,
    visaUrl: String,
    assignedOfficer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    notes: [
      {
        content: String,
        createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
        createdAt: { type: Date, default: Date.now },
      },
    ],
    metadata: mongoose.Schema.Types.Mixed,
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("Applicant", applicantSchema);

