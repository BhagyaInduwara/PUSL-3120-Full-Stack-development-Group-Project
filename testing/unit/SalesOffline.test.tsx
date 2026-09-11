import React from "react";
import { render, screen, waitFor } from "@testing-library/react";
import SalesPage from "@/app/(app)/sales/page";
import { SocketProvider } from "@/components/providers/SocketProvider";
import { writeCacheEnvelope, readCacheEnvelope } from "@/lib/offline/fetchWithCache";
import { API_URL } from "@/lib/apiUrl";

// SalesPage calls useLiveEvent("order:changed", ...), which needs a
// SocketProvider ancestor — mocked here (rather than a real socket.io-client
// connection attempt) the same way testing/unit/SocketProvider.test.tsx does.
jest.mock("@/lib/socket", () => ({
  getSocket: () => ({
    connected: false,
    on: jest.fn(),
    off: jest.fn(),
  }),
}));

function renderSalesPage() {
  return render(
    <SocketProvider>
      <SalesPage />
    </SocketProvider>
  );
}

describe("Sales Page — Offline Fallback & Cache Resiliency", () => {
  const cachedOrdersPayload = [
    {
      _id: "cached-ord-1",
      number: "ORD-CACHED-001",
      customer: "Offline Corp",
      status: "Draft",
      date: "2026-03-01T10:00:00.000Z",
      lineItems: [{ product: "Desk Chair", qty: 2, price: 1500 }],
    },
    {
      _id: "cached-ord-2",
      number: "ORD-CACHED-002",
      customer: "Vault Industries",
      status: "Confirmed",
      date: "2026-03-02T10:00:00.000Z",
      lineItems: [{ product: "Standing Desk", qty: 1, price: 5000 }],
    },
  ];

  beforeEach(() => {
    jest.clearAllMocks();
    window.localStorage.clear();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it("TC-4.1: writeCacheEnvelope and readCacheEnvelope serialize and retrieve cache correctly", () => {
    writeCacheEnvelope("test-key", { test: "data" });
    const cached = readCacheEnvelope<{ test: string }>("test-key");

    expect(cached).not.toBeNull();
    expect(cached?.data).toEqual({ test: "data" });
    expect(typeof cached?.cachedAt).toBe("number");
  });

  it("TC-4.2: falls back to localStorage cache when network request fails", async () => {
    // 1. Seed localStorage with the cached orders snapshot under the API key
    writeCacheEnvelope(`${API_URL}/api/orders`, cachedOrdersPayload);
    writeCacheEnvelope(`${API_URL}/api/production-jobs`, { productionJobs: [] });
    writeCacheEnvelope(`${API_URL}/api/order-drafts`, []);

    // 2. Mock fetch to simulate complete network failure (offline / drop)
    global.fetch = jest.fn().mockRejectedValue(new TypeError("Failed to fetch (Network error)"));

    // 3. Render SalesPage
    renderSalesPage();

    // 4. Verify that cached orders are displayed on the board
    await waitFor(() => {
      expect(screen.getByText("Offline Corp")).toBeInTheDocument();
      expect(screen.getByText("Vault Industries")).toBeInTheDocument();
      expect(screen.getByText("ORD-CACHED-001")).toBeInTheDocument();
      expect(screen.getByText("ORD-CACHED-002")).toBeInTheDocument();
    });
  });

  it("TC-4.3: displays offline indicator badge when data is served from offline cache", async () => {
    // Seed cache
    writeCacheEnvelope(`${API_URL}/api/orders`, cachedOrdersPayload);
    writeCacheEnvelope(`${API_URL}/api/production-jobs`, { productionJobs: [] });
    writeCacheEnvelope(`${API_URL}/api/order-drafts`, []);

    // Simulate network error
    global.fetch = jest.fn().mockRejectedValue(new Error("Network disconnected"));

    renderSalesPage();

    // Verify offline badge is rendered in header
    await waitFor(() => {
      expect(screen.getByText("Offline — showing cached data")).toBeInTheDocument();
    });
  });

  it("TC-4.4: online fetch renders live orders without offline indicator badge", async () => {
    // Mock successful live online response
    global.fetch = jest.fn().mockImplementation((url: string) => {
      if (url.includes("/api/orders")) {
        return Promise.resolve({
          ok: true,
          json: async () => [
            {
              _id: "live-ord-1",
              number: "ORD-LIVE-001",
              customer: "Online Live Client",
              status: "Draft",
              date: "2026-03-01T10:00:00.000Z",
              lineItems: [{ product: "Desk Chair", qty: 1, price: 1500 }],
            },
          ],
        } as Response);
      }
      if (url.includes("/api/production-jobs")) {
        return Promise.resolve({
          ok: true,
          json: async () => ({ productionJobs: [] }),
        } as Response);
      }
      if (url.includes("/api/order-drafts")) {
        return Promise.resolve({
          ok: true,
          json: async () => [],
        } as Response);
      }
      return Promise.resolve({
        ok: true,
        json: async () => ({}),
      } as Response);
    });

    renderSalesPage();

    await waitFor(() => {
      expect(screen.getByText("Online Live Client")).toBeInTheDocument();
    });

    // Offline badge should NOT be in the document
    expect(screen.queryByText("Offline — showing cached data")).not.toBeInTheDocument();
  });
});
