import { Router } from 'express';
import { requireAuth, requireTier } from '../middleware/auth.js';
import { teamService } from '../services/teamService.js';
import { watchlistService } from '../services/watchlistService.js';

export const teamRouter = Router();

teamRouter.use(requireAuth, requireTier('enterprise'));

teamRouter.get('/dashboard', (req, res) => {
  const org = req.user.org;
  const shares = teamService.list(org);
  const assignments = teamService.assignments(org);
  const watchlist = watchlistService.list(req.user.id);
  res.json({ org, shares, assignments, watchlist });
});

teamRouter.post('/share', (req, res) => {
  const { type, ref, assignedTo } = req.body ?? {};
  if (!type || !ref) return res.status(400).json({ error: 'type_and_ref_required' });
  const share = teamService.share(req.user.org, {
    type,
    ref,
    ownerId: req.user.id,
    assignedTo,
  });
  res.json({ share });
});

teamRouter.post('/assign', (req, res) => {
  const { company, userId } = req.body ?? {};
  if (!company || !userId) return res.status(400).json({ error: 'company_and_user_required' });
  const assignments = teamService.assign(req.user.org, company, userId);
  res.json({ assignments });
});
