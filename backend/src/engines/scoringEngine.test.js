import { test } from 'node:test';
import assert from 'node:assert';
import { scoreAll } from './scoringEngine.js';

test('scoreAll returns scores between 0 and 100', () => {
  const result = scoreAll({
    company: 'Acme',
    signals: { enrichment: { stack: ['aws', 'snowflake'] } },
    news: {
      items: Array.from({ length: 10 }).map(() => ({})),
      technology_signals: [{}, {}, {}],
      outsourcing_signals: [{}, {}],
      opportunities: [{}],
      risks: [{}],
    },
  });

  for (const key of [
    'automation_readiness_score',
    'ai_adoption_probability',
    'outsourcing_expansion_likelihood',
    'vendor_win_probability',
    'vendor_displacement_risk',
    'deal_probability_prediction',
    'industry_benchmark_score',
  ]) {
    assert.ok(result[key] >= 0 && result[key] <= 100, `${key} in range`);
  }
});

test('scoreAll is deterministic for same inputs', () => {
  const inputs = { company: 'X', signals: {}, news: { items: [] } };
  const a = scoreAll(inputs);
  const b = scoreAll(inputs);
  assert.deepEqual(a, b);
});
