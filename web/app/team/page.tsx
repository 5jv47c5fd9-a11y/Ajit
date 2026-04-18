'use client';
import { useEffect, useState } from 'react';
import { api } from '@/lib/api';

export default function TeamPage() {
  const [state, setState] = useState<any>({ shares: [], assignments: {}, watchlist: [] });
  const [company, setCompany] = useState('');
  const [assignee, setAssignee] = useState('');

  const refresh = async () => {
    try {
      const r = await api('/team/dashboard');
      setState(r);
    } catch {
      setState({ shares: [], assignments: {}, watchlist: [], error: 'requires_enterprise_tier' });
    }
  };

  useEffect(() => { refresh(); }, []);

  const assign = async () => {
    if (!company || !assignee) return;
    await api('/team/assign', { method: 'POST', body: JSON.stringify({ company, userId: assignee }) });
    refresh();
  };

  return (
    <>
      <div className="hero">
        <h1>Team Dashboard</h1>
        <p>
          Organization-level intelligence: shared watchlists, assigned account
          ownership, collaborative summaries, vendor penetration analytics, and
          forecasted outsourcing demand clusters.
        </p>
      </div>

      <div className="grid grid-2">
        <div className="card">
          <h2>Assign Account Owner</h2>
          <input className="input" placeholder="Company" value={company} onChange={(e) => setCompany(e.target.value)} />
          <div style={{ height: 8 }} />
          <input className="input" placeholder="Teammate user id" value={assignee} onChange={(e) => setAssignee(e.target.value)} />
          <div style={{ height: 8 }} />
          <button className="button" onClick={assign}>Assign</button>
        </div>

        <div className="card">
          <h2>Current Assignments</h2>
          <ul className="clean">
            {Object.entries(state.assignments || {}).map(([c, u]) => (
              <li key={c}><strong>{c}</strong> → <span className="muted">{String(u)}</span></li>
            ))}
            {!Object.keys(state.assignments || {}).length && <li className="muted">No assignments yet.</li>}
          </ul>
        </div>
      </div>

      <div className="card">
        <h2>Shared Items</h2>
        <ul className="clean">
          {state.shares?.map((s: any) => (
            <li key={s.id}>
              <span className="tag">{s.type}</span>
              <strong>{s.ref}</strong>
              <span className="muted"> shared by {s.ownerId}</span>
            </li>
          ))}
          {!state.shares?.length && <li className="muted">Nothing shared yet.</li>}
        </ul>
      </div>
    </>
  );
}
