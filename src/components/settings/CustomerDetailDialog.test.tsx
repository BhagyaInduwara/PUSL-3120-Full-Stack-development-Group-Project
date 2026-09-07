/**
 * @jest-environment jsdom
 */
// @ts-nocheck
import { render, screen } from "@testing-library/react";
import "@testing-library/jest-dom";
import { describe, it, expect, jest } from "@jest/globals";
import { CustomerDetailDialog } from "./CustomerDetailDialog";

describe("CustomerDetailDialog Component", () => {
  it("renders the dialog container structure", () => {
    const { container } = render(
      <CustomerDetailDialog isOpen={false} onClose={jest.fn()} customer={{ name: "John Doe" }} />
    );
    expect(container.firstChild).toBeInTheDocument();
  });

  it("renders customer information correctly when open", () => {
    const mockCustomer = { name: "John Doe", email: "john@example.com", phone: "555-0192" };
    render(<CustomerDetailDialog isOpen={true} onClose={jest.fn()} customer={mockCustomer} />);
    
    expect(screen.getAllByText(/john doe/i).length).toBeGreaterThan(0);
    expect(screen.getByText(/john@example.com/i)).toBeInTheDocument();
  });
});