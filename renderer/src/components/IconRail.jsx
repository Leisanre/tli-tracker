// 20px stroke icons, uniform 1.7 weight, no fills — matches the rest of the app's
// restrained accent use instead of mismatched emoji glyphs.
const ICONS = {
  overview: (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
      <rect x="2.5" y="2.5" width="6.5" height="6.5" rx="1.4" stroke="currentColor" strokeWidth="1.7" />
      <rect x="11" y="2.5" width="6.5" height="6.5" rx="1.4" stroke="currentColor" strokeWidth="1.7" />
      <rect x="2.5" y="11" width="6.5" height="6.5" rx="1.4" stroke="currentColor" strokeWidth="1.7" />
      <rect x="11" y="11" width="6.5" height="6.5" rx="1.4" stroke="currentColor" strokeWidth="1.7" />
    </svg>
  ),
  items: (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
      <path
        d="M3 7.5 10 3.5l7 4v8.5a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V7.5Z"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinejoin="round"
      />
      <path d="M3 7.5 10 11.5l7-4" stroke="currentColor" strokeWidth="1.7" strokeLinejoin="round" />
      <path d="M10 11.5V17" stroke="currentColor" strokeWidth="1.7" />
    </svg>
  ),
  prices: (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
      <path
        d="M10 2.5v15M13.5 5.5c0-1.4-1.6-2.3-3.5-2.3-2.2 0-4 1-4 2.9 0 3.6 7.5 1.9 7.5 5.7 0 1.9-1.9 2.9-4 2.9-1.9 0-3.5-.9-3.5-2.3"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinecap="round"
      />
    </svg>
  ),
  history: (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
      <circle cx="10" cy="10.5" r="6.8" stroke="currentColor" strokeWidth="1.7" />
      <path d="M10 6.8v3.9l2.8 1.8" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M6.5 2.6 4 4.4M13.5 2.6 16 4.4" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
    </svg>
  ),
  settings: (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
      <circle cx="10" cy="10" r="2.6" stroke="currentColor" strokeWidth="1.7" />
      <path
        d="M10 3v1.6M10 15.4V17M17 10h-1.6M4.6 10H3M15.07 4.93l-1.13 1.13M6.06 13.93l-1.13 1.13M15.07 15.07l-1.13-1.13M6.06 6.06 4.93 4.93"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinecap="round"
      />
    </svg>
  ),
};

function RailButton({ icon, active, onClick, title }) {
  return (
    <button
      onClick={onClick}
      title={title}
      className={`rail-btn flex items-center justify-center rounded-2xl transition-colors ${
        active ? '' : 'hover:bg-white/10'
      }`}
      style={active ? { background: 'var(--pink-gradient)', color: '#160f2b' } : { color: 'var(--fg-tertiary)' }}
    >
      {icon}
    </button>
  );
}

// Strictly app-level navigation (Overview / Price Database / Settings) — in-game
// session actions like Reset live on the dashboard itself, where the player's eyes
// already are during a farming loop, not buried behind a rail icon.
export default function IconRail({ view, onSetView, watching, onOpenSettings, playerInfo }) {
  return (
    <div
      className="icon-rail relative z-[1] flex flex-shrink-0 flex-col items-center"
      style={{ background: 'rgba(255,255,255,0.03)', backdropFilter: 'blur(18px)' }}
    >
      <div className="flex flex-col items-center gap-3 pt-5">
        <div
          className="mb-4 flex h-9 w-9 items-center justify-center rounded-xl text-sm font-bold"
          style={{ background: 'var(--pink-gradient)', color: '#160f2b', fontFamily: 'var(--font-display)' }}
        >
          T
        </div>

        <RailButton icon={ICONS.overview} active={view === 'overview'} onClick={() => onSetView('overview')} title="Overview" />
        <RailButton icon={ICONS.items} active={view === 'items'} onClick={() => onSetView('items')} title="Items" />
        <RailButton icon={ICONS.prices} active={view === 'prices'} onClick={() => onSetView('prices')} title="Price Database" />
        <RailButton icon={ICONS.history} active={view === 'history'} onClick={() => onSetView('history')} title="History" />
        <RailButton icon={ICONS.settings} active={false} onClick={onOpenSettings} title="Settings" />
      </div>

      {/* Dedicated footer, locked to the base of the rail — not margin-pushed loose icons */}
      <div
        className="mt-auto flex w-full flex-shrink-0 flex-col items-center gap-2.5 py-4"
        style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }}
      >
        <span
          className={`h-2 w-2 rounded-full ${watching ? 'bg-emerald-400' : 'bg-slate-600'}`}
          title={watching ? 'Watching' : 'Idle'}
        />
        {playerInfo && (
          <div
            className="flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-br from-blue-400 to-indigo-500 text-xs font-bold text-white"
            title={playerInfo.name}
          >
            {playerInfo.name.slice(0, 1).toUpperCase()}
          </div>
        )}
      </div>
    </div>
  );
}
