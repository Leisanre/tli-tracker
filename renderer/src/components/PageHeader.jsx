import WindowControls from './WindowControls.jsx';

const RESET_ICON = (
  <svg width="14" height="14" viewBox="0 0 20 20" fill="none">
    <path
      d="M4 4v4.5h4.5M4 8.5a6 6 0 1 1 1.6 5.5"
      stroke="currentColor"
      strokeWidth="1.7"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

export default function PageHeader({ title, view, status, currentMap, onStop, onResetSession }) {
  return (
    <div
      className="flex items-center gap-4 px-10 pb-3 pt-5"
      style={{
        WebkitAppRegion: 'drag',
        background: 'linear-gradient(180deg, rgba(255,255,255,0.05), rgba(255,255,255,0.015) 80%, transparent)',
        backdropFilter: 'blur(14px)',
      }}
    >
      <h1 className="text-3xl font-black tracking-tight" style={{ fontFamily: 'var(--font-display)' }}>
        {title}
      </h1>

      <div
        className="glass ml-2 flex items-center gap-2 rounded-full px-4 py-1.5"
        style={{ WebkitAppRegion: 'no-drag' }}
      >
        <span
          className="flex h-5 w-5 items-center justify-center rounded-full text-[10px] font-bold"
          style={{ background: 'var(--pink-gradient)', color: '#160f2b' }}
        >
          {status.watching ? '●' : '○'}
        </span>
        <span className="text-sm font-medium" style={{ color: 'var(--fg-secondary)' }}>
          {status.watching ? 'Watching' : 'Idle'}
        </span>
        {currentMap && (
          <>
            <span style={{ width: 1, height: 14, background: 'var(--border)' }} />
            <span className="text-sm font-semibold">{currentMap.mapName}</span>
          </>
        )}
      </div>

      <div className="ml-auto flex items-center gap-3" style={{ WebkitAppRegion: 'no-drag' }}>
        {view === 'overview' && (
          <button
            className="glass flex items-center gap-1.5 rounded-full px-4 py-2 text-sm font-medium"
            style={{ color: 'var(--fg-secondary)' }}
            onClick={onResetSession}
            title="Reset Session"
          >
            {RESET_ICON}
            Reset Session
          </button>
        )}
        {status.watching && (
          <button className="primary rounded-full px-5 py-2 text-sm" onClick={onStop}>
            Stop Watching
          </button>
        )}
        <WindowControls />
      </div>
    </div>
  );
}
