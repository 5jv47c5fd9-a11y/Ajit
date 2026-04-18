/**
 * Industry benchmarking engine. Returns percentile ranks for a company's
 * intelligence profile against either a baseline or a supplied peer cohort.
 */
const BASELINE = {
  automation_readiness_score: 52,
  ai_adoption_probability: 48,
  outsourcing_expansion_likelihood: 50,
  vendor_win_probability: 45,
  digital_transformation_velocity: 50,
  vendor_penetration_score: 40,
};

export function benchmark({ scores, peers = [] }) {
  const cohort = peers.length
    ? peers
    : Object.entries(BASELINE).map(([k, v]) => ({ name: 'industry_avg', [k]: v }));

  const percentile = (metric) => {
    const values = cohort.map((c) => c[metric]).filter((v) => typeof v === 'number');
    if (!values.length) return null;
    const below = values.filter((v) => v < scores[metric]).length;
    return Math.round((below / values.length) * 100);
  };

  return {
    ai_adoption_percentile: percentile('ai_adoption_probability'),
    outsourcing_maturity_percentile: percentile('outsourcing_expansion_likelihood'),
    automation_readiness_percentile: percentile('automation_readiness_score'),
    vendor_penetration_score: scores.vendor_win_probability,
    digital_transformation_velocity: Math.round(
      (scores.automation_readiness_score + scores.ai_adoption_probability) / 2,
    ),
    cohort_size: cohort.length,
  };
}
