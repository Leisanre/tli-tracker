export function valueOfRows(rows, prices, keyField = 'itemId') {
  return rows.reduce((sum, r) => sum + (prices[r[keyField]]?.price || 0) * r.qty, 0);
}

// Whether any row in the set has no known price — profit built from these rows
// undercounts (missing items silently contribute 0), so callers should flag it
// rather than presenting the number as final.
export function hasUnpricedRows(rows, prices, keyField = 'itemId') {
  return rows.some((r) => !prices[r[keyField]]);
}

export function efficiency(profit, durationMs) {
  const minutes = durationMs / 60000;
  if (minutes < 0.05) return null;
  return profit / minutes;
}

// The game's Exchange takes a cut on every sale — a "net worth" number that ignores
// this overstates what you'd actually walk away with if you liquidated everything.
export const TRADE_TAX_RATE = 0.125;
export function applyTax(value, taxOn) {
  return taxOn ? value * (1 - TRADE_TAX_RATE) : value;
}

// Highest-value single item in a set of rows — used for "top drop" displays where
// showing every item would be noise; qty is folded into the value, not shown alone,
// since 200 cheap Flame Sand shouldn't outrank 1 expensive item.
// Time actually spent inside a farming zone this session — excludes hideout runs,
// so "FE/hour, active map time" doesn't get diluted by time spent browsing menus.
export function activeMapMs(runs, now) {
  return runs
    .filter((r) => !r.map_name?.startsWith('Hideout'))
    .reduce((sum, r) => sum + ((r.exited_at || now) - r.entered_at), 0);
}

// Average of past sessions' profit/duration — the baseline "session delta" badges
// compare the current session against. Excludes the in-progress session (ended_at
// is null) since it isn't a finished data point yet.
export function pastSessionAverages(sessions) {
  const finished = sessions.filter((s) => s.ended_at !== null);
  if (finished.length === 0) return null;
  const sum = finished.reduce(
    (acc, s) => {
      acc.profit += s.picked_value - s.cost_value;
      acc.duration += s.ended_at - s.started_at;
      return acc;
    },
    { profit: 0, duration: 0 },
  );
  return { avgProfit: sum.profit / finished.length, avgDurationMs: sum.duration / finished.length };
}

export function topDropOf(rows, prices, keyField = 'itemId') {
  let best = null;
  let bestValue = -Infinity;
  for (const r of rows) {
    const value = (prices[r[keyField]]?.price || 0) * r.qty;
    if (value > bestValue) {
      bestValue = value;
      best = r;
    }
  }
  return best ? { itemId: best[keyField], value: bestValue } : null;
}
