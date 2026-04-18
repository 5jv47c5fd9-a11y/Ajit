# Outsight AI — Architecture

```
          ┌────────────────┐    ┌────────────────┐    ┌────────────────┐
          │  iOS (SwiftUI) │    │ Android (Compose)│   │ Web (Next.js)  │
          └────────┬───────┘    └────────┬────────┘    └────────┬───────┘
                   │                     │                      │
                   └────────────┬────────┴──────────────────────┘
                                │ HTTPS (JSON)
                                ▼
                    ┌─────────────────────────┐
                    │   Backend Intelligence  │
                    │    (Express / Node.js)  │
                    │                         │
                    │  • Auth / Tier gating   │
                    │  • Rate limit + cache   │
                    │  • Alert engine         │
                    │  • Watchlist / Team     │
                    │  • Export (PDF)         │
                    │  • CRM connectors       │
                    │  • Scheduler (cron)     │
                    │  • Enterprise API (/v1) │
                    └────────┬────────────────┘
                             │
                    ┌────────┴─────────┐
                    │ Intelligence     │
                    │ Pipeline         │
                    └────────┬─────────┘
                             │
           ┌─────────────────┼─────────────────────────────┐
           ▼                 ▼                             ▼
 ┌──────────────────┐ ┌──────────────┐             ┌────────────────┐
 │ Signal Analyzer  │ │ News Service │             │ OpenAI Reasoner│
 │  (pluggable)     │ │  (NewsAPI /  │             │  (structured)  │
 │                  │ │   Google)    │             │                │
 └───────┬──────────┘ └──────┬───────┘             └────────┬───────┘
         │                   │                              │
         ▼                   ▼                              ▼
   Clearbit, LinkedIn,  72-hour categorized news     JSON matching
   Crunchbase, Perplexity, press,                    enterprise schema
   earnings, jobs, patents, SEC
                              │
                              ▼
            ┌────────────────────────────────────┐
            │  Engines                           │
            │  • Scoring (readiness/adoption/…)  │
            │  • Deal probability (3/6/12m)      │
            │  • Forecast (CX, BO, T&S, …)       │
            │  • Benchmark (percentile ranks)    │
            │  • Heatmap (regions × functions)   │
            │  • Trend (quarterly snapshots)     │
            └────────────────────────────────────┘
```

## Extensibility

- **Add a signal source:** drop a `fetchX(company)` function into
  `backend/src/services/signalAnalyzer.js` (`SIGNAL_SOURCES`). Returns
  `{ source, data }`; pipeline picks it up automatically.
- **Add an engine output:** extend `buildIntelligence` in
  `backend/src/engines/intelligencePipeline.js` and wire the field into the
  schema + clients.
- **Add a CRM target:** add an entry to `crmService.providers` with
  `ready()` + `push()` — route + UI picks it up.
- **Add an alert kind:** append to `ALERT_KINDS` in `alertEngine.js` and fire
  from any service with `alertEngine.fire(userId, kind, payload)`.

## Tier gating (server-enforced)

| Tier        | Endpoints                                                                 |
|-------------|---------------------------------------------------------------------------|
| Free        | `POST /intelligence` (5/mo quota)                                         |
| Pro         | watchlist, alerts, compare, forecast, benchmark, trend                    |
| Enterprise  | heatmap, deal, export (PDF), CRM, team dashboards, `/v1/*` API            |

## Security

- Secrets via env (`OPENAI_API_KEY`, `NEWS_API_KEY`, `CLEARBIT_API_KEY`, …)
- JWT middleware (`requireAuth`) ready for SSO / OAuth swap
- RBAC via `requireRole` and `requireTier`
- Rate limit: 120 req/min/IP
- PII not persisted in shipped in-memory stores (swap for durable store)
