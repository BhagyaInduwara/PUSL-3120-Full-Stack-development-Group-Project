/**
 * Types and interfaces for the FlowERP offline caching engine.
 */

export interface CacheEnvelope<T> {
  data: T;
  /** Timestamp in milliseconds (Date.now()) when the snapshot was written. */
  cachedAt: number;
  /** Storage key associated with this envelope. */
  key: string;
}

export interface FetchWithCacheOptions extends RequestInit {
  /**
   * Explicit cache key. Defaults to normalized URL if not specified.
   */
  cacheKey?: string;

  /**
   * If true, ignores existing cache and forces a live network fetch.
   */
  forceRefresh?: boolean;

  /**
   * Maximum acceptable cache age in milliseconds.
   * If the cached data is older than ttlMs, a network refresh is preferred.
   */
  ttlMs?: number;
}

export interface FetchWithCacheResult<T> {
  /** The retrieved data payload. */
  data: T;
  /** Whether the returned payload came from client-side localStorage. */
  isFromCache: boolean;
  /** Timestamp in ms when the data was saved to cache (if served from cache). */
  cachedAt?: number;
}
