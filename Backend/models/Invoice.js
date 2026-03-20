const mongoose = require('mongoose');

const invoiceSchema = new mongoose.Schema(
  {
    companyId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Company',
      required: true,
      index: true,
    },
    studentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Student',
      required: true,
    },
    branchId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Branch',
      index: true,
    },
    applicantId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Applicant',
    },
    createdByUser: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    invoiceNumber: {
      type: String,
      unique: true,
      required: true,
    },
    items: [
      {
        description: String,
        amount: Number,
      },
    ],
    subTotal: Number,
    tax: {
      percentage: { type: Number, default: 0 },
      amount: { type: Number, default: 0 },
    },
    totalAmount: {
      type: Number,
      required: true,
    },
    currency: {
      type: String,
      default: 'USD',
    },
    status: {
      type: String,
      enum: ['draft', 'sent', 'partially-paid', 'paid', 'void', 'overdue'],
      default: 'draft',
      index: true,
    },
    dueDate: Date,
    paidAt: Date,
    paymentMethod: String,
    notes: String,
    pdfUrl: String,
    metadata: mongoose.Schema.Types.Mixed,
  },
  {
    timestamps: true,
  }
);

invoiceSchema.index({ companyId: 1, branchId: 1, status: 1 });

module.exports = mongoose.model('Invoice', invoiceSchema);
