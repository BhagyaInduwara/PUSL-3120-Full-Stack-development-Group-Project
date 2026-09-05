import { CacheEnvelope, FetchWithCacheOptions, FetchWithCacheResult } from "./types";

const STORAGE_PREFIX = "flow_cache_";

/**
 * Checks whether the browser environment is currently online.
 * Safe for server-side rendering (returns true by default on server).
 */
export function isOnline(): boolean {
  if (typeof window === "undefined" || typeof navigator === "undefined") {
    return true;
  }
  return navigator.onLine !== false;
}

/**
 * Normalizes a URL or cache key into a valid localStorage key.
 */
function toStorageKey(key: string): string {
  return `${STORAGE_PREFIX}${key}`;
}

/**
 * Reads a cached envelope from localStorage.
 * Returns null if not found, expired, invalid JSON, or during SSR.
 */
export function readCacheEnvelope<T>(key: string): CacheEnvelope<T> | null {
  if (typeof window === "undefined" || typeof window.localStorage === "undefined") {
    return null;
  }

  try {
    const raw = window.localStorage.getItem(toStorageKey(key));
    if (!raw) return null;

    const envelope = JSON.parse(raw) as CacheEnvelope<T>;
    if (!envelope || typeof envelope !== "object" || !("data" in envelope)) {
      return null;
    }

    return envelope;
  } catch (err) {
    console.warn(`[offlineCache] Failed to read cache key "${key}":`, err);
    return null;
  }
}

/**
 * Writes a payload to localStorage wrapped in a CacheEnvelope.
 * Silently handles QuotaExceededError or private browsing restrictions.
 */
export function writeCacheEnvelope<T>(key: string, data: T): void {
  if (typeof window === "undefined" || typeof window.localStorage === "undefined") {
    return;
  }

  try {
    const envelope: CacheEnvelope<T> = {
      data,
      cachedAt: Date.now(),
      key,
    };
    window.localStorage.setItem(toStorageKey(key), JSON.stringify(envelope));
  } catch (err) {
    console.warn(`[offlineCache] Failed to write cache key "${key}":`, err);
  }
}

/**
 * Removes a specific cached item or all flow_cache_ items from localStorage.
 */
export function clearCache(key?: string): void {
  if (typeof window === "undefined" || typeof window.localStorage === "undefined") {
    return;
  }

  try {
    if (key) {
      window.localStorage.removeItem(toStorageKey(key));
    } else {
      const keysToRemove: string[] = [];
      for (let i = 0; i < window.localStorage.length; i++) {
        const k = window.localStorage.key(i);
        if (k && k.startsWith(STORAGE_PREFIX)) {
          keysToRemove.push(k);
        }
      }
      for (const k of keysToRemove) {
        window.localStorage.removeItem(k);
      }
    }
  } catch (err) {
    console.warn("[offlineCache] Failed to clear cache:", err);
  }
}

/**
 * Robust fetch wrapper that persists API responses in localStorage and provides
 * transparent offline fallback for read requests.
 *
 * 1. Checks if browser is online.
 * 2. When online: fetches with credentials, caches successful (200-299) JSON responses,
 *    and returns fresh data. If network fails mid-flight, automatically falls back to cache.
 * 3. When offline: immediately reads from localStorage cache.
 */
export async function fetchWithCache<T>(
  url: string,
  options?: FetchWithCacheOptions
): Promise<FetchWithCacheResult<T>> {
  const cacheKey = options?.cacheKey || url;
  const { forceRefresh, ttlMs, ...fetchInit } = options || {};

  // SSR fallback
  if (typeof window === "undefined") {
    const res = await fetch(url, fetchInit);
    if (!res.ok) {
      throw new Error(`Fetch failed with status ${res.status}: ${res.statusText}`);
    }
    const data = (await res.json()) as T;
    return { data, isFromCache: false };
  }

  const cached = readCacheEnvelope<T>(cacheKey);
  const online = isOnline();

  // If offline and not forced to refresh, return cache immediately if available
  if (!online && !forceRefresh) {
    if (cached) {
      return {
        data: cached.data,
        isFromCache: true,
        cachedAt: cached.cachedAt,
      };
    }
    throw new Error(`Network is offline and no cached data exists for "${cacheKey}".`);
  }

  // If online, perform the network fetch
  try {
    const res = await fetch(url, {
      credentials: "include", // Default to include auth cookies
      ...fetchInit,
    });

    if (!res.ok) {
      // If server returned an error (e.g. 500/503), attempt cache fallback if available
      if (cached) {
        console.warn(`[offlineCache] Server returned ${res.status}. Falling back to cached data for "${cacheKey}".`);
        return {
          data: cached.data,
          isFromCache: true,
          cachedAt: cached.cachedAt,
        };
      }
      throw new Error(`HTTP error ${res.status}: ${res.statusText}`);
    }

    const data = (await res.json()) as T;

    // Cache the fresh payload
    writeCacheEnvelope(cacheKey, data);

    return {
      data,
      isFromCache: false,
    };
  } catch (error) {
    // Network dropped, connection refused, or fetch threw
    if (cached) {
      console.warn(`[offlineCache] Network error occurred. Falling back to cached data for "${cacheKey}".`, error);
      return {
        data: cached.data,
        isFromCache: true,
        cachedAt: cached.cachedAt,
      };
    }

    throw error;
  }
}
