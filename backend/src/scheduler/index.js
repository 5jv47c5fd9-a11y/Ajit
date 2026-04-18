import cron from 'node-cron';
import { logger } from '../lib/logger.js';
import { watchlistService } from '../services/watchlistService.js';
import { alertEngine } from '../services/alertEngine.js';
import { buildIntelligence } from '../engines/intelligencePipeline.js';

/**
 * Scheduler orchestrates periodic intelligence sweeps for every watchlisted
 * company, fires alert events when signals cross thresholds, and prepares the
 * weekly digest payload. Timezone-agnostic UTC cron expressions.
 */
export function startScheduler() {
  if (process.env.NODE_ENV === 'test') return;

  // Hourly signal sweep
  cron.schedule('7 * * * *', runSignalSweep);
  // Weekly digest: Mondays 12:00 UTC
  cron.schedule('0 12 * * 1', runWeeklyDigest);

  logger.info('scheduler_started');
}

export async function runSignalSweep() {
  const entries = watchlistService.allUsersAndCompanies();
  for (const { userId, company } of entries) {
    try {
      const data = await buildIntelligence(company);
      const prevEntry = (watchlistService.list(userId) || []).find(
        (e) => e.company.toLowerCase() === company.toLowerCase(),
      );
      const prev = prevEntry?.lastSnapshot;
      const next = {
        deal: data.deal_probability_prediction,
        automation: data.automation_readiness_score,
        ai: data.ai_adoption_probability,
        outsourcing: data.outsourcing_expansion_likelihood,
        displacement: data.vendor_displacement_risk,
      };
      alertEngine.evaluateSnapshot(userId, company, prev, next);
      watchlistService.updateSnapshot(userId, company, next);
    } catch (err) {
      logger.warn('sweep_failed', { company, err: err.message });
    }
  }
}

export async function runWeeklyDigest() {
  const entries = watchlistService.allUsersAndCompanies();
  const digests = new Map();
  for (const { userId, company } of entries) {
    try {
      const data = await buildIntelligence(company);
      const arr = digests.get(userId) ?? [];
      arr.push({
        company,
        vendor_win: data.vendor_win_probability,
        deal_12m: data.deal_probability_prediction.probability_12_months,
        displacement: data.vendor_displacement_risk,
        top_opportunity: data.vendor_opportunities?.[0],
        top_threat: data.vendor_threats?.[0],
      });
      digests.set(userId, arr);
    } catch (err) {
      logger.warn('digest_failed', { company, err: err.message });
    }
  }
  for (const [userId, items] of digests.entries()) {
    alertEngine.fire(userId, 'vendor_opportunity_signal', {
      message: 'Weekly Outsight digest ready',
      severity: 'info',
      digest: items,
    });
  }
  logger.info('weekly_digest_sent', { recipients: digests.size });
}
