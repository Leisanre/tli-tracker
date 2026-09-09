const { getDb } = require('./db');

function upsertPrice(itemId, currencyId, price, sampleSize) {
  getDb()
    .prepare(
      `INSERT INTO item_prices (item_id, currency_id, price, sample_size, updated_at)
       VALUES (?, ?, ?, ?, ?)
       ON CONFLICT(item_id) DO UPDATE SET
         currency_id = excluded.currency_id,
         price = excluded.price,
         sample_size = excluded.sample_size,
         updated_at = excluded.updated_at`,
    )
    .run(itemId, currencyId, price, sampleSize, Date.now());
}

function getAllPrices() {
  const rows = getDb().prepare('SELECT * FROM item_prices').all();
  return Object.fromEntries(rows.map((r) => [r.item_id, r]));
}

// Seeds a community-median price only if the item has no price yet — must never
// clobber a real local AH sample (sample_size >= 0) or a manual override (-1).
// sample_size -2 marks "from community sync". Returns whether it actually inserted.
function seedCommunityPrice(itemId, currencyId, price) {
  const result = getDb()
    .prepare(
      `INSERT INTO item_prices (item_id, currency_id, price, sample_size, updated_at)
       VALUES (?, ?, ?, -2, ?)
       ON CONFLICT(item_id) DO NOTHING`,
    )
    .run(itemId, currencyId, price, Date.now());
  return result.changes > 0;
}

module.exports = { upsertPrice, getAllPrices, seedCommunityPrice };
