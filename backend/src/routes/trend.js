import { Router } from 'express';
import { requireAuth, requireTier } from '../middleware/auth.js';
import { getTrend } from '../engines/trendEngine.js';

export const trendRouter = Router();

trendRouter.get('/:company', requireAuth, requireTier('pro'), (req, res) => {
  res.json({ company: req.params.company, trend: getTrend(req.params.company) });
});
