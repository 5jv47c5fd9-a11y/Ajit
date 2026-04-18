const REGIONS = ['North America', 'LATAM', 'EMEA', 'India', 'Philippines', 'APAC'];
const FUNCTIONS = ['CX', 'Back-office', 'Trust & Safety', 'Content moderation', 'Finance', 'AI training'];

export function buildHeatmap({ scores, signals }) {
  const base = scores.vendor_win_probability;
  const depth = scores.outsourcing_expansion_likelihood;
  const cells = [];
  const vendors = ['Accenture', 'TaskUs', 'Teleperformance', 'Concentrix', 'WNS', 'Genpact'];

  REGIONS.forEach((region, ri) => {
    FUNCTIONS.forEach((fn, fi) => {
      const intensity = Math.max(
        0,
        Math.min(100, Math.round(base * 0.6 + depth * 0.3 + ((ri * 7 + fi * 11) % 30) - 15)),
      );
      const whitespace = intensity < 35;
      cells.push({
        region,
        function: fn,
        intensity,
        white_space: whitespace,
        active_vendors: whitespace ? [] : vendors.slice(0, 1 + ((ri + fi) % 3)),
      });
    });
  });

  return {
    regions: REGIONS,
    functions: FUNCTIONS,
    cells,
    white_space_opportunities: cells.filter((c) => c.white_space),
  };
}
