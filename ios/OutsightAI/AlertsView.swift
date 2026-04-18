import SwiftUI

struct AlertsView: View {
    @EnvironmentObject var session: AppSession
    @State private var email: String = ""
    @State private var pushToken: String = ""

    var body: some View {
        List {
            Section("Delivery") {
                TextField("Email", text: $email)
                TextField("Push token (APNs)", text: $pushToken)
                Button("Save Subscription") {
                    Task {
                        try? await session.api.subscribeAlerts(
                            email: email.isEmpty ? nil : email,
                            pushToken: pushToken.isEmpty ? nil : pushToken
                        )
                    }
                }
            }
            Section("Recent Alerts") {
                if session.alerts.isEmpty { Text("No alerts yet.").foregroundStyle(.secondary) }
                ForEach(session.alerts) { a in
                    VStack(alignment: .leading) {
                        Text(a.kind.replacingOccurrences(of: "_", with: " ")).bold()
                        Text(a.message).font(.footnote).foregroundStyle(.secondary)
                    }
                }
            }
        }
        .navigationTitle("Alerts")
        .task { await session.refreshAlerts() }
        .refreshable { await session.refreshAlerts() }
    }
}
