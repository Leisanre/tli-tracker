// Parses TLI's Auction House price-search protocol out of the game log — a separate
// "SendMessage/RecvMessage STT----Action----SynId" block format from the simpler
// BagMgr/SceneLevelMgr lines the main parser reads. Correlates a price *request*
// (has the item id) with its *response* (has the price ladder) via SynId.
const REQUEST_START_RE = /----Socket SendMessage STT----XchgSearchPrice----SynId = (\d+)/;
const RESPONSE_START_RE = /----Socket RecvMessage STT----XchgSearchPrice----SynId = (\d+)/;
const BLOCK_END_RE = /----Socket (?:SendMessage|RecvMessage) End----/;
const REFER_RE = /\+filters\+1\+refer\s*\[(\d+)\]/;
const CURRENCY_RE = /\+prices\+1\+currency\s*\[(\d+)\]/;
const UNIT_PRICE_RE = /\+(\d+)\s*\[([\d.]+)\]/g;

class PriceTracker {
  constructor() {
    this.pendingKind = null; // 'request' | 'response'
    this.pendingBuffer = [];
    this.pendingSynId = null;
    this.itemIdBySynId = new Map();
  }

  processLine(line) {
    const events = [];

    const reqMatch = line.match(REQUEST_START_RE);
    if (reqMatch) {
      this.pendingKind = 'request';
      this.pendingSynId = reqMatch[1];
      this.pendingBuffer = [];
      return events;
    }

    const resMatch = line.match(RESPONSE_START_RE);
    if (resMatch) {
      this.pendingKind = 'response';
      this.pendingSynId = resMatch[1];
      this.pendingBuffer = [];
      return events;
    }

    if (BLOCK_END_RE.test(line)) {
      const body = this.pendingBuffer.join('\n');

      if (this.pendingKind === 'request') {
        const referMatch = body.match(REFER_RE);
        if (referMatch) this.itemIdBySynId.set(this.pendingSynId, referMatch[1]);
      } else if (this.pendingKind === 'response') {
        const itemId = this.itemIdBySynId.get(this.pendingSynId);
        const currencyMatch = body.match(CURRENCY_RE);
        const prices = [...body.matchAll(UNIT_PRICE_RE)].map((m) => parseFloat(m[2]));
        if (itemId && prices.length > 0) {
          events.push({
            type: 'price_update',
            itemId,
            currencyId: currencyMatch ? currencyMatch[1] : null,
            lowestPrice: Math.min(...prices),
            sampleSize: prices.length,
          });
        }
        this.itemIdBySynId.delete(this.pendingSynId);
      }

      this.pendingKind = null;
      this.pendingSynId = null;
      this.pendingBuffer = [];
      return events;
    }

    if (this.pendingKind) this.pendingBuffer.push(line);
    return events;
  }

  processLines(lines) {
    const events = [];
    for (const line of lines) events.push(...this.processLine(line));
    return events;
  }
}

module.exports = { PriceTracker };
