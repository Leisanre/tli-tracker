import { useEffect, useRef, useState } from 'react';
import { playDropPing } from '../utils/sound.js';

// Watches the live event feed for pickups whose computed value crosses the alert
// threshold. `events` is prepended (newest first) by useTrackerState, and priming
// on startup never emits historical pickups as 'log:event' — so every item_pickup
// seen here is a genuinely new, real-time drop, safe to alert on unconditionally.
export function useDropAlerts(events, prices, catalogById, threshold, enabled) {
  const [flash, setFlash] = useState(null); // { item, value } | null
  const lastSeenRef = useRef(null);

  useEffect(() => {
    if (!enabled) return;
    const latest = events[0];
    if (!latest || latest === lastSeenRef.current) return;
    lastSeenRef.current = latest;
    if (latest.type !== 'item_pickup') return;

    const priceInfo = prices[latest.itemId];
    if (!priceInfo) return; // no known price — nothing to compare against the threshold
    const value = priceInfo.price * latest.qty;
    if (value < threshold) return;

    const item = catalogById.get(latest.itemId);
    setFlash({ item, itemId: latest.itemId, value });
    playDropPing();
    const t = setTimeout(() => setFlash(null), 2200);
    return () => clearTimeout(t);
  }, [events, prices, catalogById, threshold, enabled]);

  return flash;
}
