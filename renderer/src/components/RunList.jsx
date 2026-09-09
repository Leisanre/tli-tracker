import ItemIcon from './ItemIcon.jsx';
import { formatDuration } from '../utils/format.js';
import { valueOfRows, hasUnpricedRows, efficiency, topDropOf } from '../utils/value.js';

function RoiTag({ profit, cost }) {
  if (!cost || cost <= 0) return null;
  const roi = (profit / cost) * 100;
  return (
    <span className={`run-roi ${roi >= 0 ? 'roi-pos' : 'roi-neg'}`}>
      {roi >= 0 ? '+' : ''}
      {roi.toFixed(0)}% ROI
    </span>
  );
}

function TopDropCell({ topDrop, catalogById }) {
  if (!topDrop || !catalogById) return <td className="run-table-topdrop">—</td>;
  const item = catalogById.get(topDrop.itemId);
  return (
    <td className="run-table-topdrop">
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <ItemIcon item={item} size={30} />
        <div style={{ minWidth: 0 }}>
          <div style={{ fontSize: 13.5, fontWeight: 500, whiteSpace: 'normal', lineHeight: 1.25 }}>
            {item ? item.name : topDrop.itemId}
          </div>
          <div className="mono" style={{ fontSize: 11.5, color: 'var(--cyan)', fontWeight: 600 }}>
            +{topDrop.value.toFixed(1)}
          </div>
        </div>
      </div>
    </td>
  );
}

function RunTableRow({ label, sublabel, picked, cost, profit, incomplete, durationMs, live, selected, onClick, topDrop, catalogById }) {
  const eff = efficiency(profit, durationMs);
  return (
    <tr onClick={onClick} className="run-table-row" data-selected={selected} data-live={live}>
      <td>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          {live && <span className="ember-pulse live" style={{ flexShrink: 0 }} />}
          <div style={{ minWidth: 0 }}>
            <div style={{ fontWeight: 600, fontSize: 15, whiteSpace: 'normal', lineHeight: 1.25 }}>{label}</div>
            <div style={{ fontSize: 11.5, color: 'var(--fg-muted)', opacity: 0.75 }}>{sublabel}</div>
          </div>
        </div>
      </td>
      <td className="mono run-table-num">{picked.toFixed(1)}</td>
      <td className="mono run-table-num" style={{ color: cost > 0 ? 'var(--danger)' : 'var(--fg-muted)' }}>
        {cost > 0 ? `-${cost.toFixed(1)}` : '—'}
      </td>
      <td className="mono run-table-num run-table-profit" style={{ color: profit >= 0 ? 'var(--success)' : 'var(--danger)' }}>
        {incomplete ? '~' : ''}
        {profit >= 0 ? '+' : ''}
        {profit.toFixed(1)}
        <RoiTag profit={profit} cost={cost} />
      </td>
      <td className="mono run-table-num">{eff !== null ? `${eff >= 0 ? '+' : ''}${eff.toFixed(1)}/min` : '—'}</td>
      <td className="mono run-table-num">{formatDuration(durationMs)}</td>
      <TopDropCell topDrop={topDrop} catalogById={catalogById} />
    </tr>
  );
}

export default function RunList({
  runs,
  selectedSessionId,
  currentMap,
  perMap,
  perMapCost,
  now,
  watching,
  prices,
  selectedRunId,
  onSelect,
  catalogById,
}) {
  const browsingHistory = selectedSessionId !== null;
  // Hideout is downtime between maps, not a farming run — the Map Log is for actual
  // map results, so it's filtered out here rather than shown as a "run" with 0 loot.
  const isRealMap = (mapName) => !!mapName && !mapName.startsWith('Hideout');
  const historicalRuns = (
    browsingHistory ? runs : runs.filter((r) => r.exited_at !== null || !watching || r.map_name !== currentMap?.mapName)
  ).filter((r) => isRealMap(r.map_name));
  const showLiveRow = !browsingHistory && watching && currentMap && isRealMap(currentMap.mapName);
  const totalCount = historicalRuns.length + (showLiveRow ? 1 : 0);

  return (
    <div style={{ flex: '1.4 1 0%', minWidth: 560, minHeight: 0, borderRight: '1px solid var(--border-subtle)', overflowY: 'auto' }}>
      <div className="panel-header" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        Map Log
        <span className="run-count-badge">{totalCount}</span>
      </div>

      {totalCount === 0 ? (
        <div className="loot-empty" style={{ margin: 'var(--sp-4)' }}>
          No runs recorded yet.
        </div>
      ) : (
        <table className="loot-table run-table">
          <thead>
            <tr className="loot-head-row">
              <th style={{ width: '27%' }}>Map / Time</th>
              <th className="mono" style={{ width: '9%' }}>Picked Up</th>
              <th className="mono" style={{ width: '9%' }}>Cost</th>
              <th className="mono" style={{ width: '13%' }}>Profit</th>
              <th className="mono" style={{ width: '11%' }}>Efficiency</th>
              <th className="mono" style={{ width: '10%' }}>Duration</th>
              <th style={{ width: '21%' }}>Top Drop</th>
            </tr>
          </thead>
          <tbody>
            {showLiveRow && (
              <RunTableRow
                label={currentMap.mapName}
                sublabel={currentMap.zone}
                picked={valueOfRows(perMap, prices)}
                cost={valueOfRows(perMapCost, prices)}
                profit={valueOfRows(perMap, prices) - valueOfRows(perMapCost, prices)}
                incomplete={hasUnpricedRows(perMap, prices)}
                durationMs={now - (currentMap.enteredAt || now)}
                topDrop={topDropOf(perMap, prices)}
                catalogById={catalogById}
                live
                selected={selectedRunId === 'live'}
                onClick={() => onSelect('live')}
              />
            )}
            {historicalRuns.map((run) => (
              <RunTableRow
                key={run.id}
                label={run.map_name}
                sublabel={run.zone}
                picked={run.picked_value}
                cost={run.cost_value}
                profit={run.picked_value - run.cost_value}
                incomplete={!!run.has_unpriced_loot}
                durationMs={run.exited_at ? run.exited_at - run.entered_at : now - run.entered_at}
                topDrop={run.top_drop_item_id ? { itemId: run.top_drop_item_id, value: run.top_drop_value } : null}
                catalogById={catalogById}
                selected={selectedRunId === run.id}
                onClick={() => onSelect(run.id)}
              />
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
