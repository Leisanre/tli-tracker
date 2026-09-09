import { useState } from 'react';
import { formatDuration } from '../utils/format.js';
import { valueOfRows, hasUnpricedRows, efficiency, applyTax, activeMapMs, pastSessionAverages } from '../utils/value.js';
import DeltaBadge from './DeltaBadge.jsx';

function Card({ label, value, color, sub, delta, children }) {
  return (
    <div className="glass stat-tile rounded-2xl p-6" style={{ borderRadius: 'var(--radius-md)', position: 'relative', minWidth: 0 }}>
      {delta}
      <div className="text-[10.5px] font-medium" style={{ color: 'var(--fg-secondary)' }}>
        {label}
      </div>
      <div className="text-lg font-black tabular-nums" style={{ color: color || 'var(--fg-primary)' }}>
        {value}
      </div>
      {sub && (
        <div className="text-[11px]" style={{ color: 'var(--fg-tertiary)' }}>
          {sub}
        </div>
      )}
      {children}
    </div>
  );
}

function GoalCard({ currentFe, feGoal, onChangeGoal }) {
  const pct = Math.min(100, Math.max(0, (currentFe / feGoal) * 100));
  return (
    <Card label="Build Target" value={`${pct.toFixed(0)}%`} color="var(--cyan)" sub={`${currentFe.toFixed(0)} / ${feGoal.toLocaleString()} FE`}>
      <div style={{ height: 5, borderRadius: 999, background: 'var(--bg-inset)', marginTop: 8, overflow: 'hidden' }}>
        <div
          style={{
            height: '100%',
            width: `${pct}%`,
            borderRadius: 999,
            background: 'linear-gradient(90deg, var(--pink), var(--cyan))',
            transition: 'width 500ms cubic-bezier(.2,.7,.2,1)',
          }}
        />
      </div>
      <input
        type="number"
        value={feGoal}
        min={1}
        step={100}
        onClick={(e) => e.stopPropagation()}
        onChange={(e) => onChangeGoal(e.target.value)}
        title="Set your FE build target"
        style={{
          position: 'absolute',
          top: 8,
          right: 8,
          width: 56,
          textAlign: 'right',
          fontSize: 9.5,
          padding: '2px 6px',
        }}
      />
    </Card>
  );
}

export default function StatCards({
  bag,
  session,
  sessionCost,
  runs,
  sessions,
  currentMap,
  sessionStats,
  prices,
  now,
  taxOn,
  feBasis,
  feGoal,
  onChangeGoal,
}) {
  const [copied, setCopied] = useState(false);
  const backpackValue = applyTax(valueOfRows(bag, prices), taxOn);
  const backpackIncomplete = hasUnpricedRows(bag, prices);

  const pickedValue = valueOfRows(session, prices);
  const spentValue = valueOfRows(sessionCost, prices);
  const profit = applyTax(pickedValue - spentValue, taxOn);
  const profitIncomplete = hasUnpricedRows(session, prices) || hasUnpricedRows(sessionCost, prices);

  // `runs` is the most-recent-500 slice across all history (not session-scoped by the
  // backend query), so narrow to this session client-side using its start timestamp.
  const currentSessionRuns = runs.filter((r) => sessionStats.startedAt && r.entered_at >= sessionStats.startedAt);

  const sessionElapsed = sessionStats.startedAt ? now - sessionStats.startedAt : 0;
  const activeElapsed = activeMapMs(currentSessionRuns, now);
  const feHourMs = feBasis === 'wall' ? sessionElapsed : activeElapsed;
  const feHour = efficiency(profit, feHourMs) != null ? efficiency(profit, feHourMs) * 60 : null;

  const avgs = pastSessionAverages(sessions);
  const avgProfit = avgs ? applyTax(avgs.avgProfit, taxOn) : null;
  const avgFeHour = avgs && avgs.avgDurationMs > 0 ? (avgs.avgProfit / (avgs.avgDurationMs / 3600000)) : null;

  const bestRun = [...currentSessionRuns].sort(
    (a, b) => (b.picked_value - b.cost_value) - (a.picked_value - a.cost_value),
  )[0];
  const handleShare = () => {
    const lines = [
      '**TLI Session Summary**',
      `Duration: ${formatDuration(sessionElapsed)} · Maps: ${sessionStats.mapsRun} · Items looted: ${sessionStats.totalItemsLooted}`,
      `Profit: ${profit >= 0 ? '+' : ''}${profit.toFixed(1)} FE${feHour !== null ? ` (~${feHour.toFixed(1)} FE/hr ${feBasis === 'wall' ? 'wall clock' : 'active map time'})` : ''}`,
      `Backpack Value: ${backpackValue.toFixed(0)} FE`,
    ];
    if (bestRun) {
      const bestProfit = bestRun.picked_value - bestRun.cost_value;
      lines.push(`Best run: ${bestRun.map_name} (${bestProfit >= 0 ? '+' : ''}${bestProfit.toFixed(1)} FE)`);
    }
    const text = lines.join('\n');
    const done = () => {
      setCopied(true);
      setTimeout(() => setCopied(false), 1600);
    };
    if (navigator.clipboard?.writeText) navigator.clipboard.writeText(text).then(done).catch(done);
    else done();
  };

  return (
    <div
      className="px-10 pb-3"
      style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(170px, 1fr))', gap: 10 }}
    >
      <GoalCard currentFe={profit} feGoal={feGoal} onChangeGoal={onChangeGoal} />
      <Card
        label="Backpack Value"
        value={`${backpackIncomplete ? '~' : ''}${backpackValue.toFixed(0)}`}
        sub={taxOn ? 'net of 12.5% tax' : undefined}
      />
      <Card
        label="Profit (Session)"
        value={`${profitIncomplete ? '~' : ''}${profit >= 0 ? '+' : ''}${profit.toFixed(1)}`}
        color={profit >= 0 ? 'var(--success)' : 'var(--danger)'}
        sub={taxOn ? 'net of 12.5% tax' : undefined}
        delta={<DeltaBadge current={profit} avg={avgProfit} />}
      />
      <Card
        label={`FE / Hour (${feBasis === 'wall' ? 'Wall Clock' : 'Active Map Time'})`}
        value={feHour !== null ? `${feHour >= 0 ? '+' : ''}${feHour.toFixed(1)}` : '—'}
        color={(feHour || 0) >= 0 ? 'var(--success)' : 'var(--danger)'}
        sub={
          feBasis === 'wall'
            ? 'includes hideout downtime'
            : `${Math.round(activeElapsed / 60000)}m of ${Math.round(sessionElapsed / 60000)}m session in a map`
        }
        delta={<DeltaBadge current={feHour} avg={avgFeHour} />}
      />
      <Card label="Maps this Session" value={sessionStats.mapsRun} />
      <Card
        label="Session Duration"
        value={formatDuration(sessionElapsed)}
        sub={`Items looted: ${sessionStats.totalItemsLooted}`}
      >
        <button
          type="button"
          onClick={handleShare}
          title="Copy session summary for Discord"
          style={{
            position: 'absolute',
            top: 10,
            right: 10,
            width: 24,
            height: 24,
            padding: 0,
            borderRadius: 8,
            fontSize: 13,
            lineHeight: 1,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: copied ? 'linear-gradient(120deg, var(--pink), var(--cyan))' : undefined,
            color: copied ? '#160f2b' : undefined,
            borderColor: copied ? 'transparent' : undefined,
          }}
        >
          {copied ? '✓' : '⇪'}
        </button>
      </Card>
    </div>
  );
}
