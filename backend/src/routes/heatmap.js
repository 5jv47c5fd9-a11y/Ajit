import { Router } from 'express';
import { requireAuth, requireTier } from '../middleware/auth.js';
import { buildIntelligence } from '../engines/intelligencePipeline.js';

export const heatmapRouter = Router();

heatmapRouter.get('/:company', requireAuth, requireTier('enterprise'), async (req, res, next) => {
  try {
    const data = await buildIntelligence(req.params.company);
    res.json({ company: req.params.company, heatmap: data.vendor_penetration_heatmap });
  } catch (err) {
    next(err);
  }
});
