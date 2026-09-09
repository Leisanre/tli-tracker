import { useMemo, useState } from 'react';
import ItemIcon from './ItemIcon.jsx';
import { classifyItemType } from '../utils/itemType.js';

const SORTS = {
  name: (a, b) => a.name.localeCompare(b.name),
  price_desc: (a, b, prices) => (prices[b.id]?.price || -1) - (prices[a.id]?.price || -1),
  price_asc: (a, b, prices) => {
    const pa = prices[a.id]?.price;
    const pb = prices[b.id]?.price;
    if (pa == null && pb == null) return 0;
    if (pa == null) return 1;
    if (pb == null) return -1;
    return pa - pb;
  },
};

const CATEGORIES = [
  { id: 'currency', label: 'Currency' },
  { id: 'memory', label: 'Memories' },
  { id: 'gear', label: 'Gear' },
  { id: 'default', label: 'Materials' },
];

function PriceCell({ item, priceInfo, currencyId, currencyName, onSave }) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState('');

  if (editing) {
    const commit = () => {
      const value = parseFloat(draft);
      if (!Number.isNaN(value) && value >= 0) onSave(item.id, currencyId, value);
      setEditing(false);
    };
    return (
      <input
        autoFocus
        type="number"
        min="0"
        step="0.01"
        defaultValue={priceInfo?.price ?? ''}
        onChange={(e) => setDraft(e.target.value)}
        onBlur={commit}
        onKeyDown={(e) => {
          if (e.key === 'Enter') commit();
          if (e.key === 'Escape') setEditing(false);
        }}
        onClick={(e) => e.stopPropagation()}
        style={{ width: 90, textAlign: 'right', fontSize: 12, padding: '3px 8px' }}
      />
    );
  }

  if (!currencyId) {
    return <span style={{ color: 'var(--fg-muted)' }}>—</span>;
  }

  return (
    <button
      type="button"
      onClick={() => setEditing(true)}
      title="Click to set a manual price"
      className="mono"
      style={{
        background: 'transparent',
        border: 'none',
        padding: '2px 6px',
        fontSize: 13,
        color: priceInfo ? 'var(--fg-primary)' : 'var(--fg-muted)',
        cursor: 'pointer',
      }}
    >
      {priceInfo ? `${priceInfo.price.toFixed(2)} ${currencyName || ''}` : 'Set price'}
      {priceInfo?.sample_size === -1 && (
        <span style={{ marginLeft: 5, fontSize: 9.5, color: 'var(--cyan)', fontWeight: 700 }}>manual</span>
      )}
      {priceInfo?.sample_size === -2 && (
        <span style={{ marginLeft: 5, fontSize: 9.5, color: 'var(--fg-muted)', fontWeight: 700 }}>community</span>
      )}
    </button>
  );
}

export default function PriceDatabaseView({ catalog, prices, currencyId, currencyName, onSetManualPrice }) {
  const [search, setSearch] = useState('');
  const [sortKey, setSortKey] = useState('name');
  const [onlyPriced, setOnlyPriced] = useState(false);
  const [category, setCategory] = useState(null);

  const filtered = useMemo(() => {
    let rows = catalog;
    if (category) rows = rows.filter((i) => classifyItemType(i.typeCn) === category);
    if (search) {
      const q = search.toLowerCase();
      rows = rows.filter((i) => i.name.toLowerCase().includes(q) || i.type.toLowerCase().includes(q));
    }
    if (onlyPriced) rows = rows.filter((i) => prices[i.id]);
    return [...rows].sort((a, b) => SORTS[sortKey](a, b, prices));
  }, [catalog, prices, search, sortKey, onlyPriced, category]);

  const pricedCount = catalog.filter((i) => prices[i.id]).length;

  return (
    <div
      className="glass mx-8 mb-8 flex flex-1 flex-col overflow-hidden"
      style={{ borderRadius: 'var(--radius-lg)' }}
    >
      <div className="flex items-center gap-3 px-6 py-4" style={{ borderBottom: '1px solid var(--border-subtle)' }}>
        <span className="text-xs font-medium" style={{ color: 'var(--fg-tertiary)' }}>
          {pricedCount} / {catalog.length} items priced
        </span>

        <input
          className="ml-auto w-64 rounded-full px-4 py-2 text-xs"
          placeholder="Search item or type..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />

        <select className="rounded-full px-3 py-2 text-xs" value={sortKey} onChange={(e) => setSortKey(e.target.value)}>
          <option value="name">Name</option>
          <option value="price_desc">Price (high-low)</option>
          <option value="price_asc">Price (low-high)</option>
        </select>

        <label className="flex items-center gap-1.5 text-xs" style={{ color: 'var(--fg-tertiary)' }}>
          <input type="checkbox" checked={onlyPriced} onChange={(e) => setOnlyPriced(e.target.checked)} />
          Priced only
        </label>
      </div>

      <div className="tab-group" style={{ margin: '12px 24px 0', width: 'fit-content' }}>
        <button type="button" data-active={category === null} onClick={() => setCategory(null)}>
          All
        </button>
        {CATEGORIES.map((c) => (
          <button key={c.id} type="button" data-active={category === c.id} onClick={() => setCategory(c.id)}>
            {c.label}
          </button>
        ))}
      </div>

      <div className="flex-1 overflow-y-auto px-6 py-3">
        <table className="w-full border-collapse">
          <thead>
            <tr
              className="text-left text-[11px] font-semibold uppercase tracking-wide"
              style={{ borderBottom: '1px solid var(--border-subtle)', color: 'var(--fg-muted)' }}
            >
              <th className="w-10 py-2"></th>
              <th className="py-2">Item</th>
              <th className="py-2">Type</th>
              <th className="py-2 text-right font-mono">Price</th>
              <th className="py-2 text-right font-mono">Samples</th>
              <th className="py-2 text-right font-mono">Updated</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((item) => {
              const priceInfo = prices[item.id];
              return (
                <tr key={item.id} className="loot-row" style={{ borderLeft: 'none' }}>
                  <td className="py-2">
                    <ItemIcon item={item} />
                  </td>
                  <td className="py-2 font-medium name">{item.name}</td>
                  <td className="py-2 type">{item.type}</td>
                  <td className="py-2 text-right">
                    <PriceCell
                      item={item}
                      priceInfo={priceInfo}
                      currencyId={currencyId}
                      currencyName={currencyName}
                      onSave={onSetManualPrice}
                    />
                  </td>
                  <td className="py-2 text-right font-mono text-xs" style={{ color: 'var(--fg-muted)' }}>
                    {priceInfo?.sample_size < 0 ? '—' : (priceInfo?.sample_size ?? '—')}
                  </td>
                  <td className="py-2 text-right font-mono text-xs" style={{ color: 'var(--fg-muted)' }}>
                    {priceInfo ? new Date(priceInfo.updated_at).toLocaleDateString() : '—'}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
        {filtered.length === 0 && (
          <div className="py-8 text-center text-sm" style={{ color: 'var(--fg-muted)' }}>
            No items match.
          </div>
        )}
      </div>
    </div>
  );
}
