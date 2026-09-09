// Tails a log file: starts at end of file (or start, if fromBeginning), emits new lines
// as they're appended, and re-attaches on file rotation (rename).
const fs = require('fs');
const fsPromises = fs.promises;
const readline = require('readline');

const POLL_INTERVAL_MS = 250;
const MAX_READ_BYTES = 512 * 1024;

class LogWatcher {
  constructor(logPath, onLine, { fromBeginning = false } = {}) {
    this.logPath = logPath;
    this.onLine = onLine;
    this.fromBeginning = fromBeginning;
    this.lastPosition = 0;
    this.watcher = null;
    this.pollTimer = null;
    this.hasPendingChange = false;
    this.isReading = false;
    this.running = false;
  }

  async start() {
    const stats = await fsPromises.stat(this.logPath);
    this.lastPosition = this.fromBeginning ? 0 : stats.size;
    this.running = true;

    this.watcher = fs.watch(this.logPath, { persistent: true }, (eventType) => {
      if (eventType === 'change') {
        this.hasPendingChange = true;
      } else if (eventType === 'rename') {
        this._handleRotation();
      }
    });
    this.watcher.on('error', (err) => {
      console.error('[logWatcher] watch error:', err);
      this.stop();
    });

    this.pollTimer = setInterval(() => this._poll(), POLL_INTERVAL_MS);
  }

  stop() {
    if (this.watcher) {
      this.watcher.close();
      this.watcher = null;
    }
    if (this.pollTimer) {
      clearInterval(this.pollTimer);
      this.pollTimer = null;
    }
    this.running = false;
  }

  async _poll() {
    if (!this.hasPendingChange || this.isReading) return;
    this.hasPendingChange = false;
    this.isReading = true;

    try {
      const stats = await fsPromises.stat(this.logPath);
      if (stats.size <= this.lastPosition) {
        this.isReading = false;
        return;
      }

      const bytesToRead = Math.min(stats.size - this.lastPosition, MAX_READ_BYTES);
      const endPosition = this.lastPosition + bytesToRead;

      const stream = fs.createReadStream(this.logPath, {
        start: this.lastPosition,
        end: endPosition - 1,
        encoding: 'utf8',
      });
      const rl = readline.createInterface({ input: stream, crlfDelay: Infinity });

      rl.on('line', (line) => {
        if (line) this.onLine(line);
      });

      rl.on('close', () => {
        this.lastPosition = endPosition;
        this.isReading = false;
        if (endPosition < stats.size) this.hasPendingChange = true;
      });
    } catch (err) {
      console.error('[logWatcher] poll error:', err);
      this.isReading = false;
    }
  }

  async _handleRotation() {
    if (this.watcher) {
      this.watcher.close();
      this.watcher = null;
    }
    for (let i = 0; i < 5; i++) {
      try {
        await fsPromises.access(this.logPath, fs.constants.F_OK);
        this.lastPosition = 0;
        setTimeout(() => this.start(), 0);
        return;
      } catch {
        await new Promise((r) => setTimeout(r, 200));
      }
    }
    console.error('[logWatcher] log file did not reappear after rotation');
    this.stop();
  }
}

module.exports = { LogWatcher };
