const mongoose = require('mongoose');

const visaMilestoneSchema = new mongoose.Schema(
  {
    application: { type: mongoose.Schema.Types.ObjectId, ref: 'VisaApplication', required: true },
    key: { type: String, required: true },
    label: { type: String, required: true },
    description: { type: String },
    order: { type: Number },
    completed: { type: Boolean, default: false },
    completedAt: { type: Date },
    deadline: { type: Date },
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

visaMilestoneSchema.index({ application: 1, order: 1 });

module.exports = mongoose.model('VisaMilestone', visaMilestoneSchema);
