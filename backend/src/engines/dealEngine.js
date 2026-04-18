/**
 * Deal probability prediction engine. Produces probabilities for 3 / 6 / 12
 * month windows plus a list of influencing factors.
 */
export function predictDeal({ scores, news }) {
  const base = scores.deal_probability_prediction / 100;
  const acceleration = Math.min(
    1,
    (news?.outsourcing_signals?.length ?? 0) * 0.05 +
      (news?.opportunities?.length ?? 0) * 0.03,
  );

  const p3 = clamp(base * 0.35 + acceleration * 0.4);
  const p6 = clamp(base * 0.65 + acceleration * 0.3);
  const p12 = clamp(base + acceleration * 0.2);

  const factors = [
    { factor: 'Outsourcing expansion signals', impact: '+', weight: scores.outsourcing_expansion_likelihood },
    { factor: 'AI adoption trajectory', impact: '+', weight: scores.ai_adoption_probability },
    { factor: 'Vendor displacement risk', impact: '−', weight: scores.vendor_displacement_risk },
    { factor: 'Automation readiness', impact: '+', weight: scores.automation_readiness_score },
    { factor: 'News opportunity density (72h)', impact: '+', weight: Math.round(acceleration * 100) },
  ];

  return {
    probability_3_months: Math.round(p3 * 100),
    probability_6_months: Math.round(p6 * 100),
    probability_12_months: Math.round(p12 * 100),
    influencing_factors: factors,
  };
}

function clamp(n) {
  return Math.max(0, Math.min(1, n));
}
