import SwiftUI

struct RootView: View {
    var body: some View {
        TabView {
            NavigationStack { SearchView() }
                .tabItem { Label("Search", systemImage: "magnifyingglass") }
            NavigationStack { WatchlistView() }
                .tabItem { Label("Watchlist", systemImage: "bookmark") }
            NavigationStack { AlertsView() }
                .tabItem { Label("Alerts", systemImage: "bell") }
            NavigationStack { CompareView() }
                .tabItem { Label("Compare", systemImage: "chart.bar.doc.horizontal") }
        }
        .tint(Color(red: 0.31, green: 0.55, blue: 1.0))
    }
}
