import { Router } from 'express';
import { requireAuth, requireTier } from '../middleware/auth.js';
import { buildIntelligence } from '../engines/intelligencePipeline.js';
import { streamPdfReport } from '../services/exportService.js';

export const exportRouter = Router();

exportRouter.use(requireAuth, requireTier('enterprise'));

exportRouter.get('/executive/:company', async (req, res, next) => {
  try {
    const data = await buildIntelligence(req.params.company, { executive: true });
    streamPdfReport(res, { title: 'Executive Briefing', company: req.params.company, data });
  } catch (err) {
    next(err);
  }
});

exportRouter.get('/strategy/:company', async (req, res, next) => {
  try {
    const data = await buildIntelligence(req.params.company);
    streamPdfReport(res, { title: 'Strategy Snapshot', company: req.params.company, data });
  } catch (err) {
    next(err);
  }
});

exportRouter.get('/forecast/:company', async (req, res, next) => {
  try {
    const data = await buildIntelligence(req.params.company);
    streamPdfReport(res, { title: 'Forecast Outlook', company: req.params.company, data });
  } catch (err) {
    next(err);
  }
});

exportRouter.post('/comparison', async (req, res, next) => {
  try {
    const { companies = [] } = req.body ?? {};
    const reports = await Promise.all(companies.slice(0, 6).map((c) => buildIntelligence(c)));
    const combined = {
      executive_summary: `Comparison report for: ${companies.join(', ')}`,
      vendor_opportunities: reports.flatMap((r) => r.vendor_opportunities || []),
      vendor_threats: reports.flatMap((r) => r.vendor_threats || []),
      automation_readiness_score: Math.round(
        reports.reduce((s, r) => s + r.automation_readiness_score, 0) / reports.length,
      ),
      ai_adoption_probability: Math.round(
        reports.reduce((s, r) => s + r.ai_adoption_probability, 0) / reports.length,
      ),
      vendor_win_probability: Math.round(
        reports.reduce((s, r) => s + r.vendor_win_probability, 0) / reports.length,
      ),
      outsourcing_expansion_likelihood: Math.round(
        reports.reduce((s, r) => s + r.outsourcing_expansion_likelihood, 0) / reports.length,
      ),
      vendor_displacement_risk: Math.round(
        reports.reduce((s, r) => s + r.vendor_displacement_risk, 0) / reports.length,
      ),
      deal_probability_prediction: reports[0].deal_probability_prediction,
      recommended_vendor_strategy: reports[0].recommended_vendor_strategy,
    };
    streamPdfReport(res, {
      title: 'Multi-Company Comparison',
      company: companies.join(' vs '),
      data: combined,
    });
  } catch (err) {
    next(err);
  }
});
