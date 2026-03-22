const mongoose = require('mongoose');

const partnerSchema = new mongoose.Schema(
  {
    companyId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Company',
      required: true,
      index: true,
    },
    code: {
      type: String,
      trim: true,
      uppercase: true,
    },
    name: {
      type: String,
      required: true,
      trim: true,
    },
    category: {
      type: String,
      trim: true,
      lowercase: true,
      default: 'partner',
    },
    email: {
      type: String,
      trim: true,
      lowercase: true,
    },
    phone: {
      type: String,
      trim: true,
    },
    status: {
      type: String,
      enum: ['active', 'inactive'],
      default: 'active',
    },
    metadata: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
  },
  {
    timestamps: true,
    collection: 'partners',
  }
);

partnerSchema.index({ companyId: 1, code: 1 }, { unique: true, sparse: true });
partnerSchema.index({ companyId: 1, email: 1 }, { sparse: true });
partnerSchema.virtual('tenantId').get(function tenantIdGetter() {
  return this.companyId;
});

module.exports = mongoose.model('Partner', partnerSchema);
