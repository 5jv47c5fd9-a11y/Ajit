import { v4 as uuid } from 'uuid';
import { logger } from '../lib/logger.js';

const alertsByUser = new Map();
const subscribersByUser = new Map(); // { email, pushToken }

const ALERT_KINDS = [
  'vendor_opportunity_signal',
  'automation_disruption_signal',
  'competitor_expansion_signal',
  'outsourcing_contract_movement',
  'major_hiring_trend_shift',
  'ai_investment_signal',
  'deal_probability_threshold_increase',
  'vendor_displacement_warning',
];

export const alertEngine = {
  kinds: () => ALERT_KINDS,

  subscribe(userId, channel) {
    subscribersByUser.set(userId, { ...(subscribersByUser.get(userId) || {}), ...channel });
  },

  fire(userId, kind, payload) {
    if (!ALERT_KINDS.includes(kind)) throw new Error(`unknown_alert_kind:${kind}`);
    const alert = {
      id: uuid(),
      kind,
      company: payload?.company || null,
      message: payload?.message || kind.replace(/_/g, ' '),
      severity: payload?.severity || 'info',
      createdAt: new Date().toISOString(),
      payload,
    };
    const arr = alertsByUser.get(userId) ?? [];
    arr.unshift(alert);
    if (arr.length > 500) arr.pop();
    alertsByUser.set(userId, arr);
    dispatch(userId, alert);
    return alert;
  },

  list(userId) {
    return alertsByUser.get(userId) ?? [];
  },

  evaluateSnapshot(userId, company, prev, next) {
    if (!prev || !next) return;
    const dealDelta =
      (next.deal?.probability_12_months ?? 0) - (prev.deal?.probability_12_months ?? 0);
    if (dealDelta >= 10) {
      this.fire(userId, 'deal_probability_threshold_increase', {
        company,
        message: `${company}: 12-month deal probability up ${dealDelta} pts`,
        severity: 'high',
      });
    }
    if ((next.displacement ?? 0) - (prev.displacement ?? 0) >= 8) {
      this.fire(userId, 'vendor_displacement_warning', {
        company,
        message: `${company}: vendor displacement risk rising`,
        severity: 'high',
      });
    }
    if ((next.outsourcing ?? 0) - (prev.outsourcing ?? 0) >= 8) {
      this.fire(userId, 'outsourcing_contract_movement', {
        company,
        message: `${company}: outsourcing expansion momentum increasing`,
        severity: 'medium',
      });
    }
  },
};

function dispatch(userId, alert) {
  const sub = subscribersByUser.get(userId);
  if (!sub) return;
  if (sub.email) logger.info('email_alert', { to: sub.email, kind: alert.kind });
  if (sub.pushToken) logger.info('push_alert', { token: sub.pushToken, kind: alert.kind });
}
