// Small variance badge — is this stat beating the player's own past-session average?
// Renders nothing when there's no baseline yet (first session ever, or all unfinished).
export default function DeltaBadge({ current, avg }) {
  if (avg === null || avg === undefined || avg === 0) return null;
  const pct = ((current - avg) / Math.abs(avg)) * 100;
  return (
    <div
      className="stat-delta"
      style={{
        position: 'absolute',
        top: 10,
        right: 10,
        padding: '2px 7px',
        borderRadius: 999,
        fontSize: 9.5,
        fontWeight: 700,
        fontVariantNumeric: 'tabular-nums',
        background: pct >= 0 ? 'rgba(74, 222, 128, 0.15)' : 'rgba(251, 113, 133, 0.15)',
        color: pct >= 0 ? 'var(--success)' : 'var(--danger)',
      }}
      title="vs your average of past finished sessions"
    >
      {pct >= 0 ? '▲ +' : '▼ '}
      {pct.toFixed(1)}%
    </div>
  );
}
