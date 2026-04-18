import Foundation
import SwiftUI

@MainActor
final class AppSession: ObservableObject {
    @Published var token: String? = nil
    @Published var tier: String = "pro"
    @Published var watchlist: [WatchlistItem] = []
    @Published var alerts: [AlertItem] = []
    @Published var pushToken: String? = nil

    let api = OutsightAPI()

    func refreshWatchlist() async {
        do { self.watchlist = try await api.watchlist() } catch { print(error) }
    }

    func refreshAlerts() async {
        do { self.alerts = try await api.alerts() } catch { print(error) }
    }

    func addToWatchlist(_ company: String) async {
        do {
            self.watchlist = try await api.addWatchlist(company: company)
        } catch { print(error) }
    }
}
