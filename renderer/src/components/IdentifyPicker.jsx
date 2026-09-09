import { useState } from 'react';
import ItemIcon from './ItemIcon.jsx';

export default function IdentifyPicker({ itemCatalog, onPick, onClose }) {
  const [search, setSearch] = useState('');

  const matches =
    search.length < 2
      ? []
      : itemCatalog.filter((i) => i.name.toLowerCase().includes(search.toLowerCase())).slice(0, 8);

  return (
    <div
      className="dropdown-in"
      style={{
        position: 'absolute',
        zIndex: 10,
        background: 'var(--bg-3)',
        border: '1px solid var(--border-strong)',
        borderRadius: 'var(--radius-md)',
        padding: 'var(--sp-2)',
        width: 260,
        boxShadow: '0 4px 12px rgba(0,0,0,0.4)',
      }}
    >
      <input
        autoFocus
        placeholder="Search catalog to identify..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        style={{ width: '100%', marginBottom: 'var(--sp-2)' }}
      />
      {matches.map((item) => (
        <div
          key={item.id}
          onClick={() => onPick(item.id)}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 'var(--sp-2)',
            padding: 4,
            cursor: 'pointer',
            borderRadius: 'var(--radius-sm)',
            transition: 'background 150ms var(--ease)',
          }}
          onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--bg-2)')}
          onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
        >
          <ItemIcon item={item} size={20} />
          <span style={{ fontSize: 12 }}>{item.name}</span>
        </div>
      ))}
      {search.length >= 2 && matches.length === 0 && (
        <div style={{ fontSize: 12, color: 'var(--fg-muted)', padding: 4 }}>No matches.</div>
      )}
      <button style={{ width: '100%', marginTop: 'var(--sp-2)' }} onClick={onClose}>
        Cancel
      </button>
    </div>
  );
}
