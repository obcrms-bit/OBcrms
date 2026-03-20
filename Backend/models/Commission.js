const mongoose = require('mongoose');

const commissionSchema = new mongoose.Schema({
  companyId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Company',
    required: [true, 'Company ID is required'],
    index: true,
  },
  branchId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Branch',
    index: true,
  },
  agentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Agent',
    required: [true, 'Agent ID is required'],
    index: true,
  },
  agentUserId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    index: true,
  },
  leadId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Lead',
  },
  studentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Student',
  },
  amount: {
    type: Number,
    required: [true, 'Commission amount is required'],
    min: 0,
  },
  commissionType: {
    type: String,
    enum: ['lead_submission', 'conversion', 'application', 'custom'],
    default: 'conversion',
  },
  status: {
    type: String,
    enum: ['pending', 'approved', 'paid', 'cancelled'],
    default: 'pending',
  },
  approvedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
  },
  approvedAt: Date,
  paidAt: Date,
  transactionDate: {
    type: Date,
    default: Date.now,
  },
  notes: {
    type: String,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  updatedAt: {
    type: Date,
    default: Date.now,
  },
  metadata: {
    type: mongoose.Schema.Types.Mixed,
    default: {},
  },
});

commissionSchema.index({ companyId: 1, agentId: 1, createdAt: -1 });
commissionSchema.index({ companyId: 1, status: 1, createdAt: -1 });

module.exports = mongoose.model('Commission', commissionSchema);
