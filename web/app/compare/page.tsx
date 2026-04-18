'use client';
import { useState } from 'react';
import { api } from '@/lib/api';

export default function ComparePage() {
  const [input, setInput] = useState('Shopify, Acme, Netflix');
  const [rows, setRows] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  const run = async () => {
    const companies = input.split(',').map((c) => c.trim()).filter(Boolean);
    setLoading(true);
    try {
      const res = await api('/compare', { method: 'POST', body: JSON.stringify({ companies }) });
      setRows(res.comparison || []);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <div className="hero">
        <h1>Multi-company comparison</h1>
        <p>
          Side-by-side scorecards across automation readiness, AI adoption,
          outsourcing maturity, vendor win probability, displacement risk, and
          forecast deal probability.
        </p>
        <div className="search-row">
          <input className="input" value={input} onChange={(e) => setInput(e.target.value)} />
          <button className="button" onClick={run} disabled={loading}>{loading ? 'Scoring…' : 'Compare'}</button>
        </div>
      </div>

      {rows.length > 0 && (
        <div className="card">
          <h2>Scorecards</h2>
          <table className="data">
            <thead>
              <tr>
                <th>Company</th>
                <th>Automation</th>
                <th>AI Adoption</th>
                <th>Outsourcing</th>
                <th>Win Prob</th>
                <th>Displacement</th>
                <th>Deal 12m</th>
                <th>Benchmark</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.company}>
                  <td><a href={`/company/${encodeURIComponent(r.company)}`}>{r.company}</a></td>
                  <td>{r.automation_readiness_score}</td>
                  <td>{r.ai_adoption_probability}</td>
                  <td>{r.outsourcing_expansion_likelihood}</td>
                  <td>{r.vendor_win_probability}</td>
                  <td>{r.vendor_displacement_risk}</td>
                  <td>{r.deal_probability_12m}%</td>
                  <td>{r.industry_benchmark?.digital_transformation_velocity ?? '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {rows.length > 0 && (
        <div className="card">
          <h2>Strategic Horizon</h2>
          <ul className="clean">
            {rows.map((r) => (
              <li key={r.company}>
                <strong>{r.company}</strong> — {r.strategic_horizon}
              </li>
            ))}
          </ul>
        </div>
      )}
    </>
  );
}
