// @ts-nocheck
import { fetchWithCache, clearCache, writeCacheEnvelope } from "./fetchWithCache";
import { describe, it, expect, beforeEach, jest } from "@jest/globals";

// Polyfill localStorage for Node.js environment
const localStorageMock = (() => {
  let store = {};
  return {
    getItem: (key) => store[key] || null,
    setItem: (key, value) => { store[key] = value.toString(); },
    clear: () => { store = {}; },
    removeItem: (key) => { delete store[key]; }
  };
})();
Object.defineProperty(global, 'localStorage', { value: localStorageMock, writable: true });

const mockFetch = jest.fn();
global.fetch = mockFetch;

if (typeof global.navigator === 'undefined') {
  global.navigator = { onLine: true };
}

describe("Offline Engine — fetchWithCache", () => {
  beforeEach(() => {
    clearCache();
    localStorage.clear();
    jest.clearAllMocks();
    global.navigator.onLine = true;
  });

  it("performs a network fetch and caches data on a cache miss", async () => {
    const mockData = { id: 1, name: "Test Product" };
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => mockData,
    });

    const result = await fetchWithCache("https://api.example.com/data");

    expect(mockFetch).toHaveBeenCalledTimes(1);
    expect(result.data).toEqual(mockData);
    expect(result.isFromCache).toBe(false);
  });

  it("returns immediate cache hit without fetching when browser is offline", async () => {
    global.navigator.onLine = false;
    const cachedData = { id: 2, name: "Offline Product" };
    
    writeCacheEnvelope("https://api.example.com/data", cachedData);

    const result = await fetchWithCache("https://api.example.com/data");

    expect(mockFetch).not.toHaveBeenCalled();
    expect(result.data).toEqual(cachedData);
    expect(result.isFromCache).toBe(true);
  });

  it("falls back to localStorage when the network request fails (e.g., 500 error)", async () => {
    const cachedData = { id: 3, name: "Fallback Product" };
    writeCacheEnvelope("https://api.example.com/data", cachedData);

    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 500,
      statusText: "Internal Server Error",
    });

    const result = await fetchWithCache("https://api.example.com/data");

    expect(mockFetch).toHaveBeenCalledTimes(1);
    expect(result.data).toEqual(cachedData);
    expect(result.isFromCache).toBe(true);
  });

  it("throws an error if offline and no cached data exists", async () => {
    global.navigator.onLine = false;

    await expect(fetchWithCache("https://api.example.com/empty")).rejects.toThrow(
      'Network is offline and no cached data exists for "https://api.example.com/empty".'
    );
  });
});