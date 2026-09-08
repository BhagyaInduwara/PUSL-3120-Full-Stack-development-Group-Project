import { fetchWithCache, writeCacheEnvelope, clearCache } from "@/lib/offline";

const mockFetch = jest.fn();
global.fetch = mockFetch as unknown as typeof fetch;

describe("Offline Engine — fetchWithCache", () => {
  beforeEach(() => {
    clearCache();
    mockFetch.mockReset();
    Object.defineProperty(window.navigator, "onLine", { writable: true, value: true });
  });

  it("performs a network fetch and caches data on a cache miss", async () => {
    const mockData = { id: 1, name: "Test Product" };
    mockFetch.mockResolvedValueOnce({ ok: true, json: async () => mockData });

    const result = await fetchWithCache("https://api.example.com/data");

    expect(mockFetch).toHaveBeenCalledTimes(1);
    // credentials: "include" is what carries the session cookie through the
    // same-origin proxy — see CLAUDE.md "Authentication & Users". Losing this
    // is exactly the kind of regression this test exists to catch.
    expect(mockFetch).toHaveBeenCalledWith("https://api.example.com/data", expect.objectContaining({ credentials: "include" }));
    expect(result.data).toEqual(mockData);
    expect(result.isFromCache).toBe(false);
  });

  it("returns an immediate cache hit without fetching when the browser is offline", async () => {
    writeCacheEnvelope("https://api.example.com/data", { id: 2, name: "Offline Product" });
    Object.defineProperty(window.navigator, "onLine", { writable: true, value: false });

    const result = await fetchWithCache("https://api.example.com/data");

    expect(mockFetch).not.toHaveBeenCalled();
    expect(result.data).toEqual({ id: 2, name: "Offline Product" });
    expect(result.isFromCache).toBe(true);
  });

  it("falls back to the cache when the network request fails (e.g. a 500)", async () => {
    writeCacheEnvelope("https://api.example.com/data", { id: 3, name: "Fallback Product" });
    mockFetch.mockResolvedValueOnce({ ok: false, status: 500, statusText: "Internal Server Error" });

    const result = await fetchWithCache("https://api.example.com/data");

    expect(mockFetch).toHaveBeenCalledTimes(1);
    expect(result.data).toEqual({ id: 3, name: "Fallback Product" });
    expect(result.isFromCache).toBe(true);
  });

  it("throws if offline and no cached data exists for that URL", async () => {
    Object.defineProperty(window.navigator, "onLine", { writable: true, value: false });

    await expect(fetchWithCache("https://api.example.com/empty")).rejects.toThrow(
      'Network is offline and no cached data exists for "https://api.example.com/empty".'
    );
  });
});
