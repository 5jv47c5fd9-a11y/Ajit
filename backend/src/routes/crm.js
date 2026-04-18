import { Router } from 'express';
import { requireAuth, requireTier } from '../middleware/auth.js';
import { crmService } from '../services/crmService.js';
import { buildIntelligence } from '../engines/intelligencePipeline.js';

export const crmRouter = Router();

crmRouter.use(requireAuth, requireTier('enterprise'));

crmRouter.get('/providers', (_req, res) => res.json({ providers: crmService.list() }));

crmRouter.post('/:provider/push', async (req, res, next) => {
  try {
    const { company, include = ['summary', 'scores', 'deal'] } = req.body ?? {};
    if (!company) return res.status(400).json({ error: 'company_required' });
    const data = await buildIntelligence(company);
    const payload = {
      company,
      summary: include.includes('summary') ? data.executive_summary : undefined,
      scores: include.includes('scores')
        ? {
            automation_readiness: data.automation_readiness_score,
            ai_adoption: data.ai_adoption_probability,
            vendor_win: data.vendor_win_probability,
            outsourcing: data.outsourcing_expansion_likelihood,
            displacement: data.vendor_displacement_risk,
          }
        : undefined,
      deal: include.includes('deal') ? data.deal_probability_prediction : undefined,
    };
    const result = await crmService.push(req.params.provider, payload);
    res.json(result);
  } catch (err) {
    next(err);
  }
});
