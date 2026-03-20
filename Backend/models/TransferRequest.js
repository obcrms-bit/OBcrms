const mongoose = require('mongoose');

const transferEventSchema = new mongoose.Schema(
  {
    status: {
      type: String,
      enum: ['pending', 'approved', 'rejected', 'completed', 'cancelled'],
      required: true,
    },
    changedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    changedAt: { type: Date, default: Date.now },
    notes: { type: String, trim: true },
  },
  { _id: false }
);

const transferRequestSchema = new mongoose.Schema(
  {
    companyId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Company',
      required: true,
      index: true,
    },
    leadId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Lead',
      required: true,
      index: true,
    },
    fromBranchId: { type: mongoose.Schema.Types.ObjectId, ref: 'Branch', required: true },
    toBranchId: { type: mongoose.Schema.Types.ObjectId, ref: 'Branch', required: true },
    fromAssigneeId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    toAssigneeId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    requestedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    approvedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    rejectedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    completedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    reason: { type: String, required: true, trim: true },
    rejectionReason: { type: String, trim: true },
    status: {
      type: String,
      enum: ['pending', 'approved', 'rejected', 'completed', 'cancelled'],
      default: 'pending',
      index: true,
    },
    requiresApproval: { type: Boolean, default: false },
    requestedAt: { type: Date, default: Date.now },
    actedAt: { type: Date },
    completedAt: { type: Date },
    history: { type: [transferEventSchema], default: [] },
    metadata: { type: mongoose.Schema.Types.Mixed, default: {} },
  },
  { timestamps: true, collection: 'transfer_requests' }
);

transferRequestSchema.index({ companyId: 1, status: 1, createdAt: -1 });
transferRequestSchema.index({ companyId: 1, fromBranchId: 1, toBranchId: 1 });

module.exports = mongoose.model('TransferRequest', transferRequestSchema);
