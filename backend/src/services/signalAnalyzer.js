import { fetchEnrichment } from './enrichmentService.js';

/**
 * Aggregates signals from all registered sources.  Sources are pluggable and
 * can be extended without refactoring the pipeline — simply push a new provider
 * function to `SIGNAL_SOURCES`.
 */
const SIGNAL_SOURCES = [
  fetchEnrichment,
  // placeholder hooks, ready to plug in real providers
  async () => ({ source: 'linkedin', data: { hiringVelocity: null } }),
  async () => ({ source: 'jobs', data: { postings: [] } }),
  async () => ({ source: 'patents', data: { filings: [] } }),
  async () => ({ source: 'sec', data: { filings: [] } }),
  async () => ({ source: 'press', data: { releases: [] } }),
  async () => ({ source: 'earnings', data: { transcripts: [] } }),
];

export async function collectSignals(company) {
  const results = await Promise.allSettled(SIGNAL_SOURCES.map((fn) => fn(company)));
  const signals = { company };
  for (const r of results) {
    if (r.status === 'fulfilled' && r.value) {
      signals[r.value.source] = r.value.data;
    }
  }
  return signals;
}
