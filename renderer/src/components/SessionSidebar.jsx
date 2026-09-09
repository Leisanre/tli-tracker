import { useState } from 'react';
import { formatDuration } from '../utils/format.js';

function formatDate(ts) {
  return new Date(ts).toLocaleString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
}

function SessionRow({ label, sub, live, profit, onClick, selected }) {
  return (
    <div
      className="run-row"
      data-selected={selected}
      onClick={onClick}
      style={{ flexDirection: 'column', alignItems: 'flex-start', gap: 3 }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, width: '100%' }}>
        {live && <span className="ember-pulse live" style={{ flexShrink: 0 }} />}
        <span style={{ whiteSpace: 'normal', wordBreak: 'break-word' }}>{label}</span>
        {profit !== undefined && (
          <span
            className="mono"
            style={{ marginLeft: 'auto', fontSize: 12, color: profit >= 0 ? 'var(--success)' : 'var(--danger)', flexShrink: 0 }}
          >
            {profit >= 0 ? '+' : ''}
            {profit.toFixed(1)}
          </span>
        )}
      </div>
      {sub && <div style={{ fontSize: 11, color: 'var(--fg-muted)', whiteSpace: 'normal' }}>{sub}</div>}
    </div>
  );
}

// A real push-drawer, not an overlay — expanding widens this column in normal
// document flow (Map Log/Item Panel shrink to make room via their own flex-basis),
// so there is structurally nothing to overlap or z-index-fight with. Collapsed to a
// slim strip by default so history browsing doesn't cost width when not in use.
export default function SessionSidebar({ sessions, selectedSessionId, onSelect }) {
  const [open, setOpen] = useState(false);

  if (!open) {
    return (
      <div
        onClick={() => setOpen(true)}
        style={{
          width: 44,
          minHeight: 0,
          flexShrink: 0,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: 8,
          paddingTop: 16,
          cursor: 'pointer',
          borderRight: '1px solid var(--border-subtle)',
        }}
        title="Browse session history"
      >
        <span className="run-count-badge">{sessions.length}</span>
        <span
          style={{
            writingMode: 'vertical-rl',
            fontSize: 10.5,
            fontWeight: 700,
            letterSpacing: '0.08em',
            textTransform: 'uppercase',
            color: 'var(--fg-muted)',
          }}
        >
          History
        </span>
      </div>
    );
  }

  return (
    <div
      className="dropdown-in"
      style={{ width: 280, minHeight: 0, flexShrink: 0, borderRight: '1px solid var(--border-subtle)', overflowY: 'auto' }}
    >
      <div className="panel-header" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        Sessions
        <button
          type="button"
          onClick={() => setOpen(false)}
          title="Collapse"
          style={{ marginLeft: 'auto', width: 22, height: 22, padding: 0, fontSize: 11, lineHeight: 1 }}
        >
          ◂
        </button>
      </div>

      <SessionRow label="All Sessions" selected={selectedSessionId === null} onClick={() => onSelect(null)} />

      {sessions.map((s) => {
        const duration = (s.ended_at || Date.now()) - s.started_at;
        const profit = s.picked_value - s.cost_value;
        const live = s.ended_at === null;
        return (
          <SessionRow
            key={s.id}
            label={formatDate(s.started_at)}
            sub={`${s.map_count} maps · ${formatDuration(duration)}`}
            live={live}
            profit={profit}
            selected={selectedSessionId === s.id}
            onClick={() => onSelect(s.id)}
          />
        );
      })}

      {sessions.length === 0 && (
        <div className="loot-empty" style={{ margin: 'var(--sp-4)' }}>
          No sessions yet.
        </div>
      )}
    </div>
  );
}
