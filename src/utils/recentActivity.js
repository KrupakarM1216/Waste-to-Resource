/**
 * Client-side "Recent Activity" persistence — last 5 entries per type,
 * stored in localStorage. No backend involved.
 *
 * Types used: 'match' (waste descriptions) and 'valuation' (scrap photos).
 */
const STORAGE_KEY = 'ecosync_recent_activity';
const MAX_ENTRIES = 5;

function readAll() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    const parsed = raw ? JSON.parse(raw) : {};
    return typeof parsed === 'object' && parsed !== null ? parsed : {};
  } catch {
    return {};
  }
}

/** Get the recent entries for a type, newest first. */
export function getRecent(type) {
  const all = readAll();
  return Array.isArray(all[type]) ? all[type] : [];
}

/** Prepend an entry (adds a timestamp) and return the updated list. */
export function addRecent(type, entry) {
  const all = readAll();
  const list = Array.isArray(all[type]) ? all[type] : [];
  const updated = [{ ...entry, ts: Date.now() }, ...list].slice(0, MAX_ENTRIES);
  all[type] = updated;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(all));
  } catch {
    // Storage full or blocked (private mode) — fail silently, list still returns.
  }
  return updated;
}

/** Human-friendly relative time, e.g. "3 min ago". */
export function timeAgo(ts) {
  const seconds = Math.floor((Date.now() - ts) / 1000);
  if (seconds < 60) return 'just now';
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes} min ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} hr ago`;
  const days = Math.floor(hours / 24);
  return `${days} day${days > 1 ? 's' : ''} ago`;
}
