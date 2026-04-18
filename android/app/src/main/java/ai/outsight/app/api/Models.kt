package ai.outsight.app.api

import kotlinx.serialization.Serializable

@Serializable data class InfluencingFactor(val factor: String, val impact: String, val weight: Int)

@Serializable data class DealPrediction(
    val probability_3_months: Int,
    val probability_6_months: Int,
    val probability_12_months: Int,
    val influencing_factors: List<InfluencingFactor>
)

@Serializable data class Competitors(val direct: List<String>, val indirect: List<String>)

@Serializable data class ForecastItem(
    val function: String,
    val probability_6m: Int,
    val probability_12m: Int,
    val probability_24m: Int,
    val direction: String
)

@Serializable data class HeatmapCell(
    val region: String,
    val function: String,
    val intensity: Int,
    val white_space: Boolean,
    val active_vendors: List<String>
)

@Serializable data class Heatmap(
    val regions: List<String>,
    val functions: List<String>,
    val cells: List<HeatmapCell>,
    val white_space_opportunities: List<HeatmapCell>
)

@Serializable data class RecommendedStrategy(
    val if_already_vendor: String,
    val if_not_currently_vendor: String
)

@Serializable data class ExecutiveMode(
    val opportunity_indicators: List<String>,
    val threat_indicators: List<String>,
    val vendor_win_probability_score: Int,
    val automation_disruption_probability: Int,
    val outsourcing_expansion_likelihood: Int,
    val predicted_deal_timing_window: String,
    val top_5_strategic_actions: List<String>
)

@Serializable data class IntelligencePayload(
    val company_summary: String,
    val competitors: Competitors,
    val outsourcing_partners: List<String>,
    val vendor_opportunities: List<String>,
    val vendor_threats: List<String>,
    val automation_readiness_score: Int,
    val ai_adoption_probability: Int,
    val vendor_win_probability: Int,
    val outsourcing_expansion_likelihood: Int,
    val vendor_displacement_risk: Int,
    val deal_probability_prediction: DealPrediction,
    val strategic_horizon: String,
    val outsourcing_signals: List<String>,
    val automation_risk_signals: List<String>,
    val cost_optimization_signals: List<String>,
    val technology_stack_indicators: List<String>,
    val hiring_signals: List<String>,
    val geographic_strategy_signals: List<String>,
    val vendor_penetration_heatmap: Heatmap,
    val predictive_outsourcing_forecast: List<ForecastItem>,
    val recommended_vendor_strategy: RecommendedStrategy,
    val executive_summary: String,
    val digital_transformation_indicators: List<String>,
    val cx_outsourcing_maturity: String,
    val vendor_replacement_risk_indicators: List<String>,
    val executive_mode: ExecutiveMode? = null
)

@Serializable data class IntelligenceResponse(val company: String, val data: IntelligencePayload)

@Serializable data class WatchlistItem(val id: String, val company: String, val addedAt: String)

@Serializable data class AlertItem(
    val id: String,
    val kind: String,
    val company: String? = null,
    val message: String,
    val severity: String,
    val createdAt: String
)
