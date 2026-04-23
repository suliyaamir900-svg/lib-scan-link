// Stable, anonymous browser fingerprint for review rate-limiting.
// Not a tracking ID — just a per-device hash that survives reloads.
// Stored in localStorage so it's stable across sessions on the same device.

const KEY = 'libscan_review_fp_v1';

function randomId(): string {
  // crypto.randomUUID is widely available; fall back to a hand-rolled id.
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
    return crypto.randomUUID();
  }
  return 'fp_' + Math.random().toString(36).slice(2) + Date.now().toString(36);
}

export function getDeviceFingerprint(): string {
  try {
    const existing = localStorage.getItem(KEY);
    if (existing) return existing;
    const id = randomId();
    localStorage.setItem(KEY, id);
    return id;
  } catch {
    // localStorage blocked (private mode, etc.) — return ephemeral id.
    return randomId();
  }
}
