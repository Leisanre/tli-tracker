// Extracts player identity (IGN, season, class, level) from the game log — same
// "+player+Field [value]" block format the pickup/map parsers already handle,
// just a different set of fields. Ported from TITrack's player_parser.py.
const PATTERNS = {
  name: [/\+player\+Name\s*\[([^\]]+)\]/, /^\|\s{6}\+Name\s*\[([^\]]+)\]/],
  level: [/\+player\+Level\s*\[(\d+)\]/, /^\|\s{6}\+Level\s*\[(\d+)\]/],
  seasonId: [/\+player\+SeasonId\s*\[(\d+)\]/, /^\|\s{6}\+SeasonId\s*\[(\d+)\]/],
  heroId: [/\+player\+HeroId\s*\[(\d+)\]/, /^\|\s{6}\+HeroId\s*\[(\d+)\]/],
  playerId: [/\+player\+PlayerId\s*\[([^\]]+)\]/, /^\|\s{6}\+PlayerId\s*\[([^\]]+)\]/],
};

const SEASON_NAMES = {
  1: 'Permanent Server',
  1301: 'SS11 Vorax',
  1401: 'SS12 Lunaria',
  1501: 'SS13 Afterlight',
};

const HERO_NAMES = {
  1100: 'Rehan',
  1200: 'Carino',
  1300: 'Gemma',
  1400: 'Youga',
  1500: 'Moto',
  1600: 'Iris',
  1700: 'Thea',
  1800: 'Erika',
  1900: 'Bing',
  2000: 'Oracle',
  2100: 'Leonel',
  2200: 'Cateye',
  2300: 'Sage',
  2400: 'Selina',
};

function parsePlayerLine(line, result) {
  for (const [field, [primary, alt]] of Object.entries(PATTERNS)) {
    if (result[field] !== undefined) continue;
    const match = line.match(primary) || line.match(alt);
    if (match) {
      result[field] = field === 'level' || field === 'seasonId' || field === 'heroId' ? Number(match[1]) : match[1];
    }
  }
  return result;
}

function toPlayerInfo(result) {
  if (!result.name || !result.seasonId) return null;
  return {
    name: result.name,
    level: result.level || 0,
    seasonId: result.seasonId,
    seasonName: SEASON_NAMES[result.seasonId] || `Season ${result.seasonId}`,
    heroId: result.heroId || 0,
    heroName: HERO_NAMES[result.heroId] || (result.heroId ? `Hero ${result.heroId}` : null),
    playerId: result.playerId || null,
  };
}

// Scans a chunk of already-read log lines (most recent first) for player identity.
function parsePlayerFromLines(lines) {
  const result = {};
  for (let i = lines.length - 1; i >= 0; i--) {
    parsePlayerLine(lines[i], result);
    if (result.name && result.seasonId && result.playerId) break;
  }
  return toPlayerInfo(result);
}

module.exports = { parsePlayerLine, parsePlayerFromLines, toPlayerInfo, SEASON_NAMES, HERO_NAMES };
