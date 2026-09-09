// Classifies the catalog's raw Chinese type string into the loot-filter buckets we
// color-code (currency / gear / memory / default). Primary source: an explicit lookup
// table covering all known types from the catalog — precise, not fuzzy substring guessing.
import typeBuckets from '../../../data/itemCatalog/typeBuckets.json';

// Keyword fallback only for a type string the catalog hasn't seen before (e.g. a new
// season's items before we've re-scraped and classified them).
const CURRENCY_HINTS = ['货币', '材料', '代币', '灵砂', '碎片', '结晶'];
const GEAR_HINTS = ['装备', '武器', '防具', '饰品', '宝物', '戒指', '项链'];
const MEMORY_HINTS = ['记忆', '追忆'];

export function classifyItemType(typeCn) {
  if (!typeCn) return 'default';
  if (typeBuckets[typeCn]) return typeBuckets[typeCn];
  if (MEMORY_HINTS.some((h) => typeCn.includes(h))) return 'memory';
  if (GEAR_HINTS.some((h) => typeCn.includes(h))) return 'gear';
  if (CURRENCY_HINTS.some((h) => typeCn.includes(h))) return 'currency';
  return 'default';
}

export function typeColorVar(typeCn) {
  return `var(--type-${classifyItemType(typeCn)})`;
}
