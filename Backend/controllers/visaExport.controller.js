const VisaApplication = require('../models/VisaApplication');
const PDFService = require('../utils/PDFService');
const ExcelJS = require('exceljs');
const { sendSuccess, sendError } = require('../utils/responseHandler');

// GET /visa-applications/:id/export/pdf
exports.exportPDF = async (req, res) => {
  try {
    const app = await VisaApplication.findById(req.params.id).populate('student');
    if (!app) return sendError(res, 404, 'Visa application not found');
    const pdfBuffer = await PDFService.generateVisaApplicationPDF(app);
    res.set({
      'Content-Type': 'application/pdf',
      'Content-Disposition': 'attachment; filename="visa-application.pdf"',
    });
    return res.send(pdfBuffer);
  } catch (error) {
    return sendError(res, 500, 'Failed to export PDF', error.message);
  }
};

// GET /visa-applications/:id/export/excel
exports.exportExcel = async (req, res) => {
  try {
    const app = await VisaApplication.findById(req.params.id).populate('student');
    if (!app) return sendError(res, 404, 'Visa application not found');
    const workbook = new ExcelJS.Workbook();
    const sheet = workbook.addWorksheet('Visa Application');
    sheet.addRow(['Field', 'Value']);
    Object.entries(app.toObject()).forEach(([key, value]) => {
      sheet.addRow([key, typeof value === 'object' ? JSON.stringify(value) : value]);
    });
    res.set({
      'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'Content-Disposition': 'attachment; filename="visa-application.xlsx"',
    });
    await workbook.xlsx.write(res);
    res.end();
  } catch (error) {
    return sendError(res, 500, 'Failed to export Excel', error.message);
  }
};
