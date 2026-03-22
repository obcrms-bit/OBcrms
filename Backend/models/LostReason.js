const mongoose = require('mongoose');

const lostReasonSchema = new mongoose.Schema(
  {
    companyId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Company',
      required: true,
      index: true,
    },
    label: {
      type: String,
      required: true,
      trim: true,
    },
    active: {
      type: Boolean,
      default: true,
      index: true,
    },
    order: {
      type: Number,
      default: 0,
    },
    metadata: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
  },
  {
    timestamps: true,
    collection: 'lost_reasons',
  }
);

lostReasonSchema.index({ companyId: 1, label: 1 }, { unique: true });
lostReasonSchema.index({ companyId: 1, active: 1, order: 1 });

lostReasonSchema.virtual('tenantId').get(function tenantIdGetter() {
  return this.companyId;
});

module.exports = mongoose.model('LostReason', lostReasonSchema);
