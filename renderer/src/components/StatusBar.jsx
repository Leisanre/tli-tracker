export default function StatusBar({ status, currentMap, playerInfo, view, onToggleView, onPickFile, onStop, onResetSession, onOpenSettings }) {
  return (
    <div className="flex items-center gap-5 border-b border-slate-800 bg-slate-900 px-4 py-3">
      <span className="text-sm font-bold tracking-tight text-slate-50">TLI Tracker</span>
      <div className="h-5 w-px bg-slate-800" />

      <div className="flex items-center gap-2 text-sm font-medium text-slate-300">
        <span className="relative flex h-2 w-2">
          {status.watching && (
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-blue-500 opacity-60" />
          )}
          <span className={`relative inline-flex h-2 w-2 rounded-full ${status.watching ? 'bg-blue-500' : 'bg-slate-600'}`} />
        </span>
        {status.watching ? 'Watching' : 'Idle'}
      </div>

      {status.watching ? (
        <button
          className="rounded-md border border-slate-700 bg-slate-800 px-3 py-1.5 text-xs font-medium text-slate-300 hover:bg-slate-700"
          onClick={onStop}
        >
          Stop
        </button>
      ) : (
        <button
          className="rounded-md bg-blue-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-blue-500"
          onClick={onPickFile}
        >
          Choose log file
        </button>
      )}

      {playerInfo && (
        <>
          <div className="h-5 w-px bg-slate-800" />
          <div className="flex items-center gap-2">
            <span className="text-sm font-semibold text-slate-100">{playerInfo.name}</span>
            <span className="text-xs text-slate-500">
              {playerInfo.seasonName}
              {playerInfo.heroName ? ` · ${playerInfo.heroName}` : ''}
              {playerInfo.level ? ` · Lv${playerInfo.level}` : ''}
            </span>
          </div>
        </>
      )}

      <div className="h-5 w-px bg-slate-800" />

      <div className="font-medium text-slate-200">{currentMap ? currentMap.mapName : 'No map'}</div>

      <div className="ml-auto flex items-center gap-2">
        <button
          className={`rounded-md border px-3 py-1.5 text-xs font-medium ${
            view === 'prices'
              ? 'border-blue-600 bg-blue-600 text-white'
              : 'border-slate-700 bg-slate-800 text-slate-300 hover:bg-slate-700'
          }`}
          onClick={onToggleView}
        >
          {view === 'prices' ? 'Overview' : 'Price Database'}
        </button>
        <button
          className="rounded-md border border-slate-700 bg-slate-800 px-3 py-1.5 text-xs font-medium text-slate-300 hover:bg-slate-700"
          onClick={onResetSession}
        >
          Reset Session
        </button>
        <button
          className="rounded-md border border-slate-700 bg-slate-800 px-2.5 py-1.5 text-sm text-slate-300 hover:bg-slate-700"
          onClick={onOpenSettings}
          title="Settings"
        >
          ⚙
        </button>
      </div>
    </div>
  );
}
