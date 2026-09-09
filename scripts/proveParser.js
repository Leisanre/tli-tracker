// Milestone 1 proof: run the parser against the sample log fixture and print events.
const fs = require('fs');
const path = require('path');
const { LogParser } = require('../core/logParser');

const fixturePath = path.join(__dirname, '..', 'tests', 'fixtures', 'sample_log.txt');
const catalogPath = path.join(__dirname, '..', 'data', 'itemCatalog', 'items.json');

const lines = fs.readFileSync(fixturePath, 'utf8').split('\n').filter(Boolean);
const catalog = new Map(JSON.parse(fs.readFileSync(catalogPath, 'utf8')).map((i) => [i.id, i]));

const parser = new LogParser();
const events = parser.processLines(lines);

for (const ev of events) {
  if (ev.type === 'map_enter') {
    console.log(`[MAP ENTER] zone=${ev.zone} map=${ev.mapName}`);
  } else if (ev.type === 'item_pickup') {
    const item = catalog.get(ev.itemId);
    console.log(`[PICKUP] itemId=${ev.itemId} name=${item ? item.name : '???'} qty=${ev.qty} totalAfter=${ev.totalAfter}`);
  }
}

console.log(`\n${events.length} events parsed from ${lines.length} lines.`);
