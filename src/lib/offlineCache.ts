/**
 * Small localStorage-backed cache for "last known good" read data — lets a
 * screen keep showing something real if a fetch fails because the network
 * dropped, instead of going blank. See sales/page.tsx for the reference
 * usage (Kanban board orders/jobs + the incoming draft).
 *
 * Deliberately narrow in scope: this caches API *read* responses so a view
 * survives a dropped connection or a reload while offline. It is not an
 * offline write queue — actions taken while offline (moving a card, saving
 * an order, approving a draft) still require a live network call and fail
 * with a clear error rather than silently queuing for later.
 */
const PREFIX = "flowerp:cache:";

export interface CacheEnvelope<T> {
  data: T;
  /** ISO timestamp of when this snapshot was written, so a caller can show "as of ...". */
  cachedAt: string;
}

/** No-ops on failure (storage disabled, private browsing, quota full, SSR) — caching is a nice-to-have, never something a caller should have to guard against itself. */
export function writeCache<T>(key: string, data: T): void {
  if (typeof window === "undefined") return;
  try {
    const envelope: CacheEnvelope<T> = { data, cachedAt: new Date().toISOString() };
    window.localStorage.setItem(PREFIX + key, JSON.stringify(envelope));
  } catch {
    // Ignored — see doc comment above.
  }
}

/** Returns null if there's nothing cached yet, or storage isn't available/readable. */
export function readCache<T>(key: string): CacheEnvelope<T> | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(PREFIX + key);
    if (!raw) return null;
    return JSON.parse(raw) as CacheEnvelope<T>;
  } catch {
    return null;
  }
}
