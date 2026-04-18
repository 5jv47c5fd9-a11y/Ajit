import { collectSignals } from '../services/signalAnalyzer.js';
import { fetchLatestNews } from '../services/newsService.js';
import { reasonAboutCompany } from '../services/openaiService.js';
import { scoreAll } from './scoringEngine.js';
import { predictDeal } from './dealEngine.js';
import { forecastOutsourcing } from './forecastEngine.js';
import { benchmark } from './benchmarkEngine.js';
import { buildHeatmap } from './heatmapEngine.js';
import { recordSnapshot } from './trendEngine.js';
import { cache } from '../lib/cache.js';
import { previewDataset } from '../data/previewDataset.js';
import { INTELLIGENCE_SCHEMA } from '../schema/intelligenceSchema.js';

/**
 * The central intelligence pipeline. Assembles every field required by the
 * Outsight AI output schema.  Modular by design — new sources / engines can be
 * plugged into collectSignals + engines without touching the orchestrator.
 */
export async function buildIntelligence(companyRaw, { executive = false } = {}) {
  const company = companyRaw.trim();
  const cacheKey = `intel:${company.toLowerCase()}:${executive ? 'exec' : 'std'}`;
  const cached = cache.get(cacheKey);
  if (cached) return cached;

  const [signals, news] = await Promise.all([
    collectSignals(company),
    fetchLatestNews(company),
  ]);

  const scores = scoreAll({ company, signals, news });
  const deal = predictDeal({ scores, news });
  const forecast = forecastOutsourcing({ scores, signals });
  const bench = benchmark({ scores });
  const heatmap = buildHeatmap({ scores, signals });

  const llm = await reasonAboutCompany({
    company,
    signals,
    newsItems: news?.items,
    schema: INTELLIGENCE_SCHEMA,
  });

  const preview = previewDataset[company.toLowerCase()] || previewDataset.default(company);

  const payload = {
    company_summary: llm?.company_summary || preview.company_summary,
    competitors: {
      direct: llm?.competitors?.direct || preview.competitors.direct,
      indirect: llm?.competitors?.indirect || preview.competitors.indirect,
    },
    outsourcing_partners: llm?.outsourcing_partners || preview.outsourcing_partners,
    vendor_opportunities: llm?.vendor_opportunities || preview.vendor_opportunities,
    vendor_threats: llm?.vendor_threats || preview.vendor_threats,
    automation_readiness_score: scores.automation_readiness_score,
    ai_adoption_probability: scores.ai_adoption_probability,
    vendor_win_probability: scores.vendor_win_probability,
    deal_probability_prediction: deal,
    strategic_horizon: llm?.strategic_horizon || preview.strategic_horizon,
    latest_news: news,
    outsourcing_signals: llm?.outsourcing_signals || preview.outsourcing_signals,
    automation_risk_signals: llm?.automation_risk_signals || preview.automation_risk_signals,
    cost_optimization_signals: llm?.cost_optimization_signals || preview.cost_optimization_signals,
    technology_stack_indicators:
      llm?.technology_stack_indicators || preview.technology_stack_indicators,
    hiring_signals: llm?.hiring_signals || preview.hiring_signals,
    geographic_strategy_signals:
      llm?.geographic_strategy_signals || preview.geographic_strategy_signals,
    vendor_penetration_heatmap: heatmap,
    industry_benchmark_score: bench,
    predictive_outsourcing_forecast: forecast,
    recommended_vendor_strategy:
      llm?.recommended_vendor_strategy || preview.recommended_vendor_strategy,
    executive_summary: llm?.executive_summary || preview.executive_summary,
    digital_transformation_indicators:
      llm?.digital_transformation_indicators || preview.digital_transformation_indicators,
    cx_outsourcing_maturity: llm?.cx_outsourcing_maturity || preview.cx_outsourcing_maturity,
    vendor_replacement_risk_indicators:
      llm?.vendor_replacement_risk_indicators || preview.vendor_replacement_risk_indicators,
    outsourcing_expansion_likelihood: scores.outsourcing_expansion_likelihood,
    vendor_displacement_risk: scores.vendor_displacement_risk,
  };

  if (executive) {
    payload.executive_mode = buildExecutiveMode(payload);
  }

  recordSnapshot(company, scores);

  cache.set(cacheKey, payload, 15 * 60 * 1000);
  return payload;
}

function buildExecutiveMode(p) {
  return {
    opportunity_indicators: p.vendor_opportunities?.slice(0, 5) || [],
    threat_indicators: p.vendor_threats?.slice(0, 5) || [],
    vendor_win_probability_score: p.vendor_win_probability,
    automation_disruption_probability: p.automation_risk_signals?.length
      ? Math.min(95, 40 + p.automation_risk_signals.length * 8)
      : 35,
    outsourcing_expansion_likelihood: p.outsourcing_expansion_likelihood,
    predicted_deal_timing_window:
      p.deal_probability_prediction.probability_6_months > 55
        ? '3–6 months'
        : p.deal_probability_prediction.probability_12_months > 55
          ? '6–12 months'
          : '12–24 months',
    top_5_strategic_actions: [
      'Brief internal pursuit team and assign named account owner',
      'Deploy tailored outsourcing narrative targeting highest-probability function',
      'Initiate executive-to-executive outreach within 14 days',
      'Prepare automation + AI-readiness accelerator proof-of-value',
      'Activate procurement + CX leader multi-threaded engagement plan',
    ],
  };
}
