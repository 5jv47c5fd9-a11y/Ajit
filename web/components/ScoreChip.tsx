export function ScoreChip({ label, value }: { label: string; value: number }) {
  const color =
    value >= 70 ? 'var(--good)' : value >= 45 ? 'var(--warn)' : 'var(--bad)';
  return (
    <div className="card" style={{ padding: 16 }}>
      <h3>{label}</h3>
      <div style={{ display: 'flex', alignItems: 'baseline', gap: 8 }}>
        <div style={{ fontSize: 30, fontWeight: 700, color }}>{value}</div>
        <div className="muted" style={{ fontSize: 12 }}>/ 100</div>
      </div>
      <div className="score-bar"><span style={{ width: `${value}%` }} /></div>
    </div>
  );
}
