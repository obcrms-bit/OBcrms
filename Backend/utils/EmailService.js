const nodemailer = require('nodemailer');
const ejs = require('ejs');
const path = require('path');
const fs = require('fs');

const normalizeBoolean = (value) => ['1', 'true', 'yes', 'on'].includes(String(value).toLowerCase());

class EmailService {
  static _getConfig() {
    const host = process.env.SMTP_HOST || process.env.EMAIL_HOST;
    const port = Number(process.env.SMTP_PORT || process.env.EMAIL_PORT || 587);
    const user = process.env.SMTP_USER || process.env.EMAIL_USER;
    const pass = process.env.SMTP_PASS || process.env.EMAIL_PASS;
    const secure =
      typeof process.env.SMTP_SECURE !== 'undefined'
        ? normalizeBoolean(process.env.SMTP_SECURE)
        : port === 465;
    const from = process.env.EMAIL_FROM || user;

    return {
      host,
      port,
      user,
      pass,
      secure,
      from,
    };
  }

  static isConfigured() {
    const config = EmailService._getConfig();
    return Boolean(config.host && config.user && config.pass && config.from);
  }

  static _getTransporter() {
    const config = EmailService._getConfig();

    if (!EmailService.isConfigured()) {
      throw new Error(
        'Email service is not configured. Set SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS, and EMAIL_FROM.'
      );
    }

    return nodemailer.createTransport({
      host: config.host,
      port: config.port,
      secure: config.secure,
      auth: {
        user: config.user,
        pass: config.pass,
      },
    });
  }

  static async send({ to, subject, html, text }) {
    const transporter = EmailService._getTransporter();
    const config = EmailService._getConfig();

    return transporter.sendMail({
      from: config.from,
      to,
      subject,
      html,
      text,
    });
  }

  static async sendInvoice(to, invoiceData, pdfPath) {
    try {
      const transporter = EmailService._getTransporter();
      const config = EmailService._getConfig();
      const templatePath = path.join(__dirname, '../templates/invoice_email.ejs');
      const html = fs.existsSync(templatePath)
        ? await ejs.renderFile(templatePath, invoiceData)
        : await ejs.render(
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
</html>`,
          invoiceData
        );

      await transporter.sendMail({
        from: `"${invoiceData.companyName}" <${config.from}>`,
        to,
        subject: `Invoice #${invoiceData.invoiceNumber} from ${invoiceData.companyName}`,
        html,
        attachments: [
          {
            filename: `invoice_${invoiceData.invoiceNumber}.pdf`,
            path: pdfPath,
          },
        ],
      });

      console.log(`Invoice email sent to ${to}`);
    } catch (error) {
      console.error('Error sending invoice email:', error.message);
      throw error;
    }
  }

  static async sendFollowUpReminder({
    to,
    counsellorName,
    leadName,
    leadPhone,
    leadEmail,
    scheduledAt,
    method,
    leadUrl,
    reminderCount,
  }) {
    const subject = `Overdue follow-up reminder: ${leadName}`;
    const html = `
      <div style="font-family: Arial, sans-serif; color: #0f172a; line-height: 1.6;">
        <h2 style="margin-bottom: 12px;">Overdue follow-up reminder</h2>
        <p>Hello ${counsellorName || 'Team'},</p>
        <p>A scheduled follow-up is now overdue and needs your attention.</p>
        <table style="border-collapse: collapse; margin: 16px 0;">
          <tr><td style="padding: 6px 12px 6px 0;"><strong>Lead</strong></td><td>${leadName}</td></tr>
          <tr><td style="padding: 6px 12px 6px 0;"><strong>Mobile</strong></td><td>${leadPhone || 'Not provided'}</td></tr>
          <tr><td style="padding: 6px 12px 6px 0;"><strong>Email</strong></td><td>${leadEmail || 'Not provided'}</td></tr>
          <tr><td style="padding: 6px 12px 6px 0;"><strong>Scheduled for</strong></td><td>${new Date(
    scheduledAt
  ).toLocaleString()}</td></tr>
          <tr><td style="padding: 6px 12px 6px 0;"><strong>Method</strong></td><td>${method || 'Call'}</td></tr>
          <tr><td style="padding: 6px 12px 6px 0;"><strong>Reminder count</strong></td><td>${
  reminderCount || 1
}</td></tr>
        </table>
        ${
  leadUrl
    ? `<p><a href="${leadUrl}" style="display:inline-block; background:#0f172a; color:#fff; text-decoration:none; padding:10px 16px; border-radius:10px;">Open lead in CRM</a></p>`
    : ''
}
        <p style="margin-top: 18px;">Please complete or reschedule the follow-up to keep the pipeline current.</p>
      </div>
    `;

    const text = `Overdue follow-up reminder for ${leadName}. Scheduled for ${new Date(
      scheduledAt
    ).toLocaleString()}. ${leadUrl ? `Open CRM: ${leadUrl}` : ''}`;

    return EmailService.send({ to, subject, html, text });
  }

  static async sendFollowUpSummary({
    to,
    recipientName,
    title,
    intro,
    items,
  }) {
    const rows = items
      .map(
        (item) => `
          <tr>
            <td style="padding:8px 10px;border-bottom:1px solid #e2e8f0;">${item.leadName}</td>
            <td style="padding:8px 10px;border-bottom:1px solid #e2e8f0;">${
  item.counsellorName || '-'
}</td>
            <td style="padding:8px 10px;border-bottom:1px solid #e2e8f0;">${new Date(
    item.scheduledAt
  ).toLocaleString()}</td>
            <td style="padding:8px 10px;border-bottom:1px solid #e2e8f0;">${item.status}</td>
          </tr>
        `
      )
      .join('');

    const html = `
      <div style="font-family: Arial, sans-serif; color: #0f172a; line-height: 1.6;">
        <h2>${title}</h2>
        <p>Hello ${recipientName || 'Team'},</p>
        <p>${intro}</p>
        <table style="border-collapse: collapse; width: 100%; margin-top: 16px;">
          <thead>
            <tr>
              <th style="text-align:left;padding:8px 10px;border-bottom:2px solid #cbd5e1;">Lead</th>
              <th style="text-align:left;padding:8px 10px;border-bottom:2px solid #cbd5e1;">Counsellor</th>
              <th style="text-align:left;padding:8px 10px;border-bottom:2px solid #cbd5e1;">Scheduled</th>
              <th style="text-align:left;padding:8px 10px;border-bottom:2px solid #cbd5e1;">Status</th>
            </tr>
          </thead>
          <tbody>${rows}</tbody>
        </table>
      </div>
    `;

    const text = `${title}\n\n${items
      .map(
        (item) =>
          `${item.leadName} | ${item.counsellorName || '-'} | ${new Date(item.scheduledAt).toLocaleString()} | ${item.status}`
      )
      .join('\n')}`;

    return EmailService.send({ to, subject: title, html, text });
  }
}

module.exports = EmailService;
