// Resolves internal TLI zone codenames (e.g. KD_CangBaoDongKu000) to English
// display names (e.g. "Thunder Wastes - Thirsty Mines"), via prefix substring
// match against a catalog scraped from the game's own zone data.
const zoneNames = require('../data/mapCatalog/zones.json');

// Sort longest-key-first so a specific match (with suffix) wins over a shorter
// generic one when both are substrings of the raw codename.
const entries = Object.entries(zoneNames).sort((a, b) => b[0].length - a[0].length);

function resolveMapName(rawMapName) {
  for (const [internalName, englishName] of entries) {
    if (rawMapName.includes(internalName)) return englishName;
  }
  return rawMapName;
}

module.exports = { resolveMapName };
