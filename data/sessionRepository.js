const { getDb } = require('./db');

function startSession(startedAt) {
  const result = getDb().prepare('INSERT INTO sessions (started_at) VALUES (?)').run(startedAt);
  return result.lastInsertRowid;
}

function endSession(sessionId, endedAt) {
  if (!sessionId) return;
  getDb().prepare('UPDATE sessions SET ended_at = ? WHERE id = ?').run(endedAt, sessionId);
}

// Aggregates each session's run count and picked/cost value in one query — avoids
// fetching every run per session separately (N+1) for a summary list view.
function getSessions(limit = 100) {
  return getDb()
    .prepare(
      `SELECT s.*,
         (SELECT COUNT(*) FROM runs r WHERE r.session_id = s.id) AS map_count,
         COALESCE((SELECT SUM(rl.qty * ip.price) FROM runs r
                   JOIN run_loot rl ON rl.run_id = r.id
                   JOIN item_prices ip ON ip.item_id = rl.item_id
                   WHERE r.session_id = s.id), 0) AS picked_value,
         COALESCE((SELECT SUM(rc.qty * ip.price) FROM runs r
                   JOIN run_cost rc ON rc.run_id = r.id
                   JOIN item_prices ip ON ip.item_id = rc.item_id
                   WHERE r.session_id = s.id), 0) AS cost_value
       FROM sessions s
       ORDER BY s.started_at DESC
       LIMIT ?`,
    )
    .all(limit);
}

// Same problem as closeOrphanRuns: a session left with ended_at NULL from a killed/crashed
// previous process would otherwise show a duration spanning however long the app was closed.
function closeOrphanSessions() {
  getDb().prepare('UPDATE sessions SET ended_at = started_at WHERE ended_at IS NULL').run();
}

module.exports = { startSession, endSession, getSessions, closeOrphanSessions };
