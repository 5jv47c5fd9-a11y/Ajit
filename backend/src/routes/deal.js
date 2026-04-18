import { Router } from 'express';
import { requireAuth, requireTier } from '../middleware/auth.js';
import { buildIntelligence } from '../engines/intelligencePipeline.js';

export const dealRouter = Router();

dealRouter.get('/:company', requireAuth, requireTier('enterprise'), async (req, res, next) => {
  try {
    const data = await buildIntelligence(req.params.company);
    res.json({ company: req.params.company, deal: data.deal_probability_prediction });
  } catch (err) {
    next(err);
  }
});
