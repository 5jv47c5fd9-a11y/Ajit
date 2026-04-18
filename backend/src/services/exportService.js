import PDFDocument from 'pdfkit';

export function streamPdfReport(res, { title, company, data }) {
  const doc = new PDFDocument({ size: 'LETTER', margin: 56 });
  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader('Content-Disposition', `attachment; filename="${safe(company)}-${safe(title)}.pdf"`);
  doc.pipe(res);

  doc.fontSize(22).fillColor('#0b1221').text('Outsight AI', { align: 'left' });
  doc.fontSize(10).fillColor('#64748b').text(new Date().toUTCString());
  doc.moveDown(0.7);
  doc.fontSize(16).fillColor('#0b1221').text(title);
  doc.fontSize(13).fillColor('#1f2937').text(company);
  doc.moveDown();

  section(doc, 'Executive Summary', data.executive_summary);
  scoreRow(doc, data);
  listSection(doc, 'Vendor Opportunities', data.vendor_opportunities);
  listSection(doc, 'Vendor Threats', data.vendor_threats);
  listSection(doc, 'Outsourcing Signals', data.outsourcing_signals);
  listSection(doc, 'Automation Risk Signals', data.automation_risk_signals);
  listSection(doc, 'Hiring Signals', data.hiring_signals);
  listSection(doc, 'Technology Stack', data.technology_stack_indicators);

  if (data.deal_probability_prediction) {
    section(
      doc,
      'Deal Probability',
      `3mo: ${data.deal_probability_prediction.probability_3_months}%   6mo: ${data.deal_probability_prediction.probability_6_months}%   12mo: ${data.deal_probability_prediction.probability_12_months}%`,
    );
  }

  if (data.recommended_vendor_strategy) {
    section(doc, 'Recommended Strategy (current vendor)', data.recommended_vendor_strategy.if_already_vendor);
    section(doc, 'Recommended Strategy (new vendor)', data.recommended_vendor_strategy.if_not_currently_vendor);
  }

  doc.moveDown().fontSize(8).fillColor('#94a3b8').text('Confidential — Outsight AI generated intelligence. For internal strategic use only.');
  doc.end();
}

function section(doc, heading, body) {
  if (!body) return;
  doc.moveDown(0.7);
  doc.fontSize(12).fillColor('#0b1221').text(heading, { underline: true });
  doc.fontSize(10).fillColor('#1f2937').text(body);
}

function listSection(doc, heading, list) {
  if (!list?.length) return;
  doc.moveDown(0.7);
  doc.fontSize(12).fillColor('#0b1221').text(heading, { underline: true });
  doc.fontSize(10).fillColor('#1f2937');
  for (const item of list) doc.text(`• ${typeof item === 'string' ? item : JSON.stringify(item)}`);
}

function scoreRow(doc, data) {
  doc.moveDown(0.7);
  doc.fontSize(12).fillColor('#0b1221').text('Scores', { underline: true });
  doc.fontSize(10).fillColor('#1f2937').text(
    `Automation: ${data.automation_readiness_score}  •  AI Adoption: ${data.ai_adoption_probability}  •  Win Prob: ${data.vendor_win_probability}  •  Outsourcing: ${data.outsourcing_expansion_likelihood}  •  Displacement: ${data.vendor_displacement_risk}`,
  );
}

function safe(s) {
  return String(s || 'report').replace(/[^a-z0-9-_]+/gi, '_').slice(0, 64);
}
