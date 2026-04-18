import { Router } from 'express';
import { requireAuth, requireTier } from '../middleware/auth.js';
import { buildIntelligence } from '../engines/intelligencePipeline.js';
import { benchmark } from '../engines/benchmarkEngine.js';

export const benchmarkRouter = Router();

benchmarkRouter.post('/', requireAuth, requireTier('pro'), async (req, res, next) => {
  try {
    const { company, peers = [] } = req.body ?? {};
    if (!company) return res.status(400).json({ error: 'company_required' });
    const target = await buildIntelligence(company);
    const peerReports = await Promise.all(peers.map((c) => buildIntelligence(c)));
    const peerScores = peerReports.map((r) => ({
      name: r.company_summary?.slice(0, 32) || 'peer',
      automation_readiness_score: r.automation_readiness_score,
      ai_adoption_probability: r.ai_adoption_probability,
      outsourcing_expansion_likelihood: r.outsourcing_expansion_likelihood,
      vendor_win_probability: r.vendor_win_probability,
      digital_transformation_velocity: Math.round(
        (r.automation_readiness_score + r.ai_adoption_probability) / 2,
      ),
      vendor_penetration_score: r.vendor_win_probability,
    }));
    const result = benchmark({ scores: target, peers: peerScores });
    res.json({ company, benchmark: result, peers: peerScores });
  } catch (err) {
    next(err);
  }
});
