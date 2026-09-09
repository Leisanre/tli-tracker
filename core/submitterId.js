// A random per-install ID, generated once and persisted — not tied to identity, just
// an anti-flood token the Supabase rate-limit trigger keys off of.
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

function getSubmitterId(userDataDir) {
  const filePath = path.join(userDataDir, 'submitter-id.txt');
  try {
    const existing = fs.readFileSync(filePath, 'utf8').trim();
    if (existing) return existing;
  } catch {
    // no file yet
  }
  const id = crypto.randomUUID();
  fs.writeFileSync(filePath, id, 'utf8');
  return id;
}

module.exports = { getSubmitterId };
