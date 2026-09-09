import { useEffect, useRef, useState } from 'react';
import { valueOfRows } from '../utils/value.js';

// Session value over time — a real (not fabricated) sample series, one point per
// elapsed minute, built from the live loot totals. In-memory only: resets when a
// new session starts, doesn't persist across restarts. Capped so a long session
// doesn't grow this unbounded.
const MAX_SAMPLES = 90;

export function useSessionChart(session, sessionCost, prices, sessionStats, now, currentMap) {
  const samplesRef = useRef([]);
  const lastMinRef = useRef(-1);
  const [, bump] = useState(0);

  useEffect(() => {
    samplesRef.current = [];
    lastMinRef.current = -1;
    bump((t) => t + 1);
  }, [sessionStats.startedAt]);

  useEffect(() => {
    if (!sessionStats.startedAt) return;
    const elapsedMin = Math.floor((now - sessionStats.startedAt) / 60000);
    if (elapsedMin <= lastMinRef.current) return;
    lastMinRef.current = elapsedMin;
    const value = valueOfRows(session, prices) - valueOfRows(sessionCost, prices);
    samplesRef.current = [...samplesRef.current, { min: elapsedMin, value, mapName: currentMap?.mapName || null }].slice(
      -MAX_SAMPLES,
    );
    bump((t) => t + 1);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [now, sessionStats.startedAt]);

  return samplesRef.current;
}
