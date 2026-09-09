import { useEffect, useRef, useState } from 'react';
import ItemIcon from './ItemIcon.jsx';
import IdentifyPicker from './IdentifyPicker.jsx';
import ItemInspector from './ItemInspector.jsx';
import Sparkline from './Sparkline.jsx';
import { typeColorVar } from '../utils/itemType.js';
import { valueOfRows, hasUnpricedRows } from '../utils/value.js';

function makeSorts(prices) {
  const valueOf = (row) => (prices[row.itemId]?.price || 0) * row.qty;
  return {
    qty_desc: (a, b) => b.qty - a.qty,
    qty_asc: (a, b) => a.qty - b.qty,
    value_desc: (a, b) => valueOf(b) - valueOf(a),
    value_asc: (a, b) => valueOf(a) - valueOf(b),
    name: (a, b, catalogById) =>
      (catalogById.get(a.itemId)?.name || '').localeCompare(catalogById.get(b.itemId)?.name || ''),
  };
}

export default function ItemPanel({
  catalogById,
  catalogList,
  overrides,
  onIdentify,
  prices,
  priceHistory,
  gainRows,
  costRows,
  mapLabel,
  sessionId,
}) {
  const [kind, setKind] = useState('gain'); // 'gain' | 'cost'
  const [search, setSearch] = useState('');
  const [sortKey, setSortKey] = useState('qty_desc');
  const [flashIds, setFlashIds] = useState(new Set());
  const [identifyingId, setIdentifyingId] = useState(null);
  const prevQtyRef = useRef(new Map());

  const resolveItem = (itemId) => catalogById.get(overrides[itemId] || itemId);
  const rows = kind === 'gain' ? gainRows : costRows;

  useEffect(() => {
    const next = new Set();
    for (const row of rows) {
      const prevQty = prevQtyRef.current.get(row.itemId) || 0;
      if (row.qty > prevQty) next.add(row.itemId);
      prevQtyRef.current.set(row.itemId, row.qty);
    }
    if (next.size > 0) {
      setFlashIds(next);
      const t = setTimeout(() => setFlashIds(new Set()), 900);
      return () => clearTimeout(t);
    }
  }, [rows]);

  const filtered = rows.filter((row) => {
    if (!search) return true;
    const name = resolveItem(row.itemId)?.name || row.itemId;
    return name.toLowerCase().includes(search.toLowerCase());
  });
  const sorts = makeSorts(prices);
  const sorted = [...filtered].sort((a, b) => sorts[sortKey](a, b, catalogById));
  const gainValue = valueOfRows(gainRows, prices);
  const costValue = valueOfRows(costRows, prices);
  const profit = gainValue - costValue;
  const incompleteProfit = hasUnpricedRows(gainRows, prices) || hasUnpricedRows(costRows, prices);
  const currencyId = Object.values(prices)[0]?.currency_id;
  const currencyName = currencyId ? catalogById.get(currencyId)?.name : null;

  return (
    <div style={{ flex: 1, minHeight: 0, overflowY: 'auto' }}>
      {/* Same .panel-header class/height as Sessions and Map Log, so all three
          columns start on the exact same horizontal baseline. */}
      <div className="panel-header" style={{ color: mapLabel ? 'var(--fg-primary)' : 'var(--fg-muted)' }}>
        {mapLabel || 'Select a run'}
      </div>

      <div className="loot-toolbar" style={{ fontSize: 11, padding: '14px 18px 0' }}>
        <div className="tab-group">
          <button data-active={kind === 'gain'} onClick={() => setKind('gain')} disabled={kind === 'gain'}>
            Picked Up
          </button>
          <button data-active={kind === 'cost'} onClick={() => setKind('cost')} disabled={kind === 'cost'}>
            Cost
          </button>
        </div>

        <input placeholder="Search item..." value={search} onChange={(e) => setSearch(e.target.value)} />

        <select value={sortKey} onChange={(e) => setSortKey(e.target.value)}>
          <option value="qty_desc">Qty (high-low)</option>
          <option value="qty_asc">Qty (low-high)</option>
          <option value="value_desc">Price (high-low)</option>
          <option value="value_asc">Price (low-high)</option>
          <option value="name">Name</option>
        </select>

        {(gainValue > 0 || costValue > 0) && (
          <span
            className="mono"
            style={{ color: profit >= 0 ? 'var(--success)' : 'var(--danger)', fontWeight: 600 }}
            title={incompleteProfit ? 'Some items have no known price yet — total is a lower bound' : undefined}
          >
            {incompleteProfit ? '~' : ''}
            {profit >= 0 ? '+' : ''}
            {profit.toFixed(1)} {currencyName || ''} profit
          </span>
        )}

        <ItemInspector catalogList={catalogList} sessionId={sessionId ?? null} />
      </div>

      {sorted.length === 0 && (
        <div
          className="loot-empty"
          style={{ margin: '0 18px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10, padding: '36px 20px' }}
        >
          <svg width="34" height="34" viewBox="0 0 24 24" fill="none" style={{ opacity: 0.35 }}>
            <path
              d="M4 8.5 12 4l8 4.5v8L12 21l-8-4.5v-8Z"
              stroke="var(--fg-muted)"
              strokeWidth="1.4"
              strokeLinejoin="round"
            />
            <path d="M4 8.5 12 13l8-4.5M12 13v8" stroke="var(--fg-muted)" strokeWidth="1.4" strokeLinejoin="round" />
          </svg>
          <div style={{ color: 'var(--fg-tertiary)', fontSize: 12.5 }}>
            {kind === 'cost' ? 'Nothing spent here yet.' : 'No loot picked up here yet.'}
          </div>
        </div>
      )}

      {sorted.length > 0 && (
        <table className="loot-table" style={{ width: 'calc(100% - 36px)', margin: '0 18px' }}>
          <thead>
            <tr className="loot-head-row">
              <th style={{ width: 48 }}></th>
              <th>Item</th>
              <th>Type</th>
              <th style={{ width: 60 }}>Trend</th>
              <th className="mono">Qty</th>
              <th className="mono">Unit Price</th>
              <th className="mono">Total Value</th>
              <th style={{ width: 90 }}></th>
            </tr>
          </thead>
          <tbody>
            {sorted.map((row) => {
              const item = resolveItem(row.itemId);
              const flashing = flashIds.has(row.itemId);
              const priceInfo = prices[row.itemId];
              return (
                <tr
                  key={row.itemId}
                  className={`loot-row${flashing ? ' flash' : ''}`}
                  style={{ borderLeftColor: item ? typeColorVar(item.typeCn) : 'var(--warning)' }}
                >
                  <td style={{ width: 48 }}>
                    <ItemIcon item={item} />
                  </td>
                  <td className="name">{item ? item.name : `Unresolved (${row.itemId})`}</td>
                  <td className="type">{item ? item.type : ''}</td>
                  <td style={{ width: 60 }}>
                    {priceHistory[row.itemId]?.length >= 2 ? (
                      <Sparkline points={priceHistory[row.itemId]} color="var(--cyan)" height={16} />
                    ) : (
                      <span style={{ fontSize: 9, color: 'var(--fg-muted)' }}>no history</span>
                    )}
                  </td>
                  <td className="qty mono">{row.qty}</td>
                  <td className="qty mono" style={{ color: 'var(--fg-tertiary)' }}>
                    {priceInfo ? priceInfo.price.toFixed(2) : '—'}
                  </td>
                  <td className="qty mono">{priceInfo ? (priceInfo.price * row.qty).toFixed(1) : '—'}</td>
                  <td style={{ position: 'relative', width: 90 }}>
                    {!item && (
                      <>
                        <button onClick={() => setIdentifyingId(row.itemId)}>Identify</button>
                        {identifyingId === row.itemId && (
                          <IdentifyPicker
                            itemCatalog={catalogList}
                            onPick={(catalogId) => {
                              onIdentify(row.itemId, catalogId);
                              setIdentifyingId(null);
                            }}
                            onClose={() => setIdentifyingId(null)}
                          />
                        )}
                      </>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      )}
    </div>
  );
}
