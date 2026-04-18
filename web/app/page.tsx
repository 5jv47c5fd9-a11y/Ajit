import { SearchBar } from '@/components/SearchBar';

export default function HomePage() {
  return (
    <>
      <section className="hero">
        <h1>Enterprise intelligence, written for the boardroom.</h1>
        <p>
          Turn a single company name into an executive-grade outsourcing and AI
          adoption playbook — competitors, vendor opportunities, automation
          risk, deal probability, benchmarking, and a 24-month forecast.
        </p>
        <SearchBar />
      </section>

      <div className="grid grid-3">
        <Feature title="Executive Mode" body="Boardroom-ready signals: opportunity, threats, deal timing window, top 5 strategic actions." />
        <Feature title="Deal Probability Engine" body="3 / 6 / 12-month vendor-win probabilities with influencing factors." />
        <Feature title="Predictive Outsourcing Forecast" body="Function-level outlook (CX, back-office, T&S, moderation, finops, AI-training)." />
        <Feature title="Vendor Penetration Heatmap" body="Regions × functions, with active vendors and white-space opportunities." />
        <Feature title="AI-Readiness Trend Tracker" body="Quarterly signal movement, hiring shifts, and automation investment velocity." />
        <Feature title="Industry Benchmarking" body="Percentile ranks for AI adoption, outsourcing maturity, automation readiness." />
      </div>

      <div className="card">
        <h2>Try a preview</h2>
        <p className="muted">
          Works without any API keys configured — the platform falls back to the
          bundled preview dataset for demo companies.
        </p>
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
          <a className="button secondary" href="/company/Shopify">Shopify</a>
          <a className="button secondary" href="/company/Acme">Acme Corporation</a>
          <a className="button secondary" href="/company/Netflix?executive=true">Netflix (Executive Mode)</a>
        </div>
      </div>
    </>
  );
}

function Feature({ title, body }: { title: string; body: string }) {
  return (
    <div className="card">
      <h3>{title}</h3>
      <p className="muted" style={{ margin: 0 }}>{body}</p>
    </div>
  );
}
