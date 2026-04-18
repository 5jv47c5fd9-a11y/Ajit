import type { HeatmapCell } from '@/lib/types';

export function Heatmap({
  regions,
  functions,
  cells,
}: {
  regions: string[];
  functions: string[];
  cells: HeatmapCell[];
}) {
  const gridTemplateColumns = `160px repeat(${functions.length}, minmax(0, 1fr))`;
  return (
    <div className="heatmap" style={{ gridTemplateColumns }}>
      <div />
      {functions.map((f) => (
        <div key={f} className="muted" style={{ fontSize: 11, padding: 6, textAlign: 'center' }}>
          {f}
        </div>
      ))}
      {regions.map((region) => (
        <>
          <div key={`r-${region}`} className="muted" style={{ padding: 6, fontSize: 12 }}>
            {region}
          </div>
          {functions.map((fn) => {
            const cell = cells.find((c) => c.region === region && c.function === fn);
            const v = cell?.intensity ?? 0;
            const bg = `hsl(${220 - v * 1.2}, 85%, ${35 + v * 0.35}%)`;
            return (
              <div
                key={`${region}-${fn}`}
                className="heatmap-cell"
                style={{ background: bg, color: v > 50 ? '#0b1221' : '#e5ecf9' }}
                title={cell?.active_vendors?.join(', ') || 'white space'}
              >
                {v}
              </div>
            );
          })}
        </>
      ))}
    </div>
  );
}
