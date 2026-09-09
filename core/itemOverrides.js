// Persists manual item identifications (unresolved itemId -> chosen catalog id) so the
// user only has to identify a given unknown item once, ever — unlike ETor which re-asks
// every time. Stored in userData, not the repo, since it's user-specific runtime state.
const fs = require('fs');
const path = require('path');

function overridesPath(userDataDir) {
  return path.join(userDataDir, 'itemOverrides.json');
}

function loadOverrides(userDataDir) {
  try {
    return JSON.parse(fs.readFileSync(overridesPath(userDataDir), 'utf8'));
  } catch {
    return {};
  }
}

function saveOverride(userDataDir, rawItemId, catalogId) {
  const overrides = loadOverrides(userDataDir);
  overrides[rawItemId] = catalogId;
  fs.writeFileSync(overridesPath(userDataDir), JSON.stringify(overrides, null, 2));
  return overrides;
}

module.exports = { loadOverrides, saveOverride };
