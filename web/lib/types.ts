export interface DealPrediction {
  probability_3_months: number;
  probability_6_months: number;
  probability_12_months: number;
  influencing_factors: { factor: string; impact: string; weight: number }[];
}

export interface HeatmapCell {
  region: string;
  function: string;
  intensity: number;
  white_space: boolean;
  active_vendors: string[];
}

export interface ForecastItem {
  function: string;
  probability_6m: number;
  probability_12m: number;
  probability_24m: number;
  direction: string;
}

export interface IntelligencePayload {
  company_summary: string;
  competitors: { direct: string[]; indirect: string[] };
  outsourcing_partners: string[];
  vendor_opportunities: string[];
  vendor_threats: string[];
  automation_readiness_score: number;
  ai_adoption_probability: number;
  vendor_win_probability: number;
  outsourcing_expansion_likelihood: number;
  vendor_displacement_risk: number;
  deal_probability_prediction: DealPrediction;
  strategic_horizon: string;
  latest_news: any;
  outsourcing_signals: string[];
  automation_risk_signals: string[];
  cost_optimization_signals: string[];
  technology_stack_indicators: string[];
  hiring_signals: string[];
  geographic_strategy_signals: string[];
  vendor_penetration_heatmap: { regions: string[]; functions: string[]; cells: HeatmapCell[]; white_space_opportunities: HeatmapCell[] };
  industry_benchmark_score: any;
  predictive_outsourcing_forecast: ForecastItem[];
  recommended_vendor_strategy: { if_already_vendor: string; if_not_currently_vendor: string };
  executive_summary: string;
  digital_transformation_indicators: string[];
  cx_outsourcing_maturity: string;
  vendor_replacement_risk_indicators: string[];
  executive_mode?: {
    opportunity_indicators: string[];
    threat_indicators: string[];
    vendor_win_probability_score: number;
    automation_disruption_probability: number;
    outsourcing_expansion_likelihood: number;
    predicted_deal_timing_window: string;
    top_5_strategic_actions: string[];
  };
}
