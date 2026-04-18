import SwiftUI

struct IntelligenceDetail: View {
    let company: String
    let data: IntelligencePayload
    @EnvironmentObject var session: AppSession

    var body: some View {
        VStack(alignment: .leading, spacing: 16) {
            if let mode = data.executive_mode {
                ExecutiveModeCard(mode: mode)
            }

            Card("Summary") { Text(data.company_summary) }

            HStack(spacing: 12) {
                ScoreTile(label: "Automation", value: data.automation_readiness_score)
                ScoreTile(label: "AI Adoption", value: data.ai_adoption_probability)
            }
            HStack(spacing: 12) {
                ScoreTile(label: "Vendor Win", value: data.vendor_win_probability)
                ScoreTile(label: "Displacement", value: data.vendor_displacement_risk)
            }

            Card("Deal Probability") {
                HStack {
                    DealTile(label: "3m", value: data.deal_probability_prediction.probability_3_months)
                    DealTile(label: "6m", value: data.deal_probability_prediction.probability_6_months)
                    DealTile(label: "12m", value: data.deal_probability_prediction.probability_12_months)
                }
            }

            Card("Strategic Horizon") { Text(data.strategic_horizon) }
            Card("Executive Summary") { Text(data.executive_summary) }

            SignalList(title: "Vendor Opportunities", items: data.vendor_opportunities, tone: .green)
            SignalList(title: "Vendor Threats", items: data.vendor_threats, tone: .red)
            SignalList(title: "Outsourcing Signals", items: data.outsourcing_signals, tone: .blue)
            SignalList(title: "Automation Risk", items: data.automation_risk_signals, tone: .orange)
            SignalList(title: "Hiring Signals", items: data.hiring_signals, tone: .purple)
            SignalList(title: "Tech Stack", items: data.technology_stack_indicators, tone: .teal)

            Card("Predictive Outsourcing Forecast") {
                VStack(alignment: .leading) {
                    ForEach(data.predictive_outsourcing_forecast) { f in
                        HStack {
                            Text(f.function).frame(maxWidth: .infinity, alignment: .leading)
                            Text("6m \(f.probability_6m)%")
                            Text("12m \(f.probability_12m)%")
                            Text("24m \(f.probability_24m)%")
                        }
                        .font(.footnote)
                        Divider()
                    }
                }
            }

            Card("Recommended Strategy") {
                VStack(alignment: .leading, spacing: 8) {
                    Text("If already a vendor:").bold()
                    Text(data.recommended_vendor_strategy.if_already_vendor)
                    Text("If not yet a vendor:").bold()
                    Text(data.recommended_vendor_strategy.if_not_currently_vendor)
                }
            }

            Button("Add to Watchlist") {
                Task { await session.addToWatchlist(company) }
            }
            .buttonStyle(.borderedProminent)
        }
    }
}

struct ExecutiveModeCard: View {
    let mode: ExecutiveMode
    var body: some View {
        Card("Executive Mode") {
            VStack(alignment: .leading, spacing: 10) {
                row("Vendor Win Probability", "\(mode.vendor_win_probability_score)%")
                row("Automation Disruption", "\(mode.automation_disruption_probability)%")
                row("Outsourcing Expansion", "\(mode.outsourcing_expansion_likelihood)%")
                row("Deal Timing", mode.predicted_deal_timing_window)
                Text("Top 5 Strategic Actions").font(.subheadline).bold().padding(.top, 4)
                ForEach(Array(mode.top_5_strategic_actions.enumerated()), id: \.offset) { i, a in
                    Text("\(i + 1). \(a)").font(.footnote)
                }
            }
        }
    }

    private func row(_ l: String, _ v: String) -> some View {
        HStack {
            Text(l).foregroundStyle(.secondary)
            Spacer()
            Text(v).bold()
        }
        .font(.footnote)
    }
}

struct Card<Content: View>: View {
    let title: String
    @ViewBuilder let content: () -> Content
    init(_ title: String, @ViewBuilder _ content: @escaping () -> Content) {
        self.title = title; self.content = content
    }
    var body: some View {
        VStack(alignment: .leading, spacing: 8) {
            Text(title).font(.subheadline).foregroundStyle(.secondary).textCase(.uppercase)
            content()
        }
        .padding()
        .background(RoundedRectangle(cornerRadius: 12).fill(Color(.secondarySystemBackground)))
    }
}

struct ScoreTile: View {
    let label: String
    let value: Int
    var body: some View {
        VStack(alignment: .leading) {
            Text(label).font(.caption).foregroundStyle(.secondary)
            Text("\(value)").font(.title).bold()
            ProgressView(value: Double(value) / 100)
        }
        .padding()
        .frame(maxWidth: .infinity, alignment: .leading)
        .background(RoundedRectangle(cornerRadius: 12).fill(Color(.secondarySystemBackground)))
    }
}

struct DealTile: View {
    let label: String
    let value: Int
    var body: some View {
        VStack {
            Text(label).font(.caption).foregroundStyle(.secondary)
            Text("\(value)%").font(.title3).bold()
        }
        .frame(maxWidth: .infinity)
        .padding(.vertical, 8)
    }
}

struct SignalList: View {
    let title: String
    let items: [String]
    let tone: Color
    var body: some View {
        Card(title) {
            VStack(alignment: .leading, spacing: 6) {
                ForEach(items, id: \.self) { s in
                    HStack(alignment: .top, spacing: 8) {
                        Circle().fill(tone).frame(width: 6, height: 6).padding(.top, 6)
                        Text(s).font(.footnote)
                    }
                }
            }
        }
    }
}
