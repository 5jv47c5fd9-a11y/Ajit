import SwiftUI

struct CompareView: View {
    @State private var companies: String = "Shopify, Acme, Netflix"
    @State private var rows: [ComparisonRow] = []
    @State private var loading = false
    @EnvironmentObject var session: AppSession

    var body: some View {
        VStack(alignment: .leading) {
            HStack {
                TextField("Companies (comma separated)", text: $companies)
                    .textFieldStyle(.roundedBorder)
                Button(loading ? "…" : "Compare") {
                    Task { await run() }
                }
                .buttonStyle(.borderedProminent)
            }
            .padding()

            List(rows) { row in
                VStack(alignment: .leading, spacing: 4) {
                    Text(row.company).bold()
                    HStack {
                        Label("\(row.automation_readiness_score)", systemImage: "bolt")
                        Label("\(row.ai_adoption_probability)", systemImage: "brain")
                        Label("\(row.vendor_win_probability)%", systemImage: "target")
                        Label("\(row.deal_probability_12m)%", systemImage: "calendar")
                    }
                    .font(.footnote).foregroundStyle(.secondary)
                }
            }
        }
        .navigationTitle("Compare")
    }

    struct ComparisonRow: Codable, Identifiable {
        var id: String { company }
        let company: String
        let automation_readiness_score: Int
        let ai_adoption_probability: Int
        let outsourcing_expansion_likelihood: Int
        let vendor_win_probability: Int
        let vendor_displacement_risk: Int
        let deal_probability_12m: Int
    }

    private func run() async {
        loading = true
        defer { loading = false }
        struct Req: Codable { let companies: [String] }
        struct Resp: Codable { let comparison: [ComparisonRow] }
        let list = companies.split(separator: ",").map { String($0.trimmingCharacters(in: .whitespaces)) }
        let body = try? JSONEncoder().encode(Req(companies: list))
        var req = URLRequest(url: session.api.baseURL.appendingPathComponent("/compare"))
        req.httpMethod = "POST"
        req.setValue("application/json", forHTTPHeaderField: "Content-Type")
        req.httpBody = body
        if let (data, _) = try? await URLSession.shared.data(for: req),
           let resp = try? JSONDecoder().decode(Resp.self, from: data) {
            rows = resp.comparison
        }
    }
}
