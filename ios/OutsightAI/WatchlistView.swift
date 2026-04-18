import SwiftUI

struct WatchlistView: View {
    @EnvironmentObject var session: AppSession
    @State private var company = ""

    var body: some View {
        VStack {
            HStack {
                TextField("Add company", text: $company)
                    .textFieldStyle(.roundedBorder)
                Button("Add") {
                    Task {
                        await session.addToWatchlist(company)
                        company = ""
                    }
                }
                .buttonStyle(.borderedProminent)
                .disabled(company.isEmpty)
            }
            .padding()

            List(session.watchlist) { item in
                NavigationLink(item.company) {
                    CompanyPageView(company: item.company)
                }
            }
            .refreshable { await session.refreshWatchlist() }
        }
        .navigationTitle("Watchlist")
        .task { await session.refreshWatchlist() }
    }
}

struct CompanyPageView: View {
    let company: String
    @State private var payload: IntelligencePayload?
    @EnvironmentObject var session: AppSession

    var body: some View {
        ScrollView {
            if let payload {
                IntelligenceDetail(company: company, data: payload).padding()
            } else {
                ProgressView().padding()
            }
        }
        .navigationTitle(company)
        .task {
            payload = try? await session.api.intelligence(company: company)
        }
    }
}
