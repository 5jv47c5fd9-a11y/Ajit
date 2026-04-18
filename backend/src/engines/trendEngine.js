/**
 * AI-readiness trend tracker. Stores quarterly snapshots and returns movement
 * deltas. Persistence is in-memory here; swap with a durable store (Postgres,
 * DynamoDB, etc.) without changing the contract.
 */
const history = new Map(); // company -> [{ quarter, scores }]

export function recordSnapshot(company, scores) {
  const q = currentQuarter();
  const arr = history.get(company.toLowerCase()) ?? [];
  const existing = arr.find((e) => e.quarter === q);
  if (existing) {
    existing.scores = scores;
  } else {
    arr.push({ quarter: q, scores });
    if (arr.length > 12) arr.shift();
  }
  history.set(company.toLowerCase(), arr);
  return arr;
}

export function getTrend(company) {
  const arr = history.get(company.toLowerCase()) ?? [];
  if (arr.length < 2) return { quarters: arr, movement: null };

  const last = arr[arr.length - 1].scores;
  const prev = arr[arr.length - 2].scores;
  const delta = (k) => (last[k] ?? 0) - (prev[k] ?? 0);

  return {
    quarters: arr,
    movement: {
      automation_readiness_delta: delta('automation_readiness_score'),
      ai_adoption_delta: delta('ai_adoption_probability'),
      outsourcing_expansion_delta: delta('outsourcing_expansion_likelihood'),
      deal_probability_delta: delta('deal_probability_prediction'),
    },
  };
}

function currentQuarter() {
  const d = new Date();
  return `${d.getUTCFullYear()}Q${Math.floor(d.getUTCMonth() / 3) + 1}`;
}
