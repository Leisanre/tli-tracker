// A tiny synthesized two-tone chime for high-value drop alerts — generated at
// runtime via the Web Audio API, not a bundled audio file (nothing to license,
// nothing to fabricate).
let ctx = null;

function getContext() {
  if (!ctx) ctx = new (window.AudioContext || window.webkitAudioContext)();
  return ctx;
}

function tone(frequency, startTime, duration, gainPeak) {
  const audioCtx = getContext();
  const osc = audioCtx.createOscillator();
  const gain = audioCtx.createGain();
  osc.type = 'sine';
  osc.frequency.value = frequency;
  gain.gain.setValueAtTime(0, startTime);
  gain.gain.linearRampToValueAtTime(gainPeak, startTime + 0.015);
  gain.gain.exponentialRampToValueAtTime(0.0001, startTime + duration);
  osc.connect(gain).connect(audioCtx.destination);
  osc.start(startTime);
  osc.stop(startTime + duration);
}

export function playDropPing() {
  try {
    const audioCtx = getContext();
    if (audioCtx.state === 'suspended') audioCtx.resume();
    const now = audioCtx.currentTime;
    tone(880, now, 0.16, 0.12);
    tone(1318.5, now + 0.09, 0.22, 0.1);
  } catch {
    // Audio can legitimately fail (no output device, autoplay policy) — never let a
    // sound effect break the actual tracking feature.
  }
}
