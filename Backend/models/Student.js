const mongoose = require("mongoose");

const studentSchema = new mongoose.Schema(
  {
    companyId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Company",
      required: true,
      index: true,
    },
    leadId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Lead",
    },
    fullName: {
      type: String,
      required: [true, "Full name is required"],
      trim: true,
    },
    email: {
      type: String,
      lowercase: true,
      trim: true,
    },
    phone: {
      type: String,
      required: [true, "Phone number is required"],
      trim: true,
    },
    passportNumber: String,
    dateOfBirth: Date,
    address: {
      street: String,
      city: String,
      state: String,
      country: String,
      zipCode: String,
    },
    educationHistory: [
      {
        institution: String,
        degree: String,
        major: String,
        percentage: Number,
        passingYear: Number,
      },
    ],
    testScores: {
      ielts: { reading: Number, writing: Number, listening: Number, speaking: Number, overall: Number },
      pte: { overall: Number },
      gre: { overall: Number },
      gmat: { overall: Number },
      toefl: { overall: Number },
    },
    interestedCountries: [String],
    interestedCourses: [String],
    status: {
      type: String,
      enum: ["prospect", "counseling", "document-collection", "application-submitted", "visa-processing", "visa-approved", "enrolled", "rejected", "withdrawn"],
      default: "prospect",
      index: true,
    },
    assignedCounselor: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      index: true,
    },
    documents: [
      {
        name: String,
        url: String,
        status: { type: String, enum: ["pending", "verified", "rejected"], default: "pending" },
        uploadedAt: { type: Date, default: Date.now },
      },
    ],
    notes: [
      {
        content: String,
        createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
        createdAt: { type: Date, default: Date.now },
      },
    ],
    metadata: mongoose.Schema.Types.Mixed,
    deletedAt: { type: Date, default: null },
  },
  {
    timestamps: true,
  }
);

studentSchema.index({ companyId: 1, email: 1 }, { unique: true });
studentSchema.index({ companyId: 1, phone: 1 }, { unique: true });

module.exports = mongoose.model("Student", studentSchema);

