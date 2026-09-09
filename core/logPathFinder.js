// Auto-detects the TLI UE_game.log across known Steam/standalone install layouts.
const fs = require('fs');
const path = require('path');
const os = require('os');

const CANDIDATE_SUFFIXES = [
  'Torchlight Infinite/UE_Game/Torchlight/Saved/Logs/UE_game.log',
  'Torchlight Infinite/UE_game/TorchLight/Saved/Logs/UE_game.log',
  'Torchlight Infinite Game/UE_game/TorchLight/Saved/Logs/UE_game.log',
];

const STEAM_LIBRARY_ROOTS = ['C:', 'D:', 'E:', 'F:', 'G:'].map(
  (drive) => `${drive}\\SteamLibrary\\steamapps\\common`,
);
STEAM_LIBRARY_ROOTS.push(
  `${os.homedir()}\\.local\\share\\Steam\\steamapps\\common`,
  'C:\\Program Files (x86)\\Steam\\steamapps\\common',
);

function findLogPath() {
  for (const root of STEAM_LIBRARY_ROOTS) {
    for (const suffix of CANDIDATE_SUFFIXES) {
      const candidate = path.join(root, ...suffix.split('/'));
      if (fs.existsSync(candidate)) return candidate;
    }
  }
  return null;
}

module.exports = { findLogPath };
