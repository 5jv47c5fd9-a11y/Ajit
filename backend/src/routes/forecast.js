import { Router } from 'express';
import { requireAuth, requireTier } from '../middleware/auth.js';
import { buildIntelligence } from '../engines/intelligencePipeline.js';

export const forecastRouter = Router();

forecastRouter.get('/:company', requireAuth, requireTier('pro'), async (req, res, next) => {
  try {
    const data = await buildIntelligence(req.params.company);
    res.json({ company: req.params.company, forecast: data.predictive_outsourcing_forecast });
  } catch (err) {
    next(err);
  }
});
