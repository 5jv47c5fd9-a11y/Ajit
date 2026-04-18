import { Router } from 'express';
import { requireAuth, requireTier } from '../middleware/auth.js';
import { alertEngine } from '../services/alertEngine.js';

export const alertsRouter = Router();

alertsRouter.use(requireAuth, requireTier('pro'));

alertsRouter.get('/', (req, res) => {
  res.json({ alerts: alertEngine.list(req.user.id), kinds: alertEngine.kinds() });
});

alertsRouter.post('/subscribe', (req, res) => {
  const { email, pushToken } = req.body ?? {};
  alertEngine.subscribe(req.user.id, { email, pushToken });
  res.json({ ok: true });
});

alertsRouter.post('/test', (req, res) => {
  const { kind = 'vendor_opportunity_signal', company = 'Acme' } = req.body ?? {};
  const alert = alertEngine.fire(req.user.id, kind, { company, message: `Test alert for ${company}` });
  res.json({ alert });
});
