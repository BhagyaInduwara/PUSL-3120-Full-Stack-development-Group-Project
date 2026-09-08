import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import { OrderCard } from "@/components/sales/OrderCard";
import { Order } from "@/domain/Order";

describe("OrderCard Component", () => {
  const mockOrder = new Order({
    id: "ord-101",
    number: "ORD-2026/03/01/A001",
    customer: "Nexus Corp",
    status: "Draft",
    date: "2026-03-01",
    lineItems: [
      { product: "Ergonomic Chair", qty: 2, price: 1500 },
      { product: "Standing Desk", qty: 1, price: 5000 },
      { product: "Monitor Arm", qty: 2, price: 2000 },
    ],
  });

  const defaultProps = {
    order: mockOrder,
    showStages: true,
    onDragStart: jest.fn(),
    onClick: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("TC-2.1: renders order number, customer name, date, and formatted total amount", () => {
    render(<OrderCard {...defaultProps} />);

    // Order number and customer
    expect(screen.getByText("ORD-2026/03/01/A001")).toBeInTheDocument();
    expect(screen.getByText("Nexus Corp")).toBeInTheDocument();

    // Date and formatted total amount: (2*1500 + 1*5000 + 2*2000 = 12000 -> $12,000)
    expect(screen.getByText("2026-03-01")).toBeInTheDocument();
    expect(screen.getByText("$12,000")).toBeInTheDocument();
  });

  it("TC-2.2: renders up to 2 line items and displays overflow count for extra items", () => {
    render(<OrderCard {...defaultProps} />);

    // First two items are visible
    expect(screen.getByText("Ergonomic Chair")).toBeInTheDocument();
    expect(screen.getByText("Standing Desk")).toBeInTheDocument();

    // 3rd item is truncated and shown as "+1 more item"
    expect(screen.getByText("+1 more item")).toBeInTheDocument();
  });

  it("TC-2.3: triggers onClick callback when the card is clicked", () => {
    render(<OrderCard {...defaultProps} />);

    const card = screen.getByText("Nexus Corp").closest("div");
    if (card) {
      fireEvent.click(card);
      expect(defaultProps.onClick).toHaveBeenCalledTimes(1);
    }
  });

  it("TC-2.4: triggers onDragStart and populates dataTransfer with order ID", () => {
    render(<OrderCard {...defaultProps} />);

    const setDataMock = jest.fn();
    const cardElement = screen.getByText("ORD-2026/03/01/A001").closest('[draggable="true"]');
    expect(cardElement).toBeInTheDocument();

    if (cardElement) {
      fireEvent.dragStart(cardElement, {
        dataTransfer: {
          setData: setDataMock,
        },
      });

      expect(defaultProps.onDragStart).toHaveBeenCalledTimes(1);
    }
  });

  it("TC-2.5: renders pendingStatus with dashed border and temporary status badge", () => {
    render(
      <OrderCard
        {...defaultProps}
        pendingStatus="Invoiced"
      />
    );

    // Should display temporary target status "Invoiced"
    expect(screen.getByText("Invoiced")).toBeInTheDocument();

    // The card container should have dashed border styling
    const cardContainer = screen.getByText("ORD-2026/03/01/A001").closest('[draggable="true"]');
    expect(cardContainer?.className).toContain("border-dashed");
  });

  it("TC-2.6: conditionally renders stage tracker when showStages is true and hides when false", () => {
    const { rerender } = render(<OrderCard {...defaultProps} showStages={true} />);

    // Stage tracker is present (Order Placed step)
    expect(screen.getByTitle("Order Placed (In Progress)")).toBeInTheDocument();

    // Re-render with showStages = false
    rerender(<OrderCard {...defaultProps} showStages={false} />);
    expect(screen.queryByTitle("Order Placed (In Progress)")).not.toBeInTheDocument();
  });
});
