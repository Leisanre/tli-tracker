import { useEffect, useRef, useState } from 'react';

// The base currency (e.g. Flame Elementium) never gets a price entry from the market
// protocol — you can't price FE in units of FE — but it should still value at 1:1
// so it counts toward profit totals instead of showing as "unpriced".
function withCurrencySelfPrice(prices) {
  const currencyId = Object.values(prices)[0]?.currency_id;
  if (!currencyId || prices[currencyId]) return prices;
  return { ...prices, [currencyId]: { item_id: currencyId, currency_id: currencyId, price: 1, sample_size: 0 } };
}

const HISTORY_LIMIT = 20;

// Live item price map (itemId -> {price, currencyId, sampleSize}), sourced from the
// game's own Auction House search protocol — populated as you check prices in-game.
// priceHistory is session-only (in memory, not persisted) — a rolling window of the
// last few checks per item, just enough to drive a sparkline.
export function usePrices() {
  const [prices, setPrices] = useState({});
  const [priceHistory, setPriceHistory] = useState({});
  const historyRef = useRef({});

  useEffect(() => {
    window.tliApi.getAllPrices().then((p) => setPrices(withCurrencySelfPrice(p)));
    return window.tliApi.onPriceUpdate((ev) => {
      setPrices((prev) =>
        withCurrencySelfPrice({
          ...prev,
          [ev.itemId]: { item_id: ev.itemId, currency_id: ev.currencyId, price: ev.lowestPrice, sample_size: ev.sampleSize },
        }),
      );
      const prevHistory = historyRef.current[ev.itemId] || [];
      const nextHistory = [...prevHistory, ev.lowestPrice].slice(-HISTORY_LIMIT);
      historyRef.current = { ...historyRef.current, [ev.itemId]: nextHistory };
      setPriceHistory(historyRef.current);
    });
  }, []);

  return { prices, priceHistory };
}
