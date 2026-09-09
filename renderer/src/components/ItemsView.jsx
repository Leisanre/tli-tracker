import { useMemo, useState } from 'react';
import ItemIcon from './ItemIcon.jsx';
import { classifyItemType } from '../utils/itemType.js';
import { valueOfRows } from '../utils/value.js';

// The classifier only knows Currency/Gear/Memory/(everything else) from the actual
// catalog data — not the game's full Skills/Vorax/Divinity/etc. taxonomy, which isn't
// tracked anywhere in this app. Labeling "default" as Other rather than inventing
// categories we have no real data for.
const CATEGORIES = [
  { id: 'currency', label: 'Currency' },
  { id: 'gear', label: 'Equipment' },
  { id: 'memory', label: 'Memories' },
  { id: 'default', label: 'Other' },
];

function BackpackTable({ bag, catalogById, prices, category }) {
  const rows = useMemo(() => {
    let list = bag;
    if (category) list = list.filter((r) => classifyItemType(catalogById.get(r.itemId)?.typeCn) === category);
    return [...list].sort((a, b) => (prices[b.itemId]?.price || 0) * b.qty - (prices[a.itemId]?.price || 0) * a.qty);
  }, [bag, catalogById, prices, category]);

  const totalValue = valueOfRows(bag, prices);
  const byCategory = useMemo(() => {
    const totals = { currency: 0, gear: 0, memory: 0, default: 0 };
    for (const r of bag) {
      const cat = classifyItemType(catalogById.get(r.itemId)?.typeCn);
      totals[cat] += (prices[r.itemId]?.price || 0) * r.qty;
    }
    return totals;
  }, [bag, catalogById, prices]);

  return (
    <>
      <div style={{ display: 'flex', gap: 10, padding: '0 24px 16px' }}>
        <div className="glass" style={{ padding: '12px 18px', borderRadius: 'var(--radius-md)' }}>
          <div className="text-[10.5px] font-medium" style={{ color: 'var(--fg-secondary)' }}>
            Total Backpack Value
          </div>
          <div className="text-lg font-black tabular-nums">{totalValue.toFixed(0)}</div>
        </div>
        {CATEGORIES.map((c) => (
          <div key={c.id} className="glass" style={{ padding: '12px 18px', borderRadius: 'var(--radius-md)' }}>
            <div className="text-[10.5px] font-medium" style={{ color: 'var(--fg-secondary)' }}>
              {c.label}
            </div>
            <div className="text-lg font-black tabular-nums">{byCategory[c.id].toFixed(0)}</div>
          </div>
        ))}
      </div>

      <div style={{ flex: 1, overflowY: 'auto', padding: '0 24px 24px' }}>
        {rows.length === 0 && (
          <div className="loot-empty">No items in this category.</div>
        )}
        {rows.length > 0 && (
          <table className="loot-table">
            <thead>
              <tr className="loot-head-row">
                <th style={{ width: 48 }}></th>
                <th>Item</th>
                <th>Type</th>
                <th className="mono">Qty</th>
                <th className="mono">Unit Price</th>
                <th className="mono">Total Value</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => {
                const item = catalogById.get(row.itemId);
                const priceInfo = prices[row.itemId];
                return (
                  <tr key={row.itemId} className="loot-row" style={{ borderLeftColor: 'transparent' }}>
                    <td style={{ width: 48 }}>
                      <ItemIcon item={item} />
                    </td>
                    <td className="name">{item ? item.name : row.itemId}</td>
                    <td className="type">{item ? item.type : ''}</td>
                    <td className="qty mono">{row.qty}</td>
                    <td className="qty mono" style={{ color: 'var(--fg-tertiary)' }}>
                      {priceInfo ? priceInfo.price.toFixed(2) : '—'}
                    </td>
                    <td className="qty mono">{priceInfo ? (priceInfo.price * row.qty).toFixed(1) : '—'}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
    </>
  );
}

export default function ItemsView({ bag, catalogById, prices }) {
  const [tab, setTab] = useState('backpack');
  const [category, setCategory] = useState(null);

  return (
    <div className="glass mx-8 mb-8 flex flex-1 flex-col overflow-hidden" style={{ borderRadius: 'var(--radius-lg)' }}>
      <div className="panel-header" style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
        <div className="tab-group">
          <button type="button" data-active={tab === 'backpack'} onClick={() => setTab('backpack')}>
            Backpack
          </button>
          <button type="button" data-active={tab === 'warehouse'} onClick={() => setTab('warehouse')}>
            Warehouse
          </button>
        </div>
        {tab === 'backpack' && (
          <div className="tab-group">
            <button type="button" data-active={category === null} onClick={() => setCategory(null)}>
              All
            </button>
            {CATEGORIES.map((c) => (
              <button key={c.id} type="button" data-active={category === c.id} onClick={() => setCategory(c.id)}>
                {c.label}
              </button>
            ))}
          </div>
        )}
      </div>

      {tab === 'backpack' ? (
        <div style={{ display: 'flex', flexDirection: 'column', flex: 1, minHeight: 0, paddingTop: 16 }}>
          <BackpackTable bag={bag} catalogById={catalogById} prices={prices} category={category} />
        </div>
      ) : (
        <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 40 }}>
          <div style={{ maxWidth: 360, textAlign: 'center', color: 'var(--fg-muted)', fontSize: 13, lineHeight: 1.6 }}>
            Warehouse contents aren't tracked yet — the game log doesn't report warehouse
            state the way it does the backpack, so this would need real warehouse-log
            research before it could show anything but fake numbers.
          </div>
        </div>
      )}
    </div>
  );
}
