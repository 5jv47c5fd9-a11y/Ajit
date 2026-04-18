import { logger } from '../lib/logger.js';

/**
 * CRM connector scaffolding. Each provider exposes a uniform interface:
 *   push(record: CrmIntelligencePayload): Promise<{ ok: boolean, id?: string }>
 */

const providers = {
  salesforce: {
    ready: () => !!process.env.SALESFORCE_CLIENT_ID && !!process.env.SALESFORCE_CLIENT_SECRET,
    async push(record) {
      logger.info('salesforce_push', { account: record.company });
      return { ok: true, id: `sf-${Date.now()}` };
    },
  },
  hubspot: {
    ready: () => !!process.env.HUBSPOT_API_KEY,
    async push(record) {
      logger.info('hubspot_push', { account: record.company });
      return { ok: true, id: `hs-${Date.now()}` };
    },
  },
  zoho: {
    ready: () => !!process.env.ZOHO_REFRESH_TOKEN,
    async push(record) {
      logger.info('zoho_push', { account: record.company });
      return { ok: true, id: `zh-${Date.now()}` };
    },
  },
};

export const crmService = {
  list() {
    return Object.entries(providers).map(([name, p]) => ({ name, ready: p.ready() }));
  },
  async push(providerName, record) {
    const p = providers[providerName];
    if (!p) throw new Error(`unknown_provider:${providerName}`);
    return p.push(record);
  },
};
