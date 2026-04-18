import { api } from '@/lib/api';
import type { IntelligencePayload } from '@/lib/types';
import { ScoreChip } from '@/components/ScoreChip';
import { Heatmap } from '@/components/Heatmap';
import { SearchBar } from '@/components/SearchBar';

export const dynamic = 'force-dynamic';

async function fetchIntelligence(name: string, executive: boolean): Promise<IntelligencePayload> {
  const res = await api(`/intelligence`, {
    method: 'POST',
    body: JSON.stringify({ company: name, executive }),
  });
  return res.data;
}

export default async function CompanyPage({
  params,
  searchParams,
}: {
  params: { name: string };
  searchParams: { executive?: string };
}) {
  const name = decodeURIComponent(params.name);
  const executive = searchParams.executive === 'true';
  const data = await fetchIntelligence(name, executive);

  return (
    <>
      <div className="hero">
        <h1>{name}</h1>
        <p>{data.company_summary}</p>
        <SearchBar defaultValue={name} />
      </div>

      {data.executive_mode && <ExecutiveCard mode={data.executive_mode} />}

      <div className="grid grid-4">
        <ScoreChip label="Automation Readiness" value={data.automation_readiness_score} />
        <ScoreChip label="AI Adoption" value={data.ai_adoption_probability} />
        <ScoreChip label="Vendor Win Probability" value={data.vendor_win_probability} />
        <ScoreChip label="Outsourcing Expansion" value={data.outsourcing_expansion_likelihood} />
      </div>

      <div className="grid grid-2">
        <div className="card">
          <h2>Deal Probability Forecast</h2>
          <div className="grid grid-3">
            <DealChip label="3 months" v={data.deal_probability_prediction.probability_3_months} />
            <DealChip label="6 months" v={data.deal_probability_prediction.probability_6_months} />
            <DealChip label="12 months" v={data.deal_probability_prediction.probability_12_months} />
          </div>
          <h3 style={{ marginTop: 14 }}>Influencing factors</h3>
          <ul className="clean">
            {data.deal_probability_prediction.influencing_factors.map((f) => (
              <li key={f.factor}>
                <span className={`tag ${f.impact === '+' ? 'good' : 'bad'}`}>{f.impact}</span>
                {f.factor} <span className="muted">({f.weight})</span>
              </li>
            ))}
          </ul>
        </div>

        <div className="card">
          <h2>Strategic Horizon (6–24 months)</h2>
          <p>{data.strategic_horizon}</p>
          <h3>Executive Summary</h3>
          <p>{data.executive_summary}</p>
        </div>
      </div>

      <div className="grid grid-3">
        <div className="card">
          <h2>Direct Competitors</h2>
          <ul className="clean">{data.competitors.direct.map((c) => <li key={c}>{c}</li>)}</ul>
        </div>
        <div className="card">
          <h2>Indirect Competitors</h2>
          <ul className="clean">{data.competitors.indirect.map((c) => <li key={c}>{c}</li>)}</ul>
        </div>
        <div className="card">
          <h2>Outsourcing Partners</h2>
          <ul className="clean">{data.outsourcing_partners.map((c) => <li key={c}>{c}</li>)}</ul>
        </div>
      </div>

      <div className="grid grid-2">
        <SignalCard title="Vendor Opportunities" items={data.vendor_opportunities} tone="good" />
        <SignalCard title="Vendor Threats" items={data.vendor_threats} tone="bad" />
        <SignalCard title="Outsourcing Signals" items={data.outsourcing_signals} tone="good" />
        <SignalCard title="Automation Risk Signals" items={data.automation_risk_signals} tone="warn" />
        <SignalCard title="Cost Optimization Signals" items={data.cost_optimization_signals} />
        <SignalCard title="Digital Transformation" items={data.digital_transformation_indicators} />
        <SignalCard title="Hiring Signals" items={data.hiring_signals} />
        <SignalCard title="Geographic Strategy" items={data.geographic_strategy_signals} />
        <SignalCard title="Technology Stack" items={data.technology_stack_indicators} />
        <SignalCard title="Vendor Replacement Risk" items={data.vendor_replacement_risk_indicators} tone="warn" />
      </div>

      <div className="card">
        <h2>Predictive Outsourcing Forecast</h2>
        <table className="data">
          <thead>
            <tr>
              <th>Function</th>
              <th>6m</th>
              <th>12m</th>
              <th>24m</th>
              <th>Direction</th>
            </tr>
          </thead>
          <tbody>
            {data.predictive_outsourcing_forecast.map((f) => (
              <tr key={f.function}>
                <td>{f.function}</td>
                <td>{f.probability_6m}%</td>
                <td>{f.probability_12m}%</td>
                <td>{f.probability_24m}%</td>
                <td>{f.direction}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="card">
        <h2>Vendor Penetration Heatmap</h2>
        <p className="muted">Cells show inferred vendor intensity (0–100). White space indicates low penetration / opportunity.</p>
        <Heatmap
          regions={data.vendor_penetration_heatmap.regions}
          functions={data.vendor_penetration_heatmap.functions}
          cells={data.vendor_penetration_heatmap.cells}
        />
      </div>

      <div className="grid grid-2">
        <div className="card">
          <h2>Recommended Strategy — Existing Vendor</h2>
          <p>{data.recommended_vendor_strategy.if_already_vendor}</p>
        </div>
        <div className="card">
          <h2>Recommended Strategy — New Entry</h2>
          <p>{data.recommended_vendor_strategy.if_not_currently_vendor}</p>
        </div>
      </div>

      <div className="card">
        <h2>Latest News (72h)</h2>
        {data.latest_news?.items?.length ? (
          <ul className="clean">
            {data.latest_news.items.slice(0, 10).map((n: any, i: number) => (
              <li key={i}>
                <a href={n.url} target="_blank" rel="noreferrer">{n.title}</a>
                <div className="muted" style={{ fontSize: 12 }}>{n.source} · {n.publishedAt?.slice(0, 10)}</div>
              </li>
            ))}
          </ul>
        ) : (
          <p className="muted">No recent articles — attach a NEWS_API_KEY to enable live feed.</p>
        )}
      </div>

      <div className="card" style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
        <a className="button secondary" href={`/api/backend/export/executive/${encodeURIComponent(name)}`}>Download Executive PDF</a>
        <a className="button secondary" href={`/api/backend/export/strategy/${encodeURIComponent(name)}`}>Strategy Snapshot PDF</a>
        <a className="button secondary" href={`/api/backend/export/forecast/${encodeURIComponent(name)}`}>Forecast PDF</a>
      </div>
    </>
  );
}

function DealChip({ label, v }: { label: string; v: number }) {
  return (
    <div className="card" style={{ padding: 14 }}>
      <h3>{label}</h3>
      <div style={{ fontSize: 24, fontWeight: 700 }}>{v}%</div>
      <div className="score-bar"><span style={{ width: `${v}%` }} /></div>
    </div>
  );
}

function SignalCard({ title, items, tone }: { title: string; items: string[]; tone?: 'good' | 'warn' | 'bad' }) {
  return (
    <div className="card">
      <h2>{title} {tone && <span className={`tag ${tone}`}>{tone === 'good' ? 'opportunity' : tone === 'bad' ? 'threat' : 'watch'}</span>}</h2>
      <ul className="clean">{items?.map((s, i) => <li key={i}>{s}</li>)}</ul>
    </div>
  );
}

function ExecutiveCard({ mode }: { mode: NonNullable<IntelligencePayload['executive_mode']> }) {
  return (
    <div className="card" style={{ borderColor: 'rgba(79,140,255,0.45)' }}>
      <h2>Executive Mode Briefing</h2>
      <div className="grid grid-3">
        <MetricLine label="Vendor Win Probability" value={`${mode.vendor_win_probability_score}%`} />
        <MetricLine label="Automation Disruption Probability" value={`${mode.automation_disruption_probability}%`} />
        <MetricLine label="Outsourcing Expansion Likelihood" value={`${mode.outsourcing_expansion_likelihood}%`} />
      </div>
      <MetricLine label="Predicted Deal Timing Window" value={mode.predicted_deal_timing_window} />
      <div className="grid grid-2" style={{ marginTop: 12 }}>
        <SignalCard title="Opportunity Indicators" items={mode.opportunity_indicators} tone="good" />
        <SignalCard title="Threat Indicators" items={mode.threat_indicators} tone="bad" />
      </div>
      <div className="card" style={{ background: 'var(--panel-2)' }}>
        <h3>Top 5 Strategic Actions (Immediate)</h3>
        <ol style={{ paddingLeft: 18 }}>
          {mode.top_5_strategic_actions.map((a, i) => <li key={i}>{a}</li>)}
        </ol>
      </div>
    </div>
  );
}

function MetricLine({ label, value }: { label: string; value: string }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px dashed var(--border)' }}>
      <span className="muted">{label}</span>
      <strong>{value}</strong>
    </div>
  );
}
