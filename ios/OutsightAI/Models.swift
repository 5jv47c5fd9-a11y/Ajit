import Foundation

struct DealPrediction: Codable, Hashable {
    let probability_3_months: Int
    let probability_6_months: Int
    let probability_12_months: Int
    let influencing_factors: [InfluencingFactor]
}

struct InfluencingFactor: Codable, Hashable {
    let factor: String
    let impact: String
    let weight: Int
}

struct Competitors: Codable, Hashable {
    let direct: [String]
    let indirect: [String]
}

struct ForecastItem: Codable, Hashable, Identifiable {
    var id: String { function }
    let function: String
    let probability_6m: Int
    let probability_12m: Int
    let probability_24m: Int
    let direction: String
}

struct HeatmapCell: Codable, Hashable {
    let region: String
    let function: String
    let intensity: Int
    let white_space: Bool
    let active_vendors: [String]
}

struct Heatmap: Codable, Hashable {
    let regions: [String]
    let functions: [String]
    let cells: [HeatmapCell]
    let white_space_opportunities: [HeatmapCell]
}

struct RecommendedStrategy: Codable, Hashable {
    let if_already_vendor: String
    let if_not_currently_vendor: String
}

struct ExecutiveMode: Codable, Hashable {
    let opportunity_indicators: [String]
    let threat_indicators: [String]
    let vendor_win_probability_score: Int
    let automation_disruption_probability: Int
    let outsourcing_expansion_likelihood: Int
    let predicted_deal_timing_window: String
    let top_5_strategic_actions: [String]
}

struct IntelligencePayload: Codable, Hashable {
    let company_summary: String
    let competitors: Competitors
    let outsourcing_partners: [String]
    let vendor_opportunities: [String]
    let vendor_threats: [String]
    let automation_readiness_score: Int
    let ai_adoption_probability: Int
    let vendor_win_probability: Int
    let outsourcing_expansion_likelihood: Int
    let vendor_displacement_risk: Int
    let deal_probability_prediction: DealPrediction
    let strategic_horizon: String
    let outsourcing_signals: [String]
    let automation_risk_signals: [String]
    let cost_optimization_signals: [String]
    let technology_stack_indicators: [String]
    let hiring_signals: [String]
    let geographic_strategy_signals: [String]
    let vendor_penetration_heatmap: Heatmap
    let predictive_outsourcing_forecast: [ForecastItem]
    let recommended_vendor_strategy: RecommendedStrategy
    let executive_summary: String
    let digital_transformation_indicators: [String]
    let cx_outsourcing_maturity: String
    let vendor_replacement_risk_indicators: [String]
    let executive_mode: ExecutiveMode?
}

struct IntelligenceResponse: Codable {
    let company: String
    let data: IntelligencePayload
}

struct WatchlistItem: Codable, Hashable, Identifiable {
    let id: String
    let company: String
    let addedAt: String
}

struct AlertItem: Codable, Hashable, Identifiable {
    let id: String
    let kind: String
    let company: String?
    let message: String
    let severity: String
    let createdAt: String
}
