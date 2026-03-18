const mongoose = require('mongoose');

const visaInterviewSchema = new mongoose.Schema(
  {
    application: { type: mongoose.Schema.Types.ObjectId, ref: 'VisaApplication', required: true },
    scheduledAt: { type: Date },
    completedAt: { type: Date },
    status: {
      type: String,
      enum: ['scheduled', 'completed', 'no_show', 'cancelled'],
      default: 'scheduled',
    },
    outcome: { type: String },
    notes: { type: String },
    mockScore: { type: Number },
    preparationChecklist: [{ type: String }],
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

module.exports = mongoose.model('VisaInterview', visaInterviewSchema);
