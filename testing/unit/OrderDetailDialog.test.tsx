import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import { OrderDetailDialog } from "@/components/sales/OrderDetailDialog";
import { Order } from "@/domain/Order";

describe("OrderDetailDialog Component", () => {
  const mockDraftOrder = new Order({
    id: "ord-201",
    number: "ORD-2026/03/01/A001",
    customer: "Cyberdyne Systems",
    status: "Draft",
    date: "2026-03-01",
    lineItems: [
      { product: "Neural Processor", qty: 2, price: 1500 },
    ],
  });

  const mockConfirmedOrder = new Order({
    id: "ord-202",
    number: "ORD-2026/03/02/A002",
    customer: "Stark Industries",
    status: "Confirmed",
    date: "2026-03-02",
    lineItems: [
      { product: "Arc Reactor", qty: 1, price: 9000 },
    ],
  });

  const defaultProps = {
    order: mockDraftOrder,
    onClose: jest.fn(),
    onSave: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("TC-3.7: renders order number, customer, line items, and amount in view mode", () => {
    render(<OrderDetailDialog {...defaultProps} />);

    expect(screen.getByText("ORD-2026/03/01/A001")).toBeInTheDocument();
    expect(screen.getAllByText("Cyberdyne Systems").length).toBeGreaterThanOrEqual(1);
    expect(screen.getByText("Neural Processor")).toBeInTheDocument();
    expect(screen.getByText("×2 @ $1500")).toBeInTheDocument();
    expect(screen.getByText("$3,000")).toBeInTheDocument();
  });

  it("TC-3.8: allows entering edit mode for Draft orders", () => {
    render(<OrderDetailDialog {...defaultProps} />);

    const editBtn = screen.getByRole("button", { name: /^edit$/i });
    expect(editBtn).toBeInTheDocument();

    fireEvent.click(editBtn);

    // Save changes button should now be visible
    expect(screen.getByRole("button", { name: /save changes/i })).toBeInTheDocument();
  });

  it("TC-3.9: saves edited customer and line items", () => {
    render(<OrderDetailDialog {...defaultProps} />);

    // Switch to edit mode
    fireEvent.click(screen.getByRole("button", { name: /^edit$/i }));

    // Change customer input
    const customerInput = screen.getByDisplayValue("Cyberdyne Systems");
    fireEvent.change(customerInput, { target: { value: "Cyberdyne Corp Updated" } });

    // Click Save changes -> takes to confirm step
    fireEvent.click(screen.getByRole("button", { name: /save changes/i }));

    // Click Confirm & save
    fireEvent.click(screen.getByRole("button", { name: /confirm & save/i }));

    expect(defaultProps.onSave).toHaveBeenCalledWith(
      expect.objectContaining({
        customer: "Cyberdyne Corp Updated",
        date: "2026-03-01",
        lineItems: [{ product: "Neural Processor", qty: 2, price: 1500 }],
      })
    );
  });

  it("TC-3.10: cancels edit mode and resets staged values", () => {
    render(<OrderDetailDialog {...defaultProps} />);

    // Enter edit mode
    fireEvent.click(screen.getByRole("button", { name: /^edit$/i }));

    // Modify input
    const customerInput = screen.getByDisplayValue("Cyberdyne Systems");
    fireEvent.change(customerInput, { target: { value: "Modified Name" } });

    // Click Cancel
    fireEvent.click(screen.getByRole("button", { name: /cancel/i }));

    // Dialog should return to view mode
    expect(screen.getByRole("button", { name: /^edit$/i })).toBeInTheDocument();
    expect(defaultProps.onSave).not.toHaveBeenCalled();
  });

  it("TC-3.11: does not show Edit button for non-Draft (Confirmed) orders", () => {
    render(<OrderDetailDialog {...defaultProps} order={mockConfirmedOrder} />);

    // Should NOT have an Edit button because confirmed orders are immutable
    expect(screen.queryByRole("button", { name: /^edit$/i })).not.toBeInTheDocument();
  });
});
