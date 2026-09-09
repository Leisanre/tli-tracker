// Custom title-bar buttons for the frameless window — 20px stroke icons, uniform weight,
// no fills. Sits inside the drag region, so each button is explicitly marked no-drag.
function ControlButton({ onClick, label, hoverColor, children }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      title={label}
      style={{
        WebkitAppRegion: 'no-drag',
        width: 32,
        height: 28,
        padding: 0,
        border: 'none',
        background: 'transparent',
        color: 'var(--fg-tertiary)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        borderRadius: 6,
        transition: 'background 120ms ease, color 120ms ease',
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.background = hoverColor || 'var(--bg-2)';
        e.currentTarget.style.color = hoverColor ? '#fff' : 'var(--fg-primary)';
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.background = 'transparent';
        e.currentTarget.style.color = 'var(--fg-tertiary)';
      }}
    >
      {children}
    </button>
  );
}

export default function WindowControls() {
  return (
    <div style={{ WebkitAppRegion: 'no-drag', display: 'flex', alignItems: 'center', gap: 2 }}>
      <ControlButton label="Minimize" onClick={() => window.tliApi.minimizeWindow()}>
        <svg width="14" height="14" viewBox="0 0 20 20" fill="none">
          <path d="M4 10H16" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
        </svg>
      </ControlButton>
      <ControlButton label="Maximize" onClick={() => window.tliApi.toggleMaximizeWindow()}>
        <svg width="14" height="14" viewBox="0 0 20 20" fill="none">
          <rect x="4.5" y="4.5" width="11" height="11" rx="1.5" stroke="currentColor" strokeWidth="1.6" />
        </svg>
      </ControlButton>
      <ControlButton label="Close" hoverColor="#e5484d" onClick={() => window.tliApi.closeWindow()}>
        <svg width="14" height="14" viewBox="0 0 20 20" fill="none">
          <path d="M5 5L15 15M15 5L5 15" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
        </svg>
      </ControlButton>
    </div>
  );
}
