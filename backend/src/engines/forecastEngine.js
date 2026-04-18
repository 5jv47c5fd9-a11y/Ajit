const FUNCTIONS = [
  'CX',
  'Back-office',
  'Trust & Safety',
  'Content moderation',
  'Finance operations',
  'AI training operations',
];

export function forecastOutsourcing({ scores, signals }) {
  const base = scores.outsourcing_expansion_likelihood;
  const ai = scores.ai_adoption_probability;

  const weights = {
    CX: 1.0,
    'Back-office': 0.9,
    'Trust & Safety': 0.85,
    'Content moderation': 0.8,
    'Finance operations': 0.75,
    'AI training operations': (ai / 100) * 1.15,
  };

  return FUNCTIONS.map((fn) => {
    const w = weights[fn] ?? 1;
    const horizon6 = clamp(Math.round(base * w * 0.6));
    const horizon12 = clamp(Math.round(base * w * 0.85));
    const horizon24 = clamp(Math.round(base * w));
    return {
      function: fn,
      probability_6m: horizon6,
      probability_12m: horizon12,
      probability_24m: horizon24,
      direction: horizon24 > horizon6 ? 'expansion' : 'stable',
    };
  });
}

function clamp(n) {
  return Math.max(0, Math.min(100, n));
}
