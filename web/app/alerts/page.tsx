'use client';
import { useEffect, useState } from 'react';
import { api } from '@/lib/api';

export default function AlertsPage() {
  const [alerts, setAlerts] = useState<any[]>([]);
  const [email, setEmail] = useState('');
  const [pushToken, setPushToken] = useState('');

  useEffect(() => {
    api('/alerts').then((r) => setAlerts(r.alerts || []));
  }, []);

  const subscribe = async () => {
    await api('/alerts/subscribe', { method: 'POST', body: JSON.stringify({ email, pushToken }) });
    alert('Subscription updated');
  };

  const fireTest = async () => {
    const r = await api('/alerts/test', { method: 'POST', body: JSON.stringify({}) });
    setAlerts([r.alert, ...alerts]);
  };

  return (
    <>
      <div className="hero">
        <h1>Alerts</h1>
        <p>
          Real-time signal firing across vendor opportunities, automation
          disruption, competitor moves, outsourcing contract movement, hiring
          shifts, AI investment, and deal probability threshold crossings.
        </p>
      </div>

      <div className="card">
        <h2>Delivery Channels</h2>
        <div className="grid grid-2">
          <div>
            <h3>Email</h3>
            <input className="input" placeholder="you@company.com" value={email} onChange={(e) => setEmail(e.target.value)} />
          </div>
          <div>
            <h3>Mobile Push Token (APNs / FCM)</h3>
            <input className="input" placeholder="device token" value={pushToken} onChange={(e) => setPushToken(e.target.value)} />
          </div>
        </div>
        <div style={{ marginTop: 12, display: 'flex', gap: 10 }}>
          <button className="button" onClick={subscribe}>Save Subscription</button>
          <button className="button secondary" onClick={fireTest}>Send Test Alert</button>
        </div>
      </div>

      <div className="card">
        <h2>Recent Alerts</h2>
        {alerts.length === 0 && <p className="muted">No alerts yet.</p>}
        <ul className="clean">
          {alerts.map((a) => (
            <li key={a.id}>
              <span className={`tag ${a.severity === 'high' ? 'bad' : a.severity === 'medium' ? 'warn' : 'good'}`}>{a.severity}</span>
              <strong>{a.kind.replace(/_/g, ' ')}</strong> — {a.message}
              <div className="muted" style={{ fontSize: 12 }}>{a.createdAt}</div>
            </li>
          ))}
        </ul>
      </div>
    </>
  );
}
