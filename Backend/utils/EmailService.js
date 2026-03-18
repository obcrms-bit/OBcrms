const nodemailer = require('nodemailer');
const ejs = require('ejs');
const path = require('path');
const fs = require('fs');

class EmailService {
  /**
   * Creates a nodemailer transporter lazily (only when sending).
   * Prevents startup crash when EMAIL_USER / EMAIL_PASS are not configured.
   */
  static _getTransporter() {
    if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
      throw new Error(
        'Email service is not configured. Set EMAIL_USER and EMAIL_PASS environment variables.'
      );
    }
    return nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    });
  }

  /**
   * Sends an invoice email with PDF attachment
   * @param {string} to - Recipient email
   * @param {Object} invoiceData - Data for the email template
   * @param {string} pdfPath - Path to the attached PDF
   */
  static async sendInvoice(to, invoiceData, pdfPath) {
    try {
      const transporter = EmailService._getTransporter();

      const templatePath = path.join(__dirname, '../templates/invoice_email.ejs');

      // Ensure templates directory exists and create default template if missing
      const templateDir = path.dirname(templatePath);
      if (!fs.existsSync(templateDir)) {
        fs.mkdirSync(templateDir, { recursive: true });
      }
      if (!fs.existsSync(templatePath)) {
        fs.writeFileSync(
          templatePath,
          `<!DOCTYPE html>
<html>
<body>
  <h1>Invoice #<%= invoiceNumber %></h1>
  <p>Dear <%= studentName %>,</p>
  <p>Please find your invoice attached.</p>
  <p>Total Amount Due: <%= currency %> <%= totalAmount %></p>
  <p>Due Date: <%= dueDate %></p>
  <p>Best Regards,<br><%= companyName %></p>
</body>
</html>`
        );
      }

      const html = await ejs.renderFile(templatePath, invoiceData);

      const mailOptions = {
        from: `"${invoiceData.companyName}" <${process.env.EMAIL_USER}>`,
        to,
        subject: `Invoice #${invoiceData.invoiceNumber} from ${invoiceData.companyName}`,
        html,
        attachments: [
          {
            filename: `invoice_${invoiceData.invoiceNumber}.pdf`,
            path: pdfPath,
          },
        ],
      };

      await transporter.sendMail(mailOptions);
      console.log(`Invoice email sent to ${to}`);
    } catch (error) {
      console.error('Error sending invoice email:', error.message);
      throw error;
    }
  }
}

module.exports = EmailService;
