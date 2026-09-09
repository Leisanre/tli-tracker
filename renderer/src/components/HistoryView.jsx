import { useMemo, useState } from 'react';
import { formatDuration } from '../utils/format.js';

const RANGES = [
  { id: 'today', label: 'Today', ms: 24 * 60 * 60 * 1000 },
  { id: '7d', label: 'Last 7 Days', ms: 7 * 24 * 60 * 60 * 1000 },
  { id: '30d', label: 'Last 30 Days', ms: 30 * 24 * 60 * 60 * 1000 },
  { id: 'all', label: 'All Time', ms: null },
];

function formatDate(ts) {
  return new Date(ts).toLocaleString(undefined, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

// A dedicated audit view for past sessions — the live dashboard's Sessions drawer is
// for quick recent browsing, this is for going back further with real date filters,
// without cluttering the active tracking screen with a history UI it doesn't need.
export default function HistoryView({ sessions, onOpenSession }) {
  const [range, setRange] = useState('7d');

  const filtered = useMemo(() => {
    const spec = RANGES.find((r) => r.id === range);
    const cutoff = spec.ms ? Date.now() - spec.ms : 0;
    return sessions.filter((s) => s.started_at >= cutoff);
  }, [sessions, range]);

  const totalProfit = filtered.reduce((sum, s) => sum + (s.picked_value - s.cost_value), 0);
  const totalMaps = filtered.reduce((sum, s) => sum + s.map_count, 0);

  return (
    <div className="glass mx-8 mb-8 flex flex-1 flex-col overflow-hidden" style={{ borderRadius: 'var(--radius-lg)' }}>
      <div className="panel-header" style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
        History
        <div className="tab-group">
          {RANGES.map((r) => (
            <button key={r.id} type="button" data-active={range === r.id} onClick={() => setRange(r.id)}>
              {r.label}
            </button>
          ))}
        </div>
        <span className="ml-auto text-xs" style={{ color: 'var(--fg-tertiary)' }}>
          {filtered.length} sessions · {totalMaps} maps · {totalProfit >= 0 ? '+' : ''}
          {totalProfit.toFixed(1)} FE
        </span>
      </div>

      <div style={{ flex: 1, minHeight: 0, overflowY: 'auto' }}>
        {filtered.length === 0 && (
          <div className="loot-empty" style={{ margin: 24 }}>
            No sessions in this range.
          </div>
        )}
        {filtered.length > 0 && (
          <table className="loot-table run-table">
            <thead>
              <tr className="loot-head-row">
                <th style={{ width: '30%' }}>Started</th>
                <th className="mono" style={{ width: '14%' }}>Maps</th>
                <th className="mono" style={{ width: '18%' }}>Profit</th>
                <th className="mono" style={{ width: '18%' }}>Duration</th>
                <th style={{ width: '20%' }}></th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((s) => {
                const duration = (s.ended_at || Date.now()) - s.started_at;
                const profit = s.picked_value - s.cost_value;
                const live = s.ended_at === null;
                return (
                  <tr key={s.id} className="run-table-row" onClick={() => onOpenSession(s.id)}>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        {live && <span className="ember-pulse live" />}
                        <span style={{ fontWeight: 600, fontSize: 13 }}>{formatDate(s.started_at)}</span>
                      </div>
                    </td>
                    <td className="mono run-table-num">{s.map_count}</td>
                    <td
                      className="mono run-table-num run-table-profit"
                      style={{ color: profit >= 0 ? 'var(--success)' : 'var(--danger)' }}
                    >
                      {profit >= 0 ? '+' : ''}
                      {profit.toFixed(1)}
                    </td>
                    <td className="mono run-table-num">{formatDuration(duration)}</td>
                    <td className="mono run-table-num" style={{ color: 'var(--cyan)' }}>
                      View in Map Log →
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
