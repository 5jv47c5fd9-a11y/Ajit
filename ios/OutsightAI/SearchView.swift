import SwiftUI

struct SearchView: View {
    @State private var company: String = ""
    @State private var executive: Bool = false
    @State private var loading = false
    @State private var payload: IntelligencePayload?
    @State private var error: String?
    @EnvironmentObject var session: AppSession

    var body: some View {
        ScrollView {
            VStack(alignment: .leading, spacing: 16) {
                Text("Outsight AI")
                    .font(.largeTitle).bold()
                Text("Executive enterprise intelligence")
                    .foregroundStyle(.secondary)

                HStack {
                    TextField("Company name", text: $company)
                        .textFieldStyle(.roundedBorder)
                        .autocorrectionDisabled()
                    Button(loading ? "…" : "Analyze") {
                        Task { await run() }
                    }
                    .buttonStyle(.borderedProminent)
                    .disabled(company.isEmpty || loading)
                }

                Toggle("Executive Mode", isOn: $executive)

                if let error { Text(error).foregroundStyle(.red) }

                if let payload {
                    IntelligenceDetail(company: company, data: payload)
                }
            }
            .padding()
        }
        .navigationTitle("Search")
    }

    private func run() async {
        loading = true
        error = nil
        defer { loading = false }
        do {
            payload = try await session.api.intelligence(company: company, executive: executive)
        } catch {
            self.error = error.localizedDescription
        }
    }
}
