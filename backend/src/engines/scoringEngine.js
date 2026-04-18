/**
 * Deterministic heuristic scoring engine that produces stable, explainable
 * numeric scores from signal + news inputs. When OpenAI is available the LLM
 * may override these values; otherwise the engine is the source of truth.
 */
const clamp = (n) => Math.max(0, Math.min(100, Math.round(n)));

export function scoreAll({ company, signals, news }) {
  const seed = hash(company);
  const newsWeight = (news?.items?.length || 0) / 25;
  const techDepth = (signals?.enrichment?.stack?.length || 0) / 20;
  const techSignals = news?.technology_signals?.length || 0;
  const outsourcingSignals = news?.outsourcing_signals?.length || 0;
  const riskSignals = news?.risks?.length || 0;

  const automationReadiness = clamp(
    45 + seed * 20 + techDepth * 25 + techSignals * 3 + newsWeight * 5,
  );
  const aiAdoption = clamp(
    40 + seed * 25 + techSignals * 4 + techDepth * 30 - riskSignals * 2,
  );
  const outsourcingExpansion = clamp(
    35 + outsourcingSignals * 6 + seed * 15 + newsWeight * 10,
  );
  const vendorEntry = clamp(
    30 + outsourcingSignals * 5 + (100 - riskSignals * 3) * 0.15 + seed * 20,
  );
  const vendorDisplacement = clamp(
    25 + riskSignals * 4 + techSignals * 2 + seed * 10,
  );
  const dealProbability = clamp(
    (vendorEntry * 0.5 + outsourcingExpansion * 0.3 + automationReadiness * 0.2) *
      (0.8 + newsWeight * 0.3),
  );
  const benchmark = clamp(
    (automationReadiness + aiAdoption + outsourcingExpansion) / 3,
  );

  return {
    automation_readiness_score: automationReadiness,
    ai_adoption_probability: aiAdoption,
    outsourcing_expansion_likelihood: outsourcingExpansion,
    vendor_win_probability: vendorEntry,
    vendor_displacement_risk: vendorDisplacement,
    deal_probability_prediction: dealProbability,
    industry_benchmark_score: benchmark,
    explain: {
      automationReadiness: 'Tech stack depth + AI/automation news volume',
      aiAdoption: 'AI signal frequency + infra indicators − risk flags',
      outsourcingExpansion: 'Outsourcing-keyword news density + baseline',
      vendorEntry: 'Outsourcing signals − risk friction',
      vendorDisplacement: 'Risk / automation replacement signals',
      dealProbability: 'Weighted composite of vendor-entry, expansion, readiness',
      benchmark: 'Mean of readiness, adoption, expansion',
    },
  };
}

function hash(s) {
  let h = 0;
  for (const c of s) h = (h * 31 + c.charCodeAt(0)) | 0;
  return Math.abs(Math.sin(h)) ; // 0..1 stable
}
