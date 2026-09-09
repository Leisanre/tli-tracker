import { useState } from 'react';

const PALETTES = [
  { id: 'pink', label: 'Pink / Cyan', colors: ['#ff6ec7', '#66f2d6'] },
  { id: 'steel', label: 'Steel / Pink', colors: ['#5b7c99', '#ff5fa8'] },
  { id: 'red', label: 'Steel / Red', colors: ['#5b7c99', '#e6453f'] },
];

function SectionLabel({ children }) {
  return (
    <div
      style={{
        marginBottom: 'var(--sp-2)',
        fontSize: 11,
        textTransform: 'uppercase',
        letterSpacing: '0.05em',
        color: 'var(--fg-muted)',
        fontWeight: 600,
      }}
    >
      {children}
    </div>
  );
}

function CloseButton({ onClick }) {
  return (
    <button
      onClick={onClick}
      title="Close"
      style={{
        marginLeft: 'auto',
        width: 28,
        height: 28,
        padding: 0,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        borderRadius: '50%',
      }}
      onMouseEnter={(e) => (e.currentTarget.style.transform = 'rotate(90deg) scale(1.08)')}
      onMouseLeave={(e) => (e.currentTarget.style.transform = 'none')}
    >
      <svg width="13" height="13" viewBox="0 0 20 20" fill="none" style={{ transition: 'transform 200ms var(--ease)' }}>
        <path d="M5 5L15 15M15 5L5 15" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
      </svg>
    </button>
  );
}

// Log tracking is a fully automated background service — the app finds and watches
// the game log on its own, and nothing about how it hooks into the game directory is
// ever surfaced here. Settings stays to real, functional preferences only — no
// decorative toggles for features that don't exist (no overlay mode, no manual/auto
// tracking distinction to switch between).
export default function SettingsPanel({ palette, onSetPalette, onClose }) {
  const [exportStatus, setExportStatus] = useState(null); // null | 'saving' | 'saved' | 'cancelled'

  const handleExport = async () => {
    setExportStatus('saving');
    const result = await window.tliApi.exportAllData();
    setExportStatus(result.ok ? 'saved' : 'cancelled');
    setTimeout(() => setExportStatus(null), 2500);
  };

  return (
    <div
      className="modal-backdrop"
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(0,0,0,0.6)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 100,
      }}
      onClick={onClose}
    >
      <div
        className="modal-panel"
        onClick={(e) => e.stopPropagation()}
        style={{
          width: 520,
          background: 'var(--bg-deep)',
          border: '1px solid var(--border-strong)',
          borderRadius: 'var(--radius-lg)',
          padding: 'var(--sp-6)',
          boxShadow: '0 30px 60px -20px rgba(0,0,0,0.6)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', marginBottom: 'var(--sp-5)' }}>
          <h2 style={{ fontSize: 17, margin: 0, fontFamily: 'var(--font-display)' }}>Settings</h2>
          <CloseButton onClick={onClose} />
        </div>

        <SectionLabel>Accent Palette</SectionLabel>
        <div className="tab-group" style={{ width: 'fit-content', marginBottom: 'var(--sp-6)' }}>
          {PALETTES.map((p) => (
            <button
              key={p.id}
              type="button"
              data-active={palette === p.id}
              onClick={() => onSetPalette(p.id)}
              style={{ display: 'flex', alignItems: 'center', gap: 7 }}
            >
              <span style={{ display: 'flex', marginRight: 1 }}>
                {p.colors.map((c, i) => (
                  <span
                    key={i}
                    style={{
                      width: 9,
                      height: 9,
                      borderRadius: '50%',
                      background: c,
                      marginLeft: i > 0 ? -3 : 0,
                      border: '1px solid rgba(0,0,0,0.25)',
                    }}
                  />
                ))}
              </span>
              {p.label}
            </button>
          ))}
        </div>

        <SectionLabel>Your Data</SectionLabel>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <button type="button" onClick={handleExport} disabled={exportStatus === 'saving'}>
            {exportStatus === 'saving' ? 'Saving…' : 'Export Session Data'}
          </button>
          <span style={{ fontSize: 11.5, color: 'var(--fg-tertiary)' }}>
            {exportStatus === 'saved' && 'Saved.'}
            {exportStatus === 'cancelled' && 'Cancelled.'}
            {!exportStatus && 'Every session, run, and price you’ve tracked, as a JSON file you choose the destination for.'}
          </span>
        </div>
      </div>
    </div>
  );
}
