// Mirrors live events into the SQLite run history — separate from LootAggregator
// (which is the fast in-memory view the UI reads live). This is the durable copy.
const { startRun, endRun, addLoot, addCost, moveCost } = require('../data/runRepository');

// A portal/compass cost is logged while you're still standing in the map you're leaving
// (e.g. Hideout), a moment before the transition confirms — but it belongs on the map
// you're about to enter, not the one you're leaving. Reattribute costs within this
// window of a map_enter to the new run.
const REATTACH_WINDOW_MS = 5000;

class RunRecorder {
  constructor(sessionId) {
    this.currentRunId = null;
    this.sessionId = sessionId;
    this.pendingCost = []; // costs logged against currentRunId, might belong to the next run
  }

  // Session boundary changed (e.g. user hit "Reset Session") — new runs from here
  // on belong to the new session. A run already in progress keeps its original tag.
  setSessionId(sessionId) {
    this.sessionId = sessionId;
  }

  handleEvent(event) {
    if (event.type === 'map_enter') {
      const previousRunId = this.currentRunId;
      const now = event.timestamp || Date.now();
      if (previousRunId) endRun(previousRunId, now);
      this.currentRunId = startRun(event.mapName, event.zone, now, this.sessionId);

      const cutoff = now - REATTACH_WINDOW_MS;
      for (const cost of this.pendingCost) {
        if (cost.runId === previousRunId && cost.timestamp >= cutoff) {
          moveCost(previousRunId, this.currentRunId, cost.itemId, cost.qty);
        }
      }
      this.pendingCost = [];
      return;
    }

    if (event.type === 'item_pickup' && this.currentRunId) {
      addLoot(this.currentRunId, event.itemId, event.qty);
    }

    if (event.type === 'item_spent' && this.currentRunId) {
      addCost(this.currentRunId, event.itemId, event.qty);
      this.pendingCost.push({
        runId: this.currentRunId,
        itemId: event.itemId,
        qty: event.qty,
        timestamp: event.timestamp || Date.now(),
      });
    }
  }

  stop() {
    if (this.currentRunId) {
      endRun(this.currentRunId, Date.now());
      this.currentRunId = null;
    }
  }
}

module.exports = { RunRecorder };
