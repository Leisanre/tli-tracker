const fs = require('fs');
const { app, ipcMain, dialog } = require('electron');
const { LogWatcher } = require('../core/logWatcher');
const { LogParser } = require('../core/logParser');
const { findLogPath } = require('../core/logPathFinder');
const { LootAggregator } = require('../core/lootAggregator');
const { loadOverrides, saveOverride } = require('../core/itemOverrides');
const { RunRecorder } = require('../core/runRecorder');
const { parsePlayerFromLines } = require('../core/playerParser');
const { PriceTracker } = require('../core/priceParser');
const communitySync = require('../core/communityPriceSync');
const { getSubmitterId } = require('../core/submitterId');
const { initDb } = require('../data/db');
const { getRunHistory, getRunLoot, getRunCost, closeOrphanRuns, getItemDropStats } = require('../data/runRepository');
const { upsertPrice, getAllPrices } = require('../data/priceRepository');
const { startSession, endSession, getSessions, closeOrphanSessions } = require('../data/sessionRepository');

const PRIME_BYTES = 5 * 1024 * 1024; // scan up to the last 5MB to recover current map + bag state

// On (re)start, the watcher only sees lines appended from here on — it has no idea what
// map you're currently in. Silently replay recent history to rebuild that context (slot
// counts for correct future deltas, and the last map entered) without emitting those old
// pickups as "new" loot into the session totals.
function primeFromExistingLog(parser, priceTracker, logPath) {
  const size = fs.statSync(logPath).size;
  const start = Math.max(0, size - PRIME_BYTES);
  const buffer = Buffer.alloc(size - start);
  const fd = fs.openSync(logPath, 'r');
  fs.readSync(fd, buffer, 0, buffer.length, start);
  fs.closeSync(fd);
  const lines = buffer.toString('utf8').split('\n');

  let lastMapEnter = null;
  const priceEvents = [];
  for (const line of lines) {
    for (const ev of parser.processLine(line)) {
      if (ev.type === 'map_enter') lastMapEnter = ev;
    }
    priceEvents.push(...priceTracker.processLine(line));
  }
  const playerInfo = parsePlayerFromLines(lines);
  return { lastMapEnter, playerInfo, priceEvents };
}

let watcher = null;
let parser = null;
let aggregator = null;
let recorder = null;
let priceTracker = null;
let currentLogPath = null;
let currentSessionId = null;

function applyPriceEvents(mainWindow, events) {
  for (const ev of events) {
    if (!ev.currencyId) continue; // malformed/partial price block — nothing usable to store
    upsertPrice(ev.itemId, ev.currencyId, ev.lowestPrice, ev.sampleSize);
    // The base currency (e.g. Flame Elementium) never gets priced by the market protocol
    // itself — seed its self-price as 1:1 so it values correctly in run/session totals.
    upsertPrice(ev.currencyId, ev.currencyId, 1, 0);
    mainWindow.webContents.send('price:update', ev);
    // Share this real AH check with the community pool — fire-and-forget, never blocks
    // local tracking if offline or rate-limited.
    communitySync.pushPriceCheck(ev.itemId, ev.currencyId, ev.lowestPrice).catch(() => {});
  }
}

function sendLootUpdate(mainWindow) {
  mainWindow.webContents.send('loot:update', {
    currentMap: aggregator.currentMap,
    perMap: aggregator.getPerMap(),
    session: aggregator.getSession(),
    perMapCost: aggregator.getPerMapCost(),
    sessionCost: aggregator.getSessionCost(),
    bag: parser.getBagSnapshot(),
  });
}

// Shared by the manual "Stop Watching" action and the app's shutdown hook — closes out
// the current run/session properly instead of leaving it orphaned for the next launch.
function stopTracking() {
  if (watcher) {
    watcher.stop();
    watcher = null;
  }
  if (recorder) {
    recorder.stop();
    recorder = null;
  }
  if (currentSessionId) endSession(currentSessionId, Date.now());
  currentSessionId = null;
  currentLogPath = null;
}

