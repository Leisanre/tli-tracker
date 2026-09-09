// Community price sharing — pushes the player's own in-game AH checks up as anonymous
// submissions, and pulls down the aggregated community median to fill gaps in the
// local price table. Never overwrites a real local AH sample or a manual override
// (see priceRepository.seedCommunityPrice) — community data is strictly a fallback.
const WebSocket = require('ws');
const { createClient } = require('@supabase/supabase-js');
const { SUPABASE_URL, SUPABASE_ANON_KEY } = require('../electron/supabaseConfig');
const { seedCommunityPrice } = require('../data/priceRepository');

let client = null;
let submitterId = null;

// We only ever use REST calls (insert/select), never realtime subscriptions — but
// supabase-js's constructor initializes a Realtime client unconditionally, and
// Electron's bundled Node doesn't expose the native WebSocket it expects. Supplying
// the `ws` package as the transport satisfies that without pulling in realtime
// features we don't use. Wrapped in try/catch so a failure here (this feature is a
// non-critical fallback) can never take down the rest of the app's IPC handlers.
function init(id) {
  try {
    submitterId = id;
    client = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, { realtime: { transport: WebSocket } });
  } catch (err) {
    console.error('[communitySync] init failed, community sync disabled this session:', err.message);
    client = null;
  }
}

// Fire-and-forget — a failed submission (offline, rate-limited, rejected outlier)
// should never interrupt local tracking, so errors are logged, not thrown.
async function pushPriceCheck(itemId, currencyId, price) {
  if (!client) return;
  const { error } = await client
    .from('price_submissions')
    .insert({ item_id: itemId, currency_id: currencyId, price, submitter_id: submitterId });
  if (error) console.error('[communitySync] push failed:', error.message);
}

// Pulls the aggregated median for every item and seeds any that are still unpriced
// locally. Returns how many were actually filled in.
async function pullCommunityPrices() {
  if (!client) return 0;
  const { data, error } = await client.from('community_prices').select('*');
  if (error) {
    console.error('[communitySync] pull failed:', error.message);
    return 0;
  }
  let seeded = 0;
  for (const row of data || []) {
    if (seedCommunityPrice(row.item_id, row.currency_id, row.price)) seeded++;
  }
  return seeded;
}

module.exports = { init, pushPriceCheck, pullCommunityPrices };
