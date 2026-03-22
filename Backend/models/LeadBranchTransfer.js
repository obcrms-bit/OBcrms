const mongoose = require('mongoose');

const leadBranchTransferSchema = new mongoose.Schema(
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
    sourceTransferRequestId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'TransferRequest',
      default: null,
      index: true,
    },
    fromBranchId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Branch',
      default: null,
    },
    toBranchId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Branch',
      required: true,
    },
    transferReason: {
      type: String,
      trim: true,
      required: true,
    },
    transferStatus: {
      type: String,
      enum: ['pending', 'approved', 'rejected', 'completed', 'cancelled'],
      default: 'pending',
      index: true,
    },
    requestedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    approvedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    toAssigneeId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    requestedAt: {
      type: Date,
      default: Date.now,
    },
    transferredAt: {
      type: Date,
      default: null,
    },
    metadata: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
  },
  {
    timestamps: true,
    collection: 'lead_branch_transfers',
  }
);

leadBranchTransferSchema.index({ companyId: 1, leadId: 1, createdAt: -1 });
leadBranchTransferSchema.index({ companyId: 1, transferStatus: 1, createdAt: -1 });
leadBranchTransferSchema.index({ companyId: 1, sourceTransferRequestId: 1 }, { sparse: true });

leadBranchTransferSchema.virtual('tenantId').get(function tenantIdGetter() {
  return this.companyId;
});

module.exports = mongoose.model('LeadBranchTransfer', leadBranchTransferSchema);
