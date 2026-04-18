import { Router } from 'express';
import { signToken } from '../middleware/auth.js';

export const authRouter = Router();

/**
 * Demo auth endpoint. Production architecture is ready for SSO / OAuth / RBAC:
 * swap this handler for an identity provider integration (Auth0, Okta, AzureAD,
 * Google Workspace, custom OAuth) without changing downstream middleware.
 */
authRouter.post('/login', (req, res) => {
  const { email, tier = 'pro', org = 'demo-org', role = 'member' } = req.body ?? {};
  if (!email) return res.status(400).json({ error: 'email_required' });
  const token = signToken({ id: `u_${Buffer.from(email).toString('base64url')}`, email, tier, org, role });
  res.json({ token, user: { email, tier, org, role } });
});

authRouter.get('/me', (req, res) => {
  const header = req.headers.authorization || '';
  if (!header) return res.status(401).json({ error: 'unauthenticated' });
  res.json({ ok: true });
});
