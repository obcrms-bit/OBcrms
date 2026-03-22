const PDFDocument = require('pdfkit');
let puppeteer = null;

try {
  puppeteer = require('puppeteer');
} catch (error) {
  puppeteer = null;
}

const escapeHtml = (value) =>
  String(value || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');

const renderList = (items = []) =>
  items
    .map(
      (item) => `
        <li style="margin:0 0 14px 0;">
          <div style="font-size:15px;font-weight:700;color:#0f172a;">${escapeHtml(item.title)}</div>
          <div style="margin-top:6px;font-size:13px;line-height:1.6;color:#334155;">${escapeHtml(
    item.description
  )}</div>
        </li>
      `
    )
    .join('');

const renderMetricCards = (metrics = {}) => {
  const cards = [
    ['Records', metrics.totalRecords || 0],
    ['Conversion Rate', `${metrics.conversionRate || 0}%`],
    ['Revenue', `${metrics.currency || 'USD'} ${(metrics.totalRevenue || 0).toLocaleString()}`],
    ['Completeness', `${metrics.completenessRate || 0}%`],
  ];

  return cards
    .map(
      ([label, value]) => `
        <div style="padding:18px;border:1px solid #e2e8f0;border-radius:20px;background:#f8fafc;">
          <div style="font-size:11px;font-weight:700;letter-spacing:0.18em;text-transform:uppercase;color:#64748b;">${escapeHtml(
    label
  )}</div>
          <div style="margin-top:10px;font-size:28px;font-weight:700;color:#0f172a;">${escapeHtml(
    value
  )}</div>
        </div>
      `
    )
    .join('');
};

exports.renderReportHtml = ({ report, companyName, shareUrl = '' }) => {
  const branding = report.branding || {};
  const primaryColor = branding.primaryColor || '#0f766e';
  const secondaryColor = branding.secondaryColor || '#0f172a';
  const accentColor = branding.accentColor || '#14b8a6';

  return `
    <!doctype html>
    <html lang="en">
      <head>
        <meta charset="utf-8" />
        <title>${escapeHtml(report.title)}</title>
        <style>
          body {
            margin: 0;
            font-family: ${escapeHtml(branding.fontFamily || 'Inter, Arial, sans-serif')};
            color: #0f172a;
            background: #f8fafc;
          }
          .page {
            padding: 48px;
          }
          .hero {
            padding: 40px;
            border-radius: 28px;
            background: linear-gradient(135deg, ${secondaryColor} 0%, ${primaryColor} 100%);
            color: white;
          }
          .eyebrow {
            margin: 0 0 14px 0;
            font-size: 11px;
            font-weight: 700;
            letter-spacing: 0.24em;
            text-transform: uppercase;
            color: ${accentColor};
          }
          .grid {
            display: grid;
            grid-template-columns: repeat(2, minmax(0, 1fr));
            gap: 18px;
          }
          .section {
            margin-top: 28px;
            padding: 28px;
            border: 1px solid #e2e8f0;
            border-radius: 24px;
            background: white;
          }
          h1, h2, h3, p, ul {
            margin: 0;
          }
          ul {
            padding-left: 18px;
          }
        </style>
      </head>
      <body>
        <div class="page">
          <section class="hero">
            <p class="eyebrow">${escapeHtml(companyName || branding.companyName || 'Company Intelligence')}</p>
            <h1 style="font-size:42px;line-height:1.05;">${escapeHtml(report.title)}</h1>
            <p style="margin-top:16px;font-size:16px;line-height:1.7;max-width:760px;color:rgba(255,255,255,0.88);">
              ${escapeHtml(report.companyProfile?.headline || report.assistantBrief || '')}
            </p>
            ${
  shareUrl
    ? `<p style="margin-top:16px;font-size:13px;color:rgba(255,255,255,0.75);">Share link: ${escapeHtml(
      shareUrl
    )}</p>`
    : ''
}
          </section>

          <section class="section">
            <div class="grid">${renderMetricCards(report.metrics || {})}</div>
          </section>

          <section class="section">
            <p class="eyebrow" style="color:${primaryColor};">Company Overview</p>
            <h2 style="font-size:28px;line-height:1.2;">${escapeHtml(
    report.companyProfile?.headline || 'Operational snapshot'
  )}</h2>
            <p style="margin-top:16px;font-size:15px;line-height:1.8;color:#334155;">
              Strongest source: ${escapeHtml(report.companyProfile?.strongestSource || 'Unknown')} |
              Busiest stage: ${escapeHtml(report.companyProfile?.busiestStage || 'Unknown')} |
              Top branch: ${escapeHtml(report.companyProfile?.topBranch || 'Unassigned')}
            </p>
          </section>

          <section class="section">
            <p class="eyebrow" style="color:${primaryColor};">Key Insights</p>
            <ul>${renderList(report.insights || [])}</ul>
          </section>

          <section class="section">
            <p class="eyebrow" style="color:${primaryColor};">Operational Gaps</p>
            <ul>${renderList(report.operationalGaps || [])}</ul>
          </section>

          <section class="section">
            <p class="eyebrow" style="color:${primaryColor};">Recommendations</p>
            <ul>${renderList(report.recommendations || [])}</ul>
          </section>
        </div>
      </body>
    </html>
  `;
};

const generatePdfKitBuffer = (report, companyName, shareUrl) =>
  new Promise((resolve, reject) => {
    const doc = new PDFDocument({ margin: 42, size: 'A4' });
    const chunks = [];

    doc.on('data', (chunk) => chunks.push(chunk));
    doc.on('end', () => resolve(Buffer.concat(chunks)));
    doc.on('error', reject);

    doc.fontSize(11).fillColor('#0f766e').text(companyName || 'Company Intelligence');
    doc.moveDown(0.4);
    doc.fontSize(24).fillColor('#0f172a').text(report.title || 'Company Intelligence Report');
    doc.moveDown(0.8);
    doc.fontSize(11).fillColor('#475569').text(report.companyProfile?.headline || report.assistantBrief || '');

    if (shareUrl) {
      doc.moveDown(0.5);
      doc.fillColor('#0f172a').text(`Share link: ${shareUrl}`);
    }

    doc.moveDown(1);
    doc.fontSize(16).fillColor('#0f172a').text('Key Metrics');
    doc.moveDown(0.4);
    [
      ['Records', report.metrics?.totalRecords || 0],
      ['Conversion Rate', `${report.metrics?.conversionRate || 0}%`],
      ['Revenue', `${report.metrics?.currency || 'USD'} ${(
        report.metrics?.totalRevenue || 0
      ).toLocaleString()}`],
      ['Completeness', `${report.metrics?.completenessRate || 0}%`],
    ].forEach(([label, value]) => {
      doc.fontSize(11).fillColor('#334155').text(`${label}: ${value}`);
    });

    const renderSection = (title, items = []) => {
      doc.moveDown(1);
      doc.fontSize(16).fillColor('#0f172a').text(title);
      doc.moveDown(0.35);

      if (!items.length) {
        doc.fontSize(11).fillColor('#64748b').text('No entries available.');
        return;
      }

      items.forEach((item) => {
        doc.fontSize(12).fillColor('#0f172a').text(`• ${item.title}`);
        doc.fontSize(11).fillColor('#475569').text(item.description, { indent: 12 });
        doc.moveDown(0.25);
      });
    };

    renderSection('Key Insights', report.insights || []);
    renderSection('Operational Gaps', report.operationalGaps || []);
    renderSection('Recommendations', report.recommendations || []);

    doc.end();
  });

exports.generateReportPdfBuffer = async ({
  report,
  companyName,
  frontendBaseUrl,
}) => {
  const shareUrl =
    report.shareEnabled && report.shareToken
      ? `${String(frontendBaseUrl || '').replace(/\/$/, '')}/intelligence/share/${report.shareToken}`
      : '';

  if (!puppeteer) {
    return generatePdfKitBuffer(report, companyName, shareUrl);
  }

  try {
    const browser = await puppeteer.launch({
      headless: 'new',
      args: ['--no-sandbox', '--disable-setuid-sandbox'],
      executablePath: process.env.PUPPETEER_EXECUTABLE_PATH || undefined,
    });

    const page = await browser.newPage();
    await page.setContent(exports.renderReportHtml({ report, companyName, shareUrl }), {
      waitUntil: 'networkidle0',
    });

    const buffer = await page.pdf({
      format: 'A4',
      printBackground: true,
      margin: { top: '16px', right: '16px', bottom: '16px', left: '16px' },
    });

    await browser.close();
    return buffer;
  } catch (error) {
    return generatePdfKitBuffer(report, companyName, shareUrl);
  }
};
