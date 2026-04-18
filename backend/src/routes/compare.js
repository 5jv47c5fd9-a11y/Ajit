import { Router } from 'express';
import { requireAuth, requireTier } from '../middleware/auth.js';
import { buildIntelligence } from '../engines/intelligencePipeline.js';

export const compareRouter = Router();

compareRouter.post('/', requireAuth, requireTier('pro'), async (req, res, next) => {
  try {
    const { companies = [] } = req.body ?? {};
    if (!Array.isArray(companies) || companies.length < 2) {
      return res.status(400).json({ error: 'at_least_two_companies_required' });
    }
    const reports = await Promise.all(companies.slice(0, 6).map((c) => buildIntelligence(c)));
    const rows = companies.map((c, i) => ({
      company: c,
      automation_readiness_score: reports[i].automation_readiness_score,
      ai_adoption_probability: reports[i].ai_adoption_probability,
      outsourcing_expansion_likelihood: reports[i].outsourcing_expansion_likelihood,
      vendor_win_probability: reports[i].vendor_win_probability,
      vendor_displacement_risk: reports[i].vendor_displacement_risk,
      strategic_horizon: reports[i].strategic_horizon,
      deal_probability_12m: reports[i].deal_probability_prediction.probability_12_months,
      industry_benchmark: reports[i].industry_benchmark_score,
    }));
    res.json({ comparison: rows });
  } catch (err) {
    next(err);
  }
});
