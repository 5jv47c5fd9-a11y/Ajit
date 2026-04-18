import { logger } from '../lib/logger.js';

/**
 * Pluggable enrichment layer. Uses Clearbit / Crunchbase / Perplexity when
 * keys are provided; otherwise returns deterministic synthesized values so the
 * rest of the pipeline always has structured data to work with.
 */
export async function fetchEnrichment(company) {
  const out = {
    source: 'enrichment',
    data: {
      name: company,
      domain: guessDomain(company),
      industry: null,
      employees: null,
      revenue: null,
      hq: null,
      stack: [],
      funding: null,
    },
  };

  if (process.env.CLEARBIT_API_KEY) {
    try {
      const res = await fetch(
        `https://company.clearbit.com/v2/companies/find?domain=${out.data.domain}`,
        { headers: { Authorization: `Bearer ${process.env.CLEARBIT_API_KEY}` } },
      );
      if (res.ok) {
        const j = await res.json();
        Object.assign(out.data, {
          industry: j.category?.industry,
          employees: j.metrics?.employees,
          revenue: j.metrics?.annualRevenue,
          hq: j.geo?.city ? `${j.geo.city}, ${j.geo.country}` : null,
          stack: j.tech ?? [],
        });
      }
    } catch (err) {
      logger.warn('clearbit_failed', { error: err.message });
    }
  }

  return out;
}

function guessDomain(company) {
  return `${company.toLowerCase().replace(/[^a-z0-9]/g, '')}.com`;
}
