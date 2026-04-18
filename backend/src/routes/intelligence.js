import { Router } from 'express';
import { buildIntelligence } from '../engines/intelligencePipeline.js';
import { requireAuth } from '../middleware/auth.js';
import { recordSearch, canSearch } from '../services/quotaService.js';

export const intelligenceRouter = Router();

intelligenceRouter.post('/', requireAuth, async (req, res, next) => {
  try {
    const { company, executive } = req.body ?? {};
    if (!company || typeof company !== 'string') {
      return res.status(400).json({ error: 'company_required' });
    }
    if (!canSearch(req.user)) {
      return res.status(402).json({ error: 'quota_exceeded', tier: req.user.tier });
    }
    const data = await buildIntelligence(company, { executive: !!executive });
    recordSearch(req.user);
    res.json({ company, executive: !!executive, data });
  } catch (err) {
    next(err);
  }
});

intelligenceRouter.get('/:company', requireAuth, async (req, res, next) => {
  try {
    if (!canSearch(req.user)) {
      return res.status(402).json({ error: 'quota_exceeded', tier: req.user.tier });
    }
    const data = await buildIntelligence(req.params.company, {
      executive: req.query.executive === 'true',
    });
    recordSearch(req.user);
    res.json({ company: req.params.company, data });
  } catch (err) {
    next(err);
  }
});
