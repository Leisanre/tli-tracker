import { useState } from 'react';
import ItemIcon from './ItemIcon.jsx';

// A search over your tracked history, not the current run — type an item name to see
// how many times it's actually dropped across the session, backed by a real SQL
// aggregate (data/runRepository.getItemDropStats), not a client-side scan.
export default function ItemInspector({ catalogList, sessionId }) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [result, setResult] = useState(null); // { item, totalQty, mapCount } | 'loading' | null

  const matches = search.length < 2 ? [] : catalogList.filter((i) => i.name.toLowerCase().includes(search.toLowerCase())).slice(0, 6);

  const inspect = async (item) => {
    setResult('loading');
    setSearch(item.name);
    const stats = await window.tliApi.getItemDropStats(item.id, sessionId);
    setResult({ item, ...stats });
  };

  return (
    <div style={{ position: 'relative' }}>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        title="Search how many times an item has dropped"
        style={{ display: 'flex', alignItems: 'center', gap: 6 }}
      >
        <svg width="13" height="13" viewBox="0 0 20 20" fill="none">
          <circle cx="8.5" cy="8.5" r="5.5" stroke="currentColor" strokeWidth="1.6" />
          <path d="M16 16L12.5 12.5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
        </svg>
        Inspector
      </button>

      {open && (
        <div
          className="glass dropdown-in"
          style={{
            position: 'absolute',
            top: '110%',
            right: 0,
            zIndex: 10,
            width: 280,
            padding: 12,
            borderRadius: 'var(--radius-md)',
          }}
        >
          <input
            autoFocus
            placeholder="Item name…"
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setResult(null);
            }}
            style={{ width: '100%', marginBottom: 8 }}
          />

          {!result &&
            matches.map((item) => (
              <div
                key={item.id}
                onClick={() => inspect(item)}
                style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '5px 4px', cursor: 'pointer', borderRadius: 'var(--radius-sm)' }}
                onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--bg-2)')}
                onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
              >
                <ItemIcon item={item} size={20} />
                <span style={{ fontSize: 12 }}>{item.name}</span>
              </div>
            ))}

          {result === 'loading' && (
            <div style={{ fontSize: 12, color: 'var(--fg-muted)', padding: '6px 4px' }}>Searching…</div>
          )}

          {result && result !== 'loading' && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 4px' }}>
              <ItemIcon item={result.item} size={30} />
              <div>
                <div style={{ fontSize: 12.5, fontWeight: 600 }}>{result.item.name}</div>
                <div className="mono" style={{ fontSize: 11.5, color: 'var(--cyan)' }}>
                  {result.totalQty} dropped · {result.mapCount} map{result.mapCount === 1 ? '' : 's'}
                  {sessionId ? '' : ' (all time)'}
                </div>
              </div>
            </div>
          )}

          {search.length >= 2 && matches.length === 0 && !result && (
            <div style={{ fontSize: 12, color: 'var(--fg-muted)', padding: '6px 4px' }}>No matches.</div>
          )}
        </div>
      )}
    </div>
  );
}
