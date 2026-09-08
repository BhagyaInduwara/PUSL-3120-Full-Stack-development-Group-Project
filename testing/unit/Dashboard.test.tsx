import { render, screen, within, waitFor } from "@testing-library/react";
import DashboardPage from "@/app/(app)/dashboard/page";

const mockOrders = [
  { _id: "o1", number: "ORD-1", customer: "Alice", lineItems: [{ product: "Desk", qty: 2, price: 100 }], status: "Draft", date: "2026-01-01" },
  { _id: "o2", number: "ORD-2", customer: "Bob", lineItems: [{ product: "Chair", qty: 1, price: 50 }], status: "Confirmed", date: "2026-01-02" },
  { _id: "o3", number: "ORD-3", customer: "Cy", lineItems: [{ product: "Desk", qty: 1, price: 100 }], status: "Closed", date: "2026-01-03" },
];

const mockJobs = [
  { _id: "j1", number: "JOB-1", product: "Desk", qty: 5, due: "Aug 8", status: "Planned" },
  { _id: "j2", number: "JOB-2", product: "Chair", qty: 3, due: "Aug 9", status: "In Progress", progress: 40 },
  { _id: "j3", number: "JOB-3", product: "Desk", qty: 2, due: "Aug 10", status: "Completed", progress: 100 },
];

const mockShipments = [
  { id: "s1", status: "Packed" },
  { id: "s2", status: "Dispatched" },
  { id: "s3", status: "Delivered" },
];

const mockInventory = [
  { sku: "SK1", name: "Desk", category: "Desks", qty: 2, reorderPoint: 10 }, // low
  { sku: "SK2", name: "Chair", category: "Seating", qty: 50, reorderPoint: 10 }, // ok
];

const mockProducts = [
  { name: "Desk", category: "Desks" },
  { name: "Chair", category: "Seating" },
];

const mockActivities = [{ _id: "a1", message: "New draft order parsed from email", occurredAt: "2026-01-01T09:00:00Z" }];

const mockRevenueSeries = [
  { week: "W1", revenue: 1000, orders: 5 },
  { week: "W2", revenue: 2000, orders: 8 },
];

jest.mock("@/lib/offline", () => ({
  fetchWithCache: jest.fn((url: string) => {
    const ok = (data: unknown) => Promise.resolve({ data, isFromCache: false });
    if (url.includes("/api/orders")) return ok(mockOrders);
    if (url.includes("/api/production-jobs")) return ok({ productionJobs: mockJobs });
    if (url.includes("/api/shipments")) return ok({ shipments: mockShipments });
    if (url.includes("/api/inventory")) return ok({ inventory: mockInventory });
    if (url.includes("/api/products")) return ok({ products: mockProducts });
    if (url.includes("/api/activity")) return ok({ activities: mockActivities });
    if (url.includes("/api/revenue-series")) return ok({ revenueSeries: mockRevenueSeries });
    return Promise.reject(new Error(`Unhandled URL in Dashboard test mock: ${url}`));
  }),
}));

/** Finds a StatCard's rendered value given its kicker label (see StatCard.tsx: Card > [kicker-row > CardKicker span, Icon] + value div). */
function statCardValue(kicker: string) {
  const kickerSpan = screen.getByText(kicker);
  const card = kickerSpan.parentElement?.parentElement as HTMLElement;
  return within(card);
}

describe("Dashboard — KPI tile computation", () => {
  it("computes each stat tile from the fetched collections, not hardcoded numbers", async () => {
    render(<DashboardPage />);

    // Pending Orders = Draft + Confirmed (2 of the 3 mock orders)
    await waitFor(() => expect(statCardValue("Pending Orders").getByText("2")).toBeInTheDocument());
    // In Production = Planned + In Progress (2 of the 3 mock jobs)
    expect(statCardValue("In Production").getByText("2")).toBeInTheDocument();
    // Shipments Today = Packed + Dispatched (2 of the 3 mock shipments)
    expect(statCardValue("Shipments Today").getByText("2")).toBeInTheDocument();
    // Low Stock Items = items where qty < reorderPoint (1 of the 2 mock inventory rows)
    expect(statCardValue("Low Stock Items").getByText("1")).toBeInTheDocument();
  });

  it("starts from a zeroed/empty state before the fetch resolves (no flash of stale/hardcoded numbers)", async () => {
    render(<DashboardPage />);
    // Synchronous first render, before the mocked fetch's promise resolves.
    expect(statCardValue("Pending Orders").getByText("0")).toBeInTheDocument();

    // Drain the pending fetch's state update before the test ends, so it
    // can't leak into (and cause an act() warning in) a later test.
    await waitFor(() => expect(statCardValue("Pending Orders").getByText("2")).toBeInTheDocument());
  });
});

describe("Dashboard — revenue chart data rendering", () => {
  it("renders one chart bar/label per revenue-series data point returned by the API", async () => {
    render(<DashboardPage />);

    await waitFor(() => expect(screen.getByText("W1")).toBeInTheDocument());
    expect(screen.getByText("W2")).toBeInTheDocument();
  });
});
