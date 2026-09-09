// Parses UE_game.log lines into domain events.
// Two shapes handled:
//   map enter : SceneLevelMgr@ OpenMainWorld END! InMainLevelPath = /Game/Art/Maps/<zone>/<mapName>
//   item pickup: ItemChange@ ProtoName=PickItems start ... BagMgr@:Modfy BagItem ... end
// BagMgr lines report an ABSOLUTE stack count per (PageId, SlotId), not a delta —
// so pickup quantity is derived from the change vs the last known count for that slot.

const TIMESTAMP_RE = /^\[(\d{4})\.(\d{2})\.(\d{2})-(\d{2})\.(\d{2})\.(\d{2}):(\d{3})\]/;
const MAP_ENTER_RE = /SceneLevelMgr@ OpenMainWorld END! InMainLevelPath = \/Game\/Art\/Maps\/([^/]+)\/([^\s]+)/;
const MAP_NAME_TAIL_RE = /([^/]+)$/;
const PICK_START_RE = /ItemChange@ ProtoName=PickItems start/;
const PICK_END_RE = /ItemChange@ ProtoName=PickItems end/;
const BAG_MODIFY_RE = /BagMgr@:Modfy BagItem PageId = (\d+) SlotId = (\d+) ConfigBaseId = (\d+) Num = (\d+)/;

const { resolveMapName } = require('./mapCatalog');

function parseTimestamp(line) {
  const m = line.match(TIMESTAMP_RE);
  if (!m) return null;
  const [, y, mo, d, h, mi, s, ms] = m;
  return new Date(Date.UTC(+y, +mo - 1, +d, +h, +mi, +s, +ms)).getTime();
}

class LogParser {
  constructor() {
    // slotKey ("page:slot") -> { itemId, count }
    this.slotState = new Map();
    this.inPickBlock = false;
    this.pendingChanges = [];
    this.pendingTimestamp = null;
  }

  processLine(line) {
    const events = [];
    const timestamp = parseTimestamp(line);

    const mapMatch = line.match(MAP_ENTER_RE);
    if (mapMatch) {
      const rawMapName = mapMatch[2].match(MAP_NAME_TAIL_RE)[1];
      events.push({
        type: 'map_enter',
        zone: mapMatch[1],
        mapName: resolveMapName(rawMapName),
        rawMapName,
        timestamp,
      });
      return events;
    }

    if (PICK_START_RE.test(line)) {
      this.inPickBlock = true;
      this.pendingChanges = [];
      this.pendingTimestamp = timestamp;
      return events;
    }

    if (PICK_END_RE.test(line)) {
      this.inPickBlock = false;
      for (const change of this.pendingChanges) {
        events.push(change);
      }
      this.pendingChanges = [];
      return events;
    }

    const bagMatch = line.match(BAG_MODIFY_RE);
    if (bagMatch) {
      const [, page, slot, itemId, num] = bagMatch;
      const slotKey = `${page}:${slot}`;
      const newCount = parseInt(num, 10);
      const prev = this.slotState.get(slotKey);
      const prevCount = prev && prev.itemId === itemId ? prev.count : 0;
      const delta = newCount - prevCount;

      this.slotState.set(slotKey, { itemId, count: newCount });

      if (delta !== 0) {
        const event = {
          type: delta > 0 ? 'item_pickup' : 'item_spent',
          itemId,
          qty: Math.abs(delta),
          totalAfter: newCount,
          timestamp: this.inPickBlock ? this.pendingTimestamp : timestamp,
        };
        if (this.inPickBlock) {
          this.pendingChanges.push(event);
        } else {
          events.push(event);
        }
      }
      return events;
    }

    return events;
  }

  // Current absolute bag contents, aggregated by item across all slots — this is
  // "Backpack Value" territory (unlike the pickup/cost events, which are deltas).
  getBagSnapshot() {
    const byItem = new Map();
    for (const { itemId, count } of this.slotState.values()) {
      if (count <= 0) continue;
      byItem.set(itemId, (byItem.get(itemId) || 0) + count);
    }
    return Array.from(byItem, ([itemId, qty]) => ({ itemId, qty }));
  }

  processLines(lines) {
    const events = [];
    for (const line of lines) {
      events.push(...this.processLine(line));
    }
    return events;
  }
}

module.exports = { LogParser, parseTimestamp };