function registerIpcHandlers(mainWindow) {
  initDb(app.getPath('userData'));
  // Clean up anything left "open" by a previous process that didn't shut down cleanly
  // (crash, force-kill) before this process starts creating its own runs/sessions.
  closeOrphanRuns();
  closeOrphanSessions();

  // Community price sync — pull the aggregated median to fill gaps in the local price
  // table (never overwrites a real local sample or manual override), and push future
  // AH checks up automatically as they happen (see applyPriceEvents below).
  communitySync.init(getSubmitterId(app.getPath('userData')));
  communitySync
    .pullCommunityPrices()
    .then((seeded) => {
      if (seeded > 0) console.log(`[communitySync] Seeded ${seeded} prices from the community.`);
    })
    .catch((err) => console.error('[communitySync] Initial pull failed:', err.message));

  // Custom title bar (frame: false) needs the window chrome buttons wired up manually.
  ipcMain.handle('win:minimize', () => mainWindow.minimize());
  ipcMain.handle('win:toggleMaximize', () => {
    if (mainWindow.isMaximized()) mainWindow.unmaximize();
    else mainWindow.maximize();
  });
  ipcMain.handle('win:close', () => mainWindow.close());

  ipcMain.handle('log:getStatus', () => ({
    watching: !!watcher,
    logPath: currentLogPath,
    autoDetected: findLogPath(),
  }));

  ipcMain.handle('log:start', async (_event, logPath) => {
    if (watcher) watcher.stop();

    parser = new LogParser();
    aggregator = new LootAggregator();
    if (!currentSessionId) currentSessionId = startSession(Date.now());
    recorder = new RunRecorder(currentSessionId);
    priceTracker = new PriceTracker();

    const { lastMapEnter, playerInfo, priceEvents } = primeFromExistingLog(parser, priceTracker, logPath);
    applyPriceEvents(mainWindow, priceEvents);
    if (lastMapEnter) {
      aggregator.handleEvent(lastMapEnter);
      recorder.handleEvent(lastMapEnter);
      mainWindow.webContents.send('log:event', lastMapEnter);
      sendLootUpdate(mainWindow);
    }
    if (playerInfo) {
      mainWindow.webContents.send('player:info', playerInfo);
    }

    watcher = new LogWatcher(logPath, (line) => {
      const events = parser.processLine(line);
      for (const ev of events) {
        aggregator.handleEvent(ev);
        recorder.handleEvent(ev);
        mainWindow.webContents.send('log:event', ev);
        sendLootUpdate(mainWindow);
      }
      applyPriceEvents(mainWindow, priceTracker.processLine(line));
    });

    await watcher.start();
    currentLogPath = logPath;
    return { watching: true, logPath };
  });

  ipcMain.handle('log:stop', () => {
    stopTracking();
    return { watching: false };
  });

  // A real, user-initiated export of your own tracked data — full session/run history
  // plus your local price table — as a plain JSON file you choose the destination for.
  ipcMain.handle('data:exportAll', async () => {
    const result = await dialog.showSaveDialog(mainWindow, {
      title: 'Export Tracker Data',
      defaultPath: `tli-tracker-export-${new Date().toISOString().slice(0, 10)}.json`,
      filters: [{ name: 'JSON', extensions: ['json'] }],
    });
    if (result.canceled || !result.filePath) return { ok: false };
    const payload = {
      exportedAt: Date.now(),
      sessions: getSessions(1000),
      runs: getRunHistory(5000, null),
      prices: getAllPrices(),
    };
    fs.writeFileSync(result.filePath, JSON.stringify(payload, null, 2), 'utf8');
    return { ok: true, path: result.filePath };
  });

  ipcMain.handle('history:getRuns', (_event, limit, sessionId) => getRunHistory(limit, sessionId));
  ipcMain.handle('history:getItemDropStats', (_event, itemId, sessionId) => getItemDropStats(itemId, sessionId));
  ipcMain.handle('history:getRunLoot', (_event, runId) => getRunLoot(runId));
  ipcMain.handle('history:getRunCost', (_event, runId) => getRunCost(runId));
  ipcMain.handle('history:getSessions', (_event, limit) => getSessions(limit));

  ipcMain.handle('price:getAll', () => getAllPrices());

  // Manual override for when a market price has moved since the last in-game check —
  // sample_size -1 is a sentinel marking it as player-entered, not a real AH sample,
  // so the UI can label it distinctly from a genuine price check.
  ipcMain.handle('price:setManual', (_event, itemId, currencyId, price) => {
    upsertPrice(itemId, currencyId, price, -1);
    const payload = { itemId, currencyId, lowestPrice: price, sampleSize: -1 };
    mainWindow.webContents.send('price:update', payload);
    return payload;
  });

  ipcMain.handle('loot:resetSession', () => {
    if (aggregator) aggregator.resetSession();
    // Reset means a fresh session boundary, not just clearing the live view — close the
    // current session's window and open a new one so it's independently browsable later.
    const now = Date.now();
    endSession(currentSessionId, now);
    currentSessionId = startSession(now);
    if (recorder) recorder.setSessionId(currentSessionId);
    return currentSessionId;
  });

  ipcMain.handle('catalog:getOverrides', () => loadOverrides(app.getPath('userData')));

  ipcMain.handle('catalog:identifyItem', (_event, rawItemId, catalogId) =>
    saveOverride(app.getPath('userData'), rawItemId, catalogId),
  );
}

function isWatching() {
  return !!watcher;
}

module.exports = { registerIpcHandlers, stopTracking, isWatching };
