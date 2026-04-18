# Outsight AI — Android (Kotlin + Jetpack Compose)

Kotlin / Compose client for the Outsight AI backend. Uses Ktor for networking
and Firebase Messaging for push.

## Structure

- `MainActivity.kt` — Compose shell with bottom navigation
- `ui/SearchScreen.kt` — primary intelligence search
- `ui/IntelligenceDetail.kt` — full dashboard rendering
- `ui/WatchlistScreen.kt` / `AlertsScreen.kt` / `CompareScreen.kt` / `CompanyScreen.kt`
- `api/OutsightClient.kt` — backend client (override `baseUrl` for staging/prod)
- `api/Models.kt` — typed payload models
- `push/OutsightMessagingService.kt` — FCM token + alert handling

The Android emulator reaches the local backend at `http://10.0.2.2:4000`.
Override `OutsightClient.baseUrl` at startup to point at a deployed backend.
