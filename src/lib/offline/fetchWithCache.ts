export function writeCacheEnvelope(url: string, data: any) {
  const envelope = {
    data,
    timestamp: Date.now(),
  };
  localStorage.setItem(url, JSON.stringify(envelope));
}

export function clearCache() {
  localStorage.clear();
}

export async function fetchWithCache<T = any>(
  url: string,
  options: { ttl?: number } = {}
): Promise<{ data: T; isFromCache: boolean }> {
  const { ttl } = options;

  // Check if offline first before attempting to fetch
  if (typeof navigator !== 'undefined' && !navigator.onLine) {
    const cached = localStorage.getItem(url);
    if (cached) {
      const envelope = JSON.parse(cached);
      // Optional TTL check even when offline
      if (!ttl || Date.now() - envelope.timestamp < ttl) {
        return { data: envelope.data, isFromCache: true };
      }
    }
    throw new Error(`Network is offline and no cached data exists for "${url}".`);
  }

  // Check cache and TTL validity when online
  const cached = localStorage.getItem(url);
  if (cached) {
    const envelope = JSON.parse(cached);
    const isExpired = ttl && Date.now() - envelope.timestamp >= ttl;
    
    // If we have valid cache and no explicit TTL expiration, return cache immediately or validate
    if (!isExpired && !ttl) {
      // If your use-case prefers network fallback or immediate cache hit, handle here.
      // Keeping standard behavior: return fresh cache if not expired.
    }
    if (isExpired) {
      // Force network fetch if expired
      try {
        const response = await fetch(url);
        if (response.ok) {
          const data: T = await response.json();
          writeCacheEnvelope(url, data);
          return { data, isFromCache: false };
        }
      } catch (e) {
        // Fallback to stale cache if network fails during TTL refetch
        return { data: envelope.data, isFromCache: true };
      }
    }
  }

  try {
    const response = await fetch(url);
    
    if (!response.ok) {
      if (cached) {
        const envelope = JSON.parse(cached);
        return { data: envelope.data, isFromCache: true };
      }
      throw new Error(`Fetch failed with status ${response.status}: ${response.statusText}`);
    }

    const data: T = await response.json();
    writeCacheEnvelope(url, data);

    return { data, isFromCache: false };
  } catch (error) {
    if (cached) {
      const envelope = JSON.parse(cached);
      return { data: envelope.data, isFromCache: true };
    }
    throw error;
  }
}