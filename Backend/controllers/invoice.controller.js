const Invoice = require('../models/Invoice');
const Student = require('../models/Student');
const Company = require('../models/Company');
const AuditLog = require('../models/AuditLog');
const PDFService = require('../utils/PDFService');
const EmailService = require('../utils/EmailService');
const { sendSuccess, sendError } = require('../utils/responseHandler');
const mongoose = require('mongoose');

exports.createInvoice = async (req, res) => {
  try {
    const {
      studentId,
      applicantId,
      items,
      subTotal,
      taxPercentage,
      totalAmount,
      currency,
      dueDate,
    } = req.body;
    const companyObjectId = new mongoose.Types.ObjectId(req.companyId);

    const student = await Student.findOne({ _id: studentId, companyId: companyObjectId });
    if (!student) return sendError(res, 404, 'Student not found');

    // Generate invoice number
    const count = await Invoice.countDocuments({ companyId: req.companyId });
    const invoiceNumber = `INV-${new Date().getFullYear()}-${(count + 1).toString().padStart(4, '0')}`;

    const invoice = await Invoice.create({
      companyId: req.companyId,
      studentId,
      applicantId,
      invoiceNumber,
      items,
      subTotal,
      tax: { percentage: taxPercentage, amount: (subTotal * taxPercentage) / 100 },
      totalAmount,
      currency,
      dueDate,
      status: 'draft',
    });

    await AuditLog.logAction({
      companyId: req.companyId,
      userId: req.user._id,
      userName: req.user.name,
      userRole: req.user.role,
      action: 'create',
      resource: 'invoice',
      resourceId: invoice._id,
      resourceName: invoiceNumber,
    });

    return sendSuccess(res, 201, 'Invoice created successfully', invoice);
  } catch (error) {
    return sendError(res, 400, 'Failed to create invoice', error.message);
  }
};

exports.sendInvoiceEmail = async (req, res) => {
  try {
    const { id } = req.params;
    const companyObjectId = new mongoose.Types.ObjectId(req.companyId);
    const invoice = await Invoice.findOne({ _id: id, companyId: companyObjectId }).populate(
      'studentId'
    );
    if (!invoice) return sendError(res, 404, 'Invoice not found');

    const student = invoice.studentId;
    const company = await Company.findById(req.companyId);
    if (!company) return sendError(res, 404, 'Company context not found');

    // 1. Generate PDF
    const pdfPath = await PDFService.generateInvoicePDF(invoice, student, company);

    // 2. Send Email
    const emailData = {
      invoiceNumber: invoice.invoiceNumber,
      studentName: student.fullName,
      totalAmount: invoice.totalAmount,
      currency: invoice.currency,
      dueDate: new Date(invoice.dueDate).toLocaleDateString(),
      companyName: company.name,
    };

    await EmailService.sendInvoice(student.email, emailData, pdfPath);

    // 3. Update status to 'sent'
    invoice.status = 'sent';
    await invoice.save();

    await AuditLog.logAction({
      companyId: req.companyId,
      userId: req.user._id,
      userName: req.user.name,
      userRole: req.user.role,
      action: 'update',
      resource: 'invoice',
      resourceId: invoice._id,
      resourceName: invoice.invoiceNumber,
      metadata: { action: 'email_sent' },
    });

    return sendSuccess(res, 200, 'Invoice email sent successfully');
  } catch (error) {
    console.error('Email send error:', error);
    return sendError(res, 500, 'Failed to send invoice email', error.message);
  }
};

exports.getInvoices = async (req, res) => {
  try {
    const companyObjectId = new mongoose.Types.ObjectId(req.companyId);
    const invoices = await Invoice.find({ companyId: companyObjectId })
      .populate('studentId')
      .sort({ createdAt: -1 });
    return sendSuccess(res, 200, 'Invoices retrieved successfully', invoices);
  } catch (error) {
    return sendError(res, 500, 'Failed to fetch invoices', error.message);
  }
};

exports.updateInvoiceStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, paymentMethod } = req.body;
    const companyObjectId = new mongoose.Types.ObjectId(req.companyId);

    const invoice = await Invoice.findOne({ _id: id, companyId: companyObjectId });
    if (!invoice) return sendError(res, 404, 'Invoice not found');

    const oldStatus = invoice.status;
    invoice.status = status;
    if (status === 'paid') {
      invoice.paidAt = new Date();
      invoice.paymentMethod = paymentMethod;
    }
    await invoice.save();

    await AuditLog.logAction({
      companyId: req.companyId,
      userId: req.user._id,
      userName: req.user.name,
      userRole: req.user.role,
      action: 'update',
      resource: 'invoice',
      resourceId: invoice._id,
      resourceName: invoice.invoiceNumber,
      changes: { before: { status: oldStatus }, after: { status } },
    });

    return sendSuccess(res, 200, 'Invoice status updated', invoice);
  } catch (error) {
    return sendError(res, 400, 'Failed to update invoice status', error.message);
  }
};
