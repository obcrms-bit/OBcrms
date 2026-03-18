const PDFDocument = require('pdfkit');
const fs = require('fs');
const path = require('path');
const os = require('os');

class PDFService {
  /**
   * Generates a PDF invoice
   * @param {Object} invoice - Invoice database object
   * @param {Object} student - Student database object
   * @param {Object} company - Company database object
   * @returns {Promise<string>} - Path to the generated PDF
   */
  static async generateInvoicePDF(invoice, student, company) {
    return new Promise((resolve, reject) => {
      try {
        const doc = new PDFDocument({ margin: 50 });
        const fileName = `invoice_${invoice.invoiceNumber}.pdf`;

        // Use OS temp directory for production compatibility (Render/Vercel/Local)
        const tempDir = path.join(os.tmpdir(), 'trust-crm-pdfs');
        const filePath = path.join(tempDir, fileName);

        // Ensure temp directory exists
        if (!fs.existsSync(tempDir)) {
          fs.mkdirSync(tempDir, { recursive: true });
        }

        const stream = fs.createWriteStream(filePath);
        doc.pipe(stream);

        // Header
        doc
          .fillColor('#444444')
          .fontSize(20)
          .text(company.name || 'Trust Education', 50, 50);
        doc.fontSize(10).text(company.address || '', 50, 75);
        doc.text(`${company.city || ''}, ${company.country || ''}`, 50, 90);
        doc.moveDown();

        // Invoice Header
        doc.fillColor('#000000').fontSize(20).text('INVOICE', 50, 160, { align: 'right' });
        doc
          .fontSize(10)
          .text(`Invoice Number: ${invoice.invoiceNumber}`, 50, 185, { align: 'right' });
        doc.text(`Date: ${new Date().toLocaleDateString()}`, 50, 200, { align: 'right' });
        doc.text(`Due Date: ${new Date(invoice.dueDate).toLocaleDateString()}`, 50, 215, {
          align: 'right',
        });

        // Bill To
        doc.fontSize(12).text('BILL TO:', 50, 160);
        doc.fontSize(10).text(student.fullName || 'Valued Student', 50, 180);
        doc.text(student.email || '', 50, 195);
        doc.text(student.phone || '', 50, 210);

        // Table Header
        const tableTop = 270;
        doc.font('Helvetica-Bold');
        doc.text('Description', 50, tableTop);
        doc.text('Amount', 400, tableTop, { align: 'right' });
        doc
          .moveTo(50, tableTop + 15)
          .lineTo(550, tableTop + 15)
          .stroke();

        // Table Body
        doc.font('Helvetica');
        let position = tableTop + 30;
        const items = Array.isArray(invoice.items) ? invoice.items : [];
        items.forEach((item) => {
          doc.text(item.description, 50, position);
          doc.text(`${invoice.currency} ${Number(item.amount).toFixed(2)}`, 400, position, {
            align: 'right',
          });
          position += 20;
        });

        // Totals
        const totalTop = position + 30;
        doc.moveTo(300, totalTop).lineTo(550, totalTop).stroke();
        doc.text('Subtotal', 350, totalTop + 10);
        doc.text(`${invoice.currency} ${Number(invoice.subTotal).toFixed(2)}`, 400, totalTop + 10, {
          align: 'right',
        });

        doc.text(`Tax (${invoice.tax?.percentage || 0}%)`, 350, totalTop + 25);
        doc.text(
          `${invoice.currency} ${Number(invoice.tax?.amount || 0).toFixed(2)}`,
          400,
          totalTop + 25,
          { align: 'right' }
        );

        doc
          .font('Helvetica-Bold')
          .fontSize(12)
          .text('Total', 350, totalTop + 45);
        doc.text(
          `${invoice.currency} ${Number(invoice.totalAmount).toFixed(2)}`,
          400,
          totalTop + 45,
          { align: 'right' }
        );

        // Footer
        doc
          .font('Helvetica')
          .fontSize(10)
          .text('Thank you for your business!', 50, 700, { align: 'center', width: 500 });

        doc.end();
        stream.on('finish', () => resolve(filePath));
        stream.on('error', (err) => reject(err));
      } catch (err) {
        reject(err);
      }
    });
  }
}

module.exports = PDFService;
