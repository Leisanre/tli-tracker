// SQLite storage for runs (map visits) and their loot, so history survives restarts.
// Lives in Electron's userData dir — one file per install, not part of the repo.
const path = require('path');
const Database = require('better-sqlite3');

let db = null;

function initDb(userDataDir) {
  if (db) return db;

  db = new Database(path.join(userDataDir, 'tracker.db'));
  db.pragma('journal_mode = WAL');

  db.exec(`
    CREATE TABLE IF NOT EXISTS sessions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      started_at INTEGER NOT NULL,
      ended_at INTEGER
    );

    CREATE TABLE IF NOT EXISTS runs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      session_id INTEGER REFERENCES sessions(id),
      map_name TEXT NOT NULL,
      zone TEXT,
      entered_at INTEGER NOT NULL,
      exited_at INTEGER
    );

    CREATE TABLE IF NOT EXISTS run_loot (
      run_id INTEGER NOT NULL REFERENCES runs(id),
      item_id TEXT NOT NULL,
      qty INTEGER NOT NULL,
      PRIMARY KEY (run_id, item_id)
    );

    CREATE TABLE IF NOT EXISTS run_cost (
      run_id INTEGER NOT NULL REFERENCES runs(id),
      item_id TEXT NOT NULL,
      qty INTEGER NOT NULL,
      PRIMARY KEY (run_id, item_id)
    );

    CREATE TABLE IF NOT EXISTS item_prices (
      item_id TEXT PRIMARY KEY,
      currency_id TEXT NOT NULL,
      price REAL NOT NULL,
      sample_size INTEGER NOT NULL,
      updated_at INTEGER NOT NULL
    );
  `);

  // Migration: runs table may already exist from before session_id existed.
  const columns = db.prepare('PRAGMA table_info(runs)').all();
  if (!columns.some((c) => c.name === 'session_id')) {
    db.exec('ALTER TABLE runs ADD COLUMN session_id INTEGER REFERENCES sessions(id)');
  }

  return db;
}

function getDb() {
  if (!db) throw new Error('DB not initialized — call initDb first');
  return db;
}

module.exports = { initDb, getDb };
