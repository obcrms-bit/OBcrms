const mongoose = require("mongoose");

const leadSchema = new mongoose.Schema(
  {
    companyId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Company",
      required: true,
      index: true,
    },
    branchId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Branch",
    },
    name: {
      type: String,
      required: [true, "Lead name is required"],
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
    address: {
      city: String,
      country: String,
    },
    source: {
      type: String,
      enum: ["website", "facebook", "instagram", "walk-in", "referral", "other"],
      default: "website",
    },
    status: {
      type: String,
      enum: ["new", "contacted", "qualified", "converted", "lost", "junk"],
      default: "new",
      index: true,
    },
    interestedCourse: String,
    interestedCountry: String,
    education: {
      lastDegree: String,
      percentage: Number,
      passingYear: Number,
    },
    priority: {
      type: String,
      enum: ["low", "medium", "high", "urgent"],
      default: "medium",
    },
    assignedTo: {
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
    lastContactedAt: Date,
    aiScore: {
      type: Number,
      min: 0,
      max: 100,
      default: 0,
    },
    metadata: mongoose.Schema.Types.Mixed,
    deletedAt: { type: Date, default: null },
  },
  {
    timestamps: true,
  }
);

// Compound index for unique lead per company (phone/email check)
leadSchema.index({ companyId: 1, phone: 1 }, { unique: true });

module.exports = mongoose.model("Lead", leadSchema);

