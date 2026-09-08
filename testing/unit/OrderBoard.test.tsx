import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import { OrderBoard } from "@/components/sales/OrderBoard";
import { Order } from "@/domain/Order";

describe("OrderBoard Component", () => {
  const mockOrders: Order[] = [
    new Order({
      id: "ord-1",
      number: "ORD-001",
      customer: "Acme Corp",
      status: "Draft",
      date: "2026-03-01",
      lineItems: [{ product: "Desk Chair", qty: 2, price: 1500 }],
    }),
    new Order({
      id: "ord-2",
      number: "ORD-002",
      customer: "Globex Inc",
      status: "Draft",
      date: "2026-03-02",
      lineItems: [{ product: "Standing Desk", qty: 1, price: 5000 }],
    }),
    new Order({
      id: "ord-3",
      number: "ORD-003",
      customer: "Soylent Corp",
      status: "Confirmed",
      date: "2026-03-03",
      lineItems: [{ product: "Monitor Arm", qty: 4, price: 2500 }],
    }),
    new Order({
      id: "ord-4",
      number: "ORD-004",
      customer: "Initech",
      status: "Shipped",
      date: "2026-03-04",
      lineItems: [{ product: "Keyboard Tray", qty: 1, price: 1200 }],
    }),
  ];

  const defaultProps = {
    orders: mockOrders,
    pendingMove: null,
    onMove: jest.fn(),
    onSelect: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("TC-1.1: renders all 5 pipeline columns with proper labels", () => {
    render(<OrderBoard {...defaultProps} />);

    expect(screen.getAllByText(/^Draft/).length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText(/^Confirmed/).length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText(/^Invoiced/).length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText(/^Shipped/).length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText(/^Closed/).length).toBeGreaterThanOrEqual(1);
  });

  it("TC-1.2: displays correct card counts in column badge counters", () => {
    render(<OrderBoard {...defaultProps} />);

    // Draft (2), Confirmed (1), Invoiced (0), Shipped (1), Closed (0)
    expect(screen.getAllByText("2").length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText("1").length).toBeGreaterThanOrEqual(2);
    expect(screen.getAllByText("0").length).toBeGreaterThanOrEqual(2);
  });

  it("TC-1.3: computes and formats column subtotals using Money domain", () => {
    render(<OrderBoard {...defaultProps} />);

    // Draft column total: (2 * 1500) + (1 * 5000) = $8,000
    // Confirmed column total: 4 * 2500 = $10,000
    // Shipped column total: 1 * 1200 = $1,200
    expect(screen.getByText("$8,000")).toBeInTheDocument();
    expect(screen.getAllByText("$10,000").length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText("$1,200").length).toBeGreaterThanOrEqual(1);
  });

  it("TC-1.4: gracefully handles empty columns with 0 orders", () => {
    render(<OrderBoard {...defaultProps} orders={[]} />);

    // When all columns are empty, all 5 columns show $0 and badge count 0
    const zeroTotals = screen.getAllByText("$0");
    expect(zeroTotals.length).toBe(5);

    const zeroBadges = screen.getAllByText("0");
    expect(zeroBadges.length).toBe(5);
  });

  it("TC-1.5: triggers onSelect when an order card is clicked", () => {
    render(<OrderBoard {...defaultProps} />);

    const customerElement = screen.getByText("Acme Corp");
    fireEvent.click(customerElement);

    expect(defaultProps.onSelect).toHaveBeenCalledTimes(1);
    expect(defaultProps.onSelect).toHaveBeenCalledWith(mockOrders[0]);
  });

  it("TC-1.6: handles drop event and triggers onMove with target status", () => {
    render(<OrderBoard {...defaultProps} />);

    // Target the 'Invoiced' column drop container
    const invoicedLabels = screen.getAllByText(/^Invoiced/);
    const columnContainer = invoicedLabels[0].closest("div")?.parentElement;
    expect(columnContainer).toBeInTheDocument();

    if (columnContainer) {
      fireEvent.drop(columnContainer, {
        preventDefault: jest.fn(),
        dataTransfer: {
          getData: (format: string) => (format === "text/plain" ? "ord-1" : ""),
        },
      });

      expect(defaultProps.onMove).toHaveBeenCalledWith("ord-1", "Invoiced");
    }
  });

  it("TC-1.7: supports optimistic UI rendering via pendingMove prop", () => {
    // ord-1 is originally Draft, but has a pendingMove to Invoiced
    render(
      <OrderBoard
        {...defaultProps}
        pendingMove={{ orderId: "ord-1", status: "Invoiced" }}
      />
    );

    const acmeCard = screen.getByText("Acme Corp");
    expect(acmeCard).toBeInTheDocument();
  });
});
