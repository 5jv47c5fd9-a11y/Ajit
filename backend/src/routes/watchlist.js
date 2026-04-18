import { Router } from 'express';
import { requireAuth, requireTier } from '../middleware/auth.js';
import { watchlistService } from '../services/watchlistService.js';
import { buildIntelligence } from '../engines/intelligencePipeline.js';

export const watchlistRouter = Router();

watchlistRouter.use(requireAuth, requireTier('pro'));

watchlistRouter.get('/', (req, res) => {
  res.json({ watchlist: watchlistService.list(req.user.id) });
});

watchlistRouter.post('/', (req, res) => {
  const { company } = req.body ?? {};
  if (!company) return res.status(400).json({ error: 'company_required' });
  const list = watchlistService.add(req.user.id, company);
  res.json({ watchlist: list });
});

watchlistRouter.delete('/:id', (req, res) => {
  const list = watchlistService.remove(req.user.id, req.params.id);
  res.json({ watchlist: list });
});

watchlistRouter.post('/refresh/:company', async (req, res, next) => {
  try {
    const data = await buildIntelligence(req.params.company);
    watchlistService.updateSnapshot(req.user.id, req.params.company, {
      deal: data.deal_probability_prediction,
      automation: data.automation_readiness_score,
      ai: data.ai_adoption_probability,
      outsourcing: data.outsourcing_expansion_likelihood,
      displacement: data.vendor_displacement_risk,
    });
    res.json({ ok: true });
  } catch (err) {
    next(err);
  }
});
