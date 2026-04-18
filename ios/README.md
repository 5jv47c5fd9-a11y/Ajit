# Outsight AI — iOS (SwiftUI)

SwiftUI client for Outsight AI. Targets iOS 17+.

## Structure

- `OutsightAIApp.swift` — app entry
- `RootView.swift` — tab shell (Search / Watchlist / Alerts / Compare)
- `SearchView.swift` — primary intelligence search + executive mode toggle
- `IntelligenceDetail.swift` — dashboard rendering the full payload
- `WatchlistView.swift` / `AlertsView.swift` / `CompareView.swift`
- `OutsightAPI.swift` — backend client (uses `OUTSIGHT_API` env or localhost:4000)
- `Models.swift` — typed payload models
- `AppSession.swift` — observable app state + push token + session

Create a new iOS app target in Xcode and drag these sources in, or generate an
Xcode project with `xcodegen`. The backend URL can be overridden via the
`OUTSIGHT_API` env variable injected at runtime.

Push notifications use APNs with the device token forwarded to
`/alerts/subscribe` on the backend.
