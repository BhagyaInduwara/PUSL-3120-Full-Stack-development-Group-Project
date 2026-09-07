import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { NewOrderDialog } from "../NewOrderDialog";

describe("NewOrderDialog Component", () => {
  const mockProducts = [
    { name: "Ergonomic Desk", price: 5000 },
    { name: "Mesh Chair", price: 1500 },
  ];

  const defaultProps = {
    onClose: jest.fn(),
    onSubmit: jest.fn(),
    error: null,
  };

  beforeEach(() => {
    jest.clearAllMocks();
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ products: mockProducts }),
    } as Response);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it("TC-3.1: fetches and populates product catalog options on mount", async () => {
    render(<NewOrderDialog {...defaultProps} />);

    await waitFor(() => {
      expect(screen.getByText("Ergonomic Desk")).toBeInTheDocument();
      expect(screen.getByText("Mesh Chair")).toBeInTheDocument();
    });
  });

  it("TC-3.2: disables Create Order button when customer is empty", async () => {
    render(<NewOrderDialog {...defaultProps} />);

    await waitFor(() => {
      expect(screen.getByText("Ergonomic Desk")).toBeInTheDocument();
    });

    const submitBtn = screen.getByRole("button", { name: /create order/i });
    expect(submitBtn).toBeDisabled();

    // Fill customer name
    const customerInput = screen.getByPlaceholderText(/e\.g\. Bluepeak/i);
    fireEvent.change(customerInput, { target: { value: "Wayne Enterprises" } });

    await waitFor(() => {
      expect(submitBtn).toBeEnabled();
    });
  });

  it("TC-3.3: supports adding and removing line items dynamically", async () => {
    render(<NewOrderDialog {...defaultProps} />);

    await waitFor(() => {
      expect(screen.getByText("Ergonomic Desk")).toBeInTheDocument();
    });

    const addLineBtn = screen.getByRole("button", { name: /\+ add line item/i });
    fireEvent.click(addLineBtn);

    // Now there should be 2 remove buttons
    const removeButtons = screen.getAllByRole("button", { name: /remove line item/i });
    expect(removeButtons.length).toBe(2);

    // Click remove on the second line item
    fireEvent.click(removeButtons[1]);
    expect(screen.getAllByRole("button", { name: /remove line item/i }).length).toBe(1);
  });

  it("TC-3.4: submits valid order data with customer and line items", async () => {
    render(<NewOrderDialog {...defaultProps} />);

    await waitFor(() => {
      expect(screen.getByText("Ergonomic Desk")).toBeInTheDocument();
    });

    const customerInput = screen.getByPlaceholderText(/e\.g\. Bluepeak/i);
    fireEvent.change(customerInput, { target: { value: "Wayne Enterprises" } });

    const submitBtn = screen.getByRole("button", { name: /create order/i });
    expect(submitBtn).toBeEnabled();
    fireEvent.click(submitBtn);

    expect(defaultProps.onSubmit).toHaveBeenCalledWith({
      customer: "Wayne Enterprises",
      lineItems: [{ product: "Ergonomic Desk", qty: 1, price: 5000 }],
    });
  });

  it("TC-3.5: displays error banner when error prop is provided", async () => {
    render(<NewOrderDialog {...defaultProps} error="Failed to create order" />);

    await waitFor(() => {
      expect(screen.getByText("Ergonomic Desk")).toBeInTheDocument();
    });

    expect(screen.getByText("Failed to create order")).toBeInTheDocument();
  });

  it("TC-3.6: triggers onClose when Cancel button is clicked", async () => {
    render(<NewOrderDialog {...defaultProps} />);

    await waitFor(() => {
      expect(screen.getByText("Ergonomic Desk")).toBeInTheDocument();
    });

    const cancelBtn = screen.getByRole("button", { name: /cancel/i });
    fireEvent.click(cancelBtn);

    expect(defaultProps.onClose).toHaveBeenCalledTimes(1);
  });
});
