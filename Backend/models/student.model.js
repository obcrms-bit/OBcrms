const mongoose = require("mongoose");

const studentSchema = new mongoose.Schema(
  {
    // Multi-Tenancy: Every student belongs to exactly one company
    companyId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Company",
      required: [true, "Company ID is required"],
      index: true,
      // CRITICAL: This ensures data isolation
    },

    // Personal Info
    fullName: {
      type: String,
      required: [true, "Full name is required"],
      trim: true,
    },

    name: {
      type: String,
      trim: true,
    },

    email: {
      type: String,
      required: [true, "Email is required"],
      lowercase: true,
      trim: true,
      // Unique per company (compound index below)
    },

    phone: {
      type: String,
      trim: true,
    },

    // Academic Info
    course: {
      type: String,
      enum: ["Bachelor's", "Master's", "Diploma", "Certificate", "Other"],
      default: "Bachelor's",
    },

    interestedCountries: [String],

    countryInterested: {
      type: String,
      trim: true,
    },

    targetUniversities: [String],

    // Status & Progress
    status: {
      type: String,
      enum: ["New", "Processing", "Applied", "Visa Approved", "Rejected"],
      default: "New",
      index: true,
    },

    // Counselor Assignment
    assignedCounselor: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      index: true,
    },

    assignedCounselorName: String,

    // Communication
    notes: {
      type: String,
      trim: true,
    },

    // Detailed notes/activity history
    communicationHistory: [
      {
        createdBy: mongoose.Schema.Types.ObjectId,
        createdByName: String,
        message: String,
        communicationType: String, // 'note', 'call', 'email', 'whatsapp'
        createdAt: Date,
      },
    ],

    // Dates
    applicationSubmittedDate: Date,

    docsReceivedDate: Date,

    visaApprovedDate: Date,

    // Metadata
    metadata: mongoose.Schema.Types.Mixed,

    createdAt: {
      type: Date,
      default: Date.now,
    },

    updatedAt: {
      type: Date,
      default: Date.now,
    },

    deletedAt: Date, // Soft delete
  },
  {
    timestamps: true,
    collection: "students",
  }
);

// CRITICAL: Compound indexes for multi-tenancy and performance
studentSchema.index({ companyId: 1, email: 1 }, { unique: true });
studentSchema.index({ companyId: 1, status: 1 });
studentSchema.index({ companyId: 1, assignedCounselor: 1 });
studentSchema.index({ companyId: 1, createdAt: -1 });

// Text search index
studentSchema.index({
  companyId: 1,
  fullName: "text",
  email: "text",
});

// Middleware: Update updatedAt before saving
studentSchema.pre("save", function () {
  this.updatedAt = new Date();
});

// Method: Add communication entry
studentSchema.methods.addCommunication = function (userId, userName, message, type = "note") {
  this.communicationHistory.push({
    createdBy: userId,
    createdByName: userName,
    message,
    communicationType: type,
    createdAt: new Date(),
  });
  return this.save();
};

// Method: Get counselor details (if assigned)
studentSchema.methods.getCounselorInfo = async function () {
  if (!this.assignedCounselor) return null;
  const User = mongoose.model("User");
  return User.findById(this.assignedCounselor)
    .select("name email phone")
    .lean();
};

module.exports = mongoose.model("Student", studentSchema);
