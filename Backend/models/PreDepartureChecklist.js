const mongoose = require('mongoose');

const preDepartureChecklistSchema = new mongoose.Schema(
  {
    application: { type: mongoose.Schema.Types.ObjectId, ref: 'VisaApplication', required: true },
    items: [
      {
        label: { type: String, required: true },
        completed: { type: Boolean, default: false },
        completedAt: { type: Date },
        notes: { type: String },
      },
    ],
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

module.exports = mongoose.model('PreDepartureChecklist', preDepartureChecklistSchema);
