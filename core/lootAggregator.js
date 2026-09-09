// Buckets item_pickup (gains) and item_spent (costs, e.g. compasses consumed to open
// a map) into four live groupings — each kind gets its own per-map and session view:
//   - perMap*: resets every time a map_enter event comes in
//   - session*: accumulates for the whole tracking session, never resets
// All are Maps of itemId -> { itemId, qty }, so the UI just reads them and joins the catalog.

// A portal/compass cost is logged while still standing in the map you're leaving, a
// moment before the transition — but it reads better attributed to the map you're about
// to enter. Re-apply recent costs to the new per-map bucket right after a reset.
const REATTACH_WINDOW_MS = 5000;

class LootAggregator {
  constructor() {
    this.perMap = new Map();
    this.session = new Map();
    this.perMapCost = new Map();
    this.sessionCost = new Map();
    this.currentMap = null;
    this.recentCost = []; // {itemId, qty, timestamp}, trimmed to the reattach window
  }

  handleEvent(event) {
    if (event.type === 'map_enter') {
      const now = event.timestamp || Date.now();
      this.currentMap = { zone: event.zone, mapName: event.mapName, enteredAt: now };
      this.perMap = new Map();
      this.perMapCost = new Map();

      const cutoff = now - REATTACH_WINDOW_MS;
      this.recentCost = this.recentCost.filter((c) => c.timestamp >= cutoff);
      for (const cost of this.recentCost) {
        this._addTo(this.perMapCost, cost);
      }
      return;
    }

    if (event.type === 'item_pickup') {
      this._addTo(this.perMap, event);
      this._addTo(this.session, event);
    }

    if (event.type === 'item_spent') {
      this._addTo(this.perMapCost, event);
      this._addTo(this.sessionCost, event);
      this.recentCost.push({ itemId: event.itemId, qty: event.qty, timestamp: event.timestamp || Date.now() });
    }
  }

  _addTo(bucket, event) {
    const existing = bucket.get(event.itemId);
    if (existing) {
      existing.qty += event.qty;
    } else {
      bucket.set(event.itemId, { itemId: event.itemId, qty: event.qty });
    }
  }

  getPerMap() {
    return Array.from(this.perMap.values());
  }

  getSession() {
    return Array.from(this.session.values());
  }

  getPerMapCost() {
    return Array.from(this.perMapCost.values());
  }

  getSessionCost() {
    return Array.from(this.sessionCost.values());
  }

  resetSession() {
    this.session = new Map();
    this.sessionCost = new Map();
  }
}

module.exports = { LootAggregator };
