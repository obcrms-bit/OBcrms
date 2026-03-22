const mongoose = require('mongoose');

const leadAssignmentSchema = new mongoose.Schema(
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
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    branchId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Branch',
      default: null,
      index: true,
    },
    assignmentType: {
      type: String,
      enum: ['primary', 'collaborator', 'support', 'observer'],
      default: 'collaborator',
    },
    isPrimary: {
      type: Boolean,
      default: false,
      index: true,
    },
    assignedAt: {
      type: Date,
      default: Date.now,
    },
    assignedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    active: {
      type: Boolean,
      default: true,
      index: true,
    },
    unassignedAt: {
      type: Date,
      default: null,
    },
    unassignedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    note: {
      type: String,
      trim: true,
      default: '',
    },
    metadata: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
  },
  {
    timestamps: true,
    collection: 'lead_assignments',
  }
);

leadAssignmentSchema.index({ companyId: 1, leadId: 1, active: 1, assignedAt: -1 });
leadAssignmentSchema.index({ companyId: 1, userId: 1, active: 1, assignedAt: -1 });
leadAssignmentSchema.index({ companyId: 1, branchId: 1, active: 1 });
leadAssignmentSchema.index({ companyId: 1, leadId: 1, userId: 1, active: 1 });

leadAssignmentSchema.virtual('tenantId').get(function tenantIdGetter() {
  return this.companyId;
});

module.exports = mongoose.model('LeadAssignment', leadAssignmentSchema);
