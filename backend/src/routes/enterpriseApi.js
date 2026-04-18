import { Router } from 'express';
import { requireAuth, requireTier } from '../middleware/auth.js';
import { buildIntelligence } from '../engines/intelligencePipeline.js';
import { getTrend } from '../engines/trendEngine.js';

/**
 * Enterprise Intelligence API (`/v1`) — stable REST surface for enterprise
 * customers to integrate Outsight signals into their own systems.
 */
export const apiRouter = Router();

apiRouter.use(requireAuth, requireTier('enterprise'));

apiRouter.get('/company/:company/intelligence', async (req, res, next) => {
  try {
    const data = await buildIntelligence(req.params.company, {
      executive: req.query.executive === 'true',
    });
    res.json({ company: req.params.company, data });
  } catch (err) {
    next(err);
  }
});

apiRouter.get('/company/:company/forecast', async (req, res, next) => {
  try {
    const data = await buildIntelligence(req.params.company);
    res.json({ company: req.params.company, forecast: data.predictive_outsourcing_forecast });
  } catch (err) {
    next(err);
  }
});

apiRouter.get('/company/:company/benchmark', async (req, res, next) => {
  try {
    const data = await buildIntelligence(req.params.company);
    res.json({ company: req.params.company, benchmark: data.industry_benchmark_score });
  } catch (err) {
    next(err);
  }
});

apiRouter.get('/company/:company/deal', async (req, res, next) => {
  try {
    const data = await buildIntelligence(req.params.company);
    res.json({ company: req.params.company, deal: data.deal_probability_prediction });
  } catch (err) {
    next(err);
  }
});

apiRouter.get('/company/:company/heatmap', async (req, res, next) => {
  try {
    const data = await buildIntelligence(req.params.company);
    res.json({ company: req.params.company, heatmap: data.vendor_penetration_heatmap });
  } catch (err) {
    next(err);
  }
});

apiRouter.get('/company/:company/trend', (req, res) => {
  res.json({ company: req.params.company, trend: getTrend(req.params.company) });
});
