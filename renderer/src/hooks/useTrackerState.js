import { useEffect, useRef, useState } from 'react';

// Central live state for the dashboard: raw event feed, loot buckets, and
// derived session stats (maps run, items looted, elapsed timers).
export function useTrackerState() {
  const [status, setStatus] = useState({ watching: false, logPath: null, autoDetected: null });
  const [events, setEvents] = useState([]);
  const [currentMap, setCurrentMap] = useState(null);
  const [perMap, setPerMap] = useState([]);
  const [session, setSession] = useState([]);
  const [perMapCost, setPerMapCost] = useState([]);
  const [sessionCost, setSessionCost] = useState([]);
  const [bag, setBag] = useState([]);
  const [sessionStats, setSessionStats] = useState({ startedAt: null, mapsRun: 0, totalItemsLooted: 0 });
  const [now, setNow] = useState(Date.now());
  const [playerInfo, setPlayerInfo] = useState(null);

  useEffect(() => {
    // Fully automated: no file picker. Poll for the game log until it's found (it may
    // not exist yet if the game hasn't been installed/launched before this app has),
    // then start watching on its own — the user never has to do anything.
    let cancelled = false;
    let pollTimer = null;

    const checkAndStart = () => {
      window.tliApi.getLogStatus().then((s) => {
        if (cancelled) return;
        setStatus(s);
        if (!s.watching && s.autoDetected) {
          startWatching(s.autoDetected);
        } else if (!s.watching) {
          pollTimer = setTimeout(checkAndStart, 3000);
        }
      });
    };
    checkAndStart();

    const unsubEvent = window.tliApi.onEvent((ev) => {
      setEvents((prev) => [ev, ...prev].slice(0, 100));
      setSessionStats((prev) => {
        if (ev.type === 'map_enter') {
          return {
            startedAt: prev.startedAt || ev.timestamp || Date.now(),
            mapsRun: prev.mapsRun + 1,
            totalItemsLooted: prev.totalItemsLooted,
          };
        }
        if (ev.type === 'item_pickup') {
          return {
            startedAt: prev.startedAt || Date.now(),
            mapsRun: prev.mapsRun,
            totalItemsLooted: prev.totalItemsLooted + ev.qty,
          };
        }
        return prev;
      });
    });

    const unsubLoot = window.tliApi.onLootUpdate((payload) => {
      setCurrentMap(payload.currentMap);
      setPerMap(payload.perMap);
      setSession(payload.session);
      setPerMapCost(payload.perMapCost);
      setSessionCost(payload.sessionCost);
      setBag(payload.bag);
    });

    const unsubPlayer = window.tliApi.onPlayerInfo(setPlayerInfo);

    const tick = setInterval(() => setNow(Date.now()), 1000);

    return () => {
      cancelled = true;
      clearTimeout(pollTimer);
      unsubEvent();
      unsubLoot();
      unsubPlayer();
      clearInterval(tick);
    };
  }, []);

  const startWatching = async (path) => {
    const result = await window.tliApi.startWatching(path);
    setStatus((s) => ({ ...s, ...result }));
    setSessionStats({ startedAt: Date.now(), mapsRun: 0, totalItemsLooted: 0 });
  };

  const stopWatching = async () => {
    const result = await window.tliApi.stopWatching();
    setStatus((s) => ({ ...s, ...result }));
  };

  const resetSession = async () => {
    await window.tliApi.resetSession();
    setSessionStats({ startedAt: Date.now(), mapsRun: 0, totalItemsLooted: 0 });
  };

  return {
    status,
    events,
    currentMap,
    perMap,
    session,
    perMapCost,
    sessionCost,
    bag,
    sessionStats,
    now,
    playerInfo,
    startWatching,
    stopWatching,
    resetSession,
  };
}
