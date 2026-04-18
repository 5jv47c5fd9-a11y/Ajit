# Outsight AI — API Reference

Base URL: `http://localhost:4000` (dev). All requests accept/return JSON.
Authentication: `Authorization: Bearer <jwt>`.

## Core intelligence

### `POST /intelligence`

```json
{ "company": "Shopify", "executive": true }
```

Returns the full intelligence payload (see `shared/intelligence.schema.json`).

### `GET /intelligence/:company?executive=true`

Same, via path param.

### `GET /news/:company`

Raw 72-hour categorized news feed.

## Watchlist (Pro+)

| Method | Path                                   | Description              |
|--------|----------------------------------------|--------------------------|
| GET    | `/watchlist`                           | list user's watchlist    |
| POST   | `/watchlist`                           | add company              |
| DELETE | `/watchlist/:id`                       | remove                   |
| POST   | `/watchlist/refresh/:company`          | force snapshot refresh   |

## Alerts (Pro+)

| Method | Path                   | Description                        |
|--------|------------------------|------------------------------------|
| GET    | `/alerts`              | list recent + supported kinds      |
| POST   | `/alerts/subscribe`    | `{ email?, pushToken? }`           |
| POST   | `/alerts/test`         | fire a test alert                  |

## Comparison (Pro+)

`POST /compare` with `{ "companies": ["A", "B", ...] }` returns scorecards.

## Benchmark / Forecast / Trend (Pro+)

- `POST /benchmark` `{ company, peers?: [] }`
- `GET /forecast/:company`
- `GET /trend/:company`

## Enterprise-only

- `GET /heatmap/:company` — vendor penetration heatmap
- `GET /deal/:company` — deal probability prediction
- `GET /export/executive/:company` — Executive Briefing PDF
- `GET /export/strategy/:company` — Strategy Snapshot PDF
- `GET /export/forecast/:company` — Forecast PDF
- `POST /export/comparison` — Multi-company PDF
- `GET /crm/providers` — list connector status
- `POST /crm/:provider/push` — push intelligence into Salesforce/HubSpot/Zoho
- `GET /team/dashboard` — org-level shares + assignments
- `POST /team/share` / `POST /team/assign`

## Enterprise REST API (`/v1/*`)

Stable contract for external integrations:

- `GET /v1/company/:company/intelligence`
- `GET /v1/company/:company/forecast`
- `GET /v1/company/:company/benchmark`
- `GET /v1/company/:company/deal`
- `GET /v1/company/:company/heatmap`
- `GET /v1/company/:company/trend`
