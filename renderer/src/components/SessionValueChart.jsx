import { useRef, useState } from 'react';

const W = 760;
const H = 190;
const PAD_L = 8;
const PAD_R = 8;
const PAD_T = 14;
const PAD_B = 24;
const PLOT_W = W - PAD_L - PAD_R;
const PLOT_H = H - PAD_T - PAD_B;

export default function SessionValueChart({ samples }) {
  const svgRef = useRef(null);
  const [hoverIdx, setHoverIdx] = useState(null);

  if (samples.length < 2) {
    return (
      <div
        className="glass"
        style={{ padding: '18px 20px', marginTop: 16, borderRadius: 'var(--radius-md)', color: 'var(--fg-muted)', fontSize: 12 }}
      >
        Session Value chart fills in as loot comes in — not enough data yet this session.
      </div>
    );
  }

  const maxMin = samples[samples.length - 1].min || 1;
  const maxValue = Math.max(1, ...samples.map((s) => s.value));
  const feHourFor = (s) => (s.min > 0 ? (s.value / s.min) * 60 : 0);
  const maxFeHour = Math.max(1, ...samples.map(feHourFor));

  const xAt = (min) => PAD_L + (min / maxMin) * PLOT_W;
  const yAt = (v, max) => PAD_T + PLOT_H - (v / max) * PLOT_H;

  const cumLine = samples.map((s, i) => `${i === 0 ? 'M' : 'L'}${xAt(s.min).toFixed(1)},${yAt(s.value, maxValue).toFixed(1)}`).join(' ');
  const cumArea = `${cumLine} L${xAt(maxMin).toFixed(1)},${PAD_T + PLOT_H} L${xAt(0).toFixed(1)},${PAD_T + PLOT_H} Z`;
  const feLine = samples
    .map((s, i) => `${i === 0 ? 'M' : 'L'}${xAt(s.min).toFixed(1)},${yAt(feHourFor(s), maxFeHour).toFixed(1)}`)
    .join(' ');

  const last = samples[samples.length - 1];
  const lastCum = [xAt(last.min), yAt(last.value, maxValue)];
  const lastFe = [xAt(last.min), yAt(feHourFor(last), maxFeHour)];

  const gridLines = [0, 1, 2, 3, 4].map((g) => PAD_T + (PLOT_H / 4) * g);
  const labelMins = samples.filter((_, i) => i % Math.ceil(samples.length / 6) === 0 || i === samples.length - 1);

  const handleMove = (e) => {
    const rect = svgRef.current.getBoundingClientRect();
    const relX = ((e.clientX - rect.left) / rect.width) * W;
    const frac = Math.min(1, Math.max(0, (relX - PAD_L) / PLOT_W));
    setHoverIdx(Math.round(frac * (samples.length - 1)));
  };

  const hovered = hoverIdx !== null ? samples[hoverIdx] : null;
  const hoverX = hovered ? xAt(hovered.min) : null;

  return (
    <div className="glass" style={{ padding: '18px 20px 12px', marginTop: 16, borderRadius: 'var(--radius-md)', position: 'relative' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 18, fontSize: 11, color: 'var(--fg-tertiary)', marginBottom: 8, fontWeight: 500 }}>
        <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <i style={{ width: 7, height: 7, borderRadius: '50%', background: 'var(--pink)', display: 'inline-block' }} />
          Cumulative Session Value
        </span>
        <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <i style={{ width: 7, height: 7, borderRadius: '50%', background: 'var(--cyan)', display: 'inline-block' }} />
          FE / Hour (rolling)
        </span>
        <span style={{ marginLeft: 'auto', fontSize: 10, opacity: 0.6, fontStyle: 'italic' }}>hover the chart to scrub</span>
      </div>

      <svg
        ref={svgRef}
        viewBox={`0 0 ${W} ${H}`}
        preserveAspectRatio="none"
        style={{ width: '100%', height: 170, display: 'block', cursor: 'crosshair' }}
        onMouseMove={handleMove}
        onMouseLeave={() => setHoverIdx(null)}
      >
        {gridLines.map((gy, i) => (
          <line key={i} x1={PAD_L} y1={gy} x2={W - PAD_R} y2={gy} stroke="var(--border-subtle)" strokeWidth="1" />
        ))}
        {labelMins.map((s, i) => (
          <text key={i} x={xAt(s.min)} y={H - 6} textAnchor="middle" fontSize="9.5" fill="var(--fg-muted)">
            {s.min}m
          </text>
        ))}
        <path d={cumArea} fill="var(--pink)" opacity="0.22" />
        <path d={cumLine} fill="none" stroke="var(--pink)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        <circle cx={lastCum[0]} cy={lastCum[1]} r="3.5" fill="var(--pink)" />
        <path d={feLine} fill="none" stroke="var(--cyan)" strokeWidth="2" strokeDasharray="4 3" strokeLinecap="round" strokeLinejoin="round" />
        <circle cx={lastFe[0]} cy={lastFe[1]} r="3.5" fill="var(--cyan)" />
        {hoverX !== null && (
          <line x1={hoverX} y1={PAD_T} x2={hoverX} y2={PAD_T + PLOT_H} stroke="var(--fg-muted)" strokeWidth="1" strokeDasharray="3 3" />
        )}
      </svg>

      {hovered && (
        <div
          style={{
            position: 'absolute',
            top: 44,
            left: `${Math.min(85, Math.max(15, (hoverX / W) * 100)).toFixed(1)}%`,
            transform: 'translateX(-50%)',
            padding: '10px 12px',
            borderRadius: 12,
            minWidth: 140,
            background: 'rgba(10,8,20,0.88)',
            border: '1px solid var(--border)',
            backdropFilter: 'blur(10px)',
            pointerEvents: 'none',
            zIndex: 2,
            fontSize: 10.5,
          }}
        >
          <div style={{ fontSize: 11, fontWeight: 700, marginBottom: 6 }}>{hovered.min}m into session</div>
          <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--fg-tertiary)' }}>
            <span>Session Value</span>
            <b className="mono" style={{ color: 'var(--pink)' }}>
              {hovered.value >= 0 ? '+' : ''}
              {hovered.value.toFixed(1)} FE
            </b>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--fg-tertiary)', marginTop: 3 }}>
            <span>FE / Hour</span>
            <b className="mono" style={{ color: 'var(--cyan)' }}>
              {feHourFor(hovered).toFixed(0)}/hr
            </b>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--fg-tertiary)', marginTop: 3 }}>
            <span>Map</span>
            <b>{hovered.mapName || '—'}</b>
          </div>
        </div>
      )}
    </div>
  );
}
