const mongoose = require("mongoose");

const applicationSchema = new mongoose.Schema({
  companyId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Company",
    required: [true, "Company ID is required"],
    index: true,
  },
  student: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Student",
    required: [true, "Student reference is required"],
  },
  universityName: {
    type: String,
    required: [true, "University name is required"],
    trim: true,
  },
  country: {
    type: String,
    trim: true,
  },
  course: {
    type: String,
    trim: true,
  },
  intake: {
    type: String,
    trim: true,
  },
  tuitionFee: {
    type: Number,
    min: 0,
  },
  status: {
    type: String,
    enum: [
      "Applied",
      "Offer Received",
      "Visa Filed",
      "Visa Approved",
      "Rejected",
    ],
    default: "Applied",
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  updatedAt: {
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.model("Application", applicationSchema);
