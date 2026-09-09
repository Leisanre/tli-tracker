const { getDb } = require('./db');

function startRun(mapName, zone, enteredAt, sessionId) {
  const result = getDb()
    .prepare('INSERT INTO runs (map_name, zone, entered_at, session_id) VALUES (?, ?, ?, ?)')
    .run(mapName, zone, enteredAt, sessionId);
  return result.lastInsertRowid;
}

function endRun(runId, exitedAt) {
  getDb().prepare('UPDATE runs SET exited_at = ? WHERE id = ?').run(exitedAt, runId);
}

function addLoot(runId, itemId, qty) {
  getDb()
    .prepare(
      `INSERT INTO run_loot (run_id, item_id, qty) VALUES (?, ?, ?)
       ON CONFLICT(run_id, item_id) DO UPDATE SET qty = qty + excluded.qty`,
    )
    .run(runId, itemId, qty);
}

function addCost(runId, itemId, qty) {
  getDb()
    .prepare(
      `INSERT INTO run_cost (run_id, item_id, qty) VALUES (?, ?, ?)
       ON CONFLICT(run_id, item_id) DO UPDATE SET qty = qty + excluded.qty`,
    )
    .run(runId, itemId, qty);
}

// Reassigns a cost entry from one run to another — used when a portal/compass cost was
// logged just before a map transition and belongs on the destination map, not the source.
function moveCost(fromRunId, toRunId, itemId, qty) {
  getDb()
    .prepare('UPDATE run_cost SET qty = qty - ? WHERE run_id = ? AND item_id = ?')
    .run(qty, fromRunId, itemId);
  getDb().prepare('DELETE FROM run_cost WHERE run_id = ? AND item_id = ? AND qty <= 0').run(fromRunId, itemId);
  addCost(toRunId, itemId, qty);
}

function getRunCost(runId) {
  return getDb().prepare('SELECT item_id, qty FROM run_cost WHERE run_id = ?').all(runId);
}

// Computes picked-up/cost value per run in one query (joined against current prices)
// instead of N+1 fetching each run's loot separately for a list view.
function getRunHistory(limit = 100, sessionId = null) {
  const where = sessionId ? 'WHERE r.session_id = ?' : '';
  const params = sessionId ? [sessionId, limit] : [limit];
  return getDb()
    .prepare(
      `SELECT r.*,
         COALESCE((SELECT SUM(rl.qty * ip.price) FROM run_loot rl
                   JOIN item_prices ip ON ip.item_id = rl.item_id
                   WHERE rl.run_id = r.id), 0) AS picked_value,
         COALESCE((SELECT SUM(rc.qty * ip.price) FROM run_cost rc
                   JOIN item_prices ip ON ip.item_id = rc.item_id
                   WHERE rc.run_id = r.id), 0) AS cost_value,
         EXISTS(SELECT 1 FROM run_loot rl
                WHERE rl.run_id = r.id AND rl.item_id NOT IN (SELECT item_id FROM item_prices)) AS has_unpriced_loot,
         (SELECT rl.item_id FROM run_loot rl JOIN item_prices ip ON ip.item_id = rl.item_id
          WHERE rl.run_id = r.id ORDER BY rl.qty * ip.price DESC LIMIT 1) AS top_drop_item_id,
         (SELECT rl.qty * ip.price FROM run_loot rl JOIN item_prices ip ON ip.item_id = rl.item_id
          WHERE rl.run_id = r.id ORDER BY rl.qty * ip.price DESC LIMIT 1) AS top_drop_value
       FROM runs r
       ${where}
       ORDER BY r.entered_at DESC
       LIMIT ?`,
    )
    .all(...params);
}

function getRunLoot(runId) {
  return getDb().prepare('SELECT item_id, qty FROM run_loot WHERE run_id = ?').all(runId);
}

// How many times has this item dropped — across the current session, or all-time
// if sessionId is null. Powers the item inspector search.
function getItemDropStats(itemId, sessionId) {
  const where = sessionId ? 'AND r.session_id = ?' : '';
  const params = sessionId ? [itemId, sessionId] : [itemId];
  return getDb()
    .prepare(
      `SELECT COALESCE(SUM(rl.qty), 0) AS totalQty, COUNT(DISTINCT rl.run_id) AS mapCount
       FROM run_loot rl
       JOIN runs r ON r.id = rl.run_id
       WHERE rl.item_id = ? ${where}`,
    )
    .get(...params);
}

// A run left with exited_at NULL means the app was killed/crashed mid-run rather than
// closed normally — on the next launch its "duration" would otherwise be computed
// against the current time and balloon to however long the app was closed. Close any
// such leftovers from a previous process lifetime (0 duration — we don't actually know
// when they ended) before this process creates any new ones of its own.
function closeOrphanRuns() {
  getDb().prepare('UPDATE runs SET exited_at = entered_at WHERE exited_at IS NULL').run();
}

module.exports = {
  startRun,
  endRun,
  addLoot,
  addCost,
  moveCost,
  getRunHistory,
  getRunLoot,
  getRunCost,
  closeOrphanRuns,
  getItemDropStats,
};
