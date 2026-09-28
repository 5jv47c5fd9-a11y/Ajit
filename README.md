# Outsight AI

Executive-grade enterprise intelligence platform for outsourcing vendors, CX/BPO
providers, consulting teams, automation vendors, and AI service providers.

Outsight AI turns a single company name into a boardroom-ready intelligence
dashboard: competitors, vendors, automation readiness, AI adoption likelihood,
deal probability, vendor penetration heatmap, forecasts, benchmarks, and alerts.

## Monorepo Layout

```
/backend    Node.js intelligence engine (Express) + modular services
/web        Next.js 14 + React dashboard (App Router)
/ios        SwiftUI iOS application
/android    Kotlin + Jetpack Compose application
/shared     Shared JSON schemas and sample preview dataset
/docs       Architecture and API reference
/avatar     Talking photo-real 3D avatar for ajit.business (static, see avatar/README.md)
```

## Core Capabilities (v1)

- Structured intelligence dashboard with 27 intelligence fields
- Executive Mode (boardroom summary + top 5 strategic actions)
- Watchlist + weekly signal digest
- Real-time alert engine (push / email / dashboard)
- Multi-company side-by-side comparison
- Latest 72-hour news aggregation (NewsAPI / Google News)
- Scoring engine (automation readiness, AI adoption, win probability, etc.)
- Predictive outsourcing forecast (CX, back-office, T&S, moderation, finops,
  AI-training)
- Deal probability prediction (3 / 6 / 12 month windows)
- Industry benchmarking + vendor penetration heatmap
- AI-readiness trend tracker
- PDF export module
- CRM connectors (Salesforce / HubSpot / Zoho) scaffolding
- Team dashboards
- Enterprise Intelligence REST API
- Subscription tier gating (Free / Pro / Enterprise)

## Quick Start

```bash
# Backend
cd backend && npm install && npm run dev   # http://localhost:4000

# Web
cd web && npm install && npm run dev       # http://localhost:3000
```

Set `OPENAI_API_KEY`, `NEWS_API_KEY` in `backend/.env` (see `.env.example`).
The platform degrades gracefully to the bundled preview dataset when API keys
are absent, so every screen renders in demo mode.

## License

Proprietary. Copyright Outsight AI.
