const mongoose = require('mongoose');

const visaDecisionSchema = new mongoose.Schema(
  {
    application: { type: mongoose.Schema.Types.ObjectId, ref: 'VisaApplication', required: true },
    status: {
      type: String,
      enum: ['approved', 'rejected', 'pending', 'appeal_in_progress'],
      default: 'pending',
    },
    decisionDate: { type: Date },
    rejectionReasons: [{ type: String }],
    notes: { type: String },
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

module.exports = mongoose.model('VisaDecision', visaDecisionSchema);
