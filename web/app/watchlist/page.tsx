'use client';
import { useEffect, useState } from 'react';
import { api } from '@/lib/api';

export default function WatchlistPage() {
  const [items, setItems] = useState<any[]>([]);
  const [company, setCompany] = useState('');

  const refresh = async () => {
    const res = await api('/watchlist');
    setItems(res.watchlist || []);
  };

  useEffect(() => { refresh(); }, []);

  const add = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!company.trim()) return;
    await api('/watchlist', { method: 'POST', body: JSON.stringify({ company: company.trim() }) });
    setCompany('');
    refresh();
  };

  const remove = async (id: string) => {
    await api(`/watchlist/${id}`, { method: 'DELETE' });
    refresh();
  };

  const refreshOne = async (name: string) => {
    await api(`/watchlist/refresh/${encodeURIComponent(name)}`, { method: 'POST' });
    refresh();
  };

  return (
    <>
      <div className="hero">
        <h1>Watchlist</h1>
        <p>
          Track companies you are pursuing. Outsight sweeps each entry hourly,
          fires alerts on movement, and compiles a weekly signal digest.
        </p>
        <form onSubmit={add} className="search-row">
          <input className="input" value={company} onChange={(e) => setCompany(e.target.value)} placeholder="Add a company" />
          <button className="button" type="submit">Add</button>
        </form>
      </div>

      <div className="card">
        <h2>Tracked Companies</h2>
        {items.length === 0 && <p className="muted">No companies yet.</p>}
        <table className="data">
          <thead>
            <tr>
              <th>Company</th>
              <th>Added</th>
              <th>Win Prob</th>
              <th>Automation</th>
              <th>AI</th>
              <th>Outsourcing</th>
              <th>Displacement</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {items.map((it) => (
              <tr key={it.id}>
                <td><a href={`/company/${encodeURIComponent(it.company)}`}>{it.company}</a></td>
                <td className="muted">{it.addedAt?.slice(0, 10)}</td>
                <td>{it.lastSnapshot?.deal?.probability_12_months ?? '—'}%</td>
                <td>{it.lastSnapshot?.automation ?? '—'}</td>
                <td>{it.lastSnapshot?.ai ?? '—'}</td>
                <td>{it.lastSnapshot?.outsourcing ?? '—'}</td>
                <td>{it.lastSnapshot?.displacement ?? '—'}</td>
                <td>
                  <button className="button secondary" onClick={() => refreshOne(it.company)}>Refresh</button>{' '}
                  <button className="button secondary" onClick={() => remove(it.id)}>Remove</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}
