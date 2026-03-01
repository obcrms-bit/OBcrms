const mongoose = require("mongoose");

const leadSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, "Lead name is required"],
  },
  email: {
    type: String,
    required: [true, "Lead email is required"],
    lowercase: true,
  },
  phone: {
    type: String,
  },
  source: {
    type: String,
    enum: ["website", "referral", "social", "advertising", "coldcall"],
    default: "website",
  },
  status: {
    type: String,
    enum: ["new", "contacted", "qualified", "converted", "lost"],
    default: "new",
  },
  interestedCourse: {
    type: String,
  },
  aiScore: {
    type: Number,
    min: 0,
    max: 100,
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

module.exports = mongoose.model("Lead", leadSchema);
