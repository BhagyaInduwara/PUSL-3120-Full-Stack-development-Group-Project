/**
 * @jest-environment jsdom
 */
// @ts-nocheck
import { render, screen } from "@testing-library/react";
import "@testing-library/jest-dom";
import { describe, it, expect, jest } from "@jest/globals";
import { SupplierDetailDialog } from "./SupplierDetailDialog";

jest.mock("next/navigation", () => ({
  useRouter() {
    return {
      push: jest.fn(),
      replace: jest.fn(),
      prefetch: jest.fn(),
      back: jest.fn(),
    };
  },
  usePathname() {
    return "";
  },
}));

describe("SupplierDetailDialog Component", () => {
  it("renders supplier details correctly when open", () => {
    const mockSupplier = {
      id: "1",
      name: "Office Depot Supplies",
      category: "Office Essentials",
      contact: "John Smith",
      leadTime: "3 days",
    };

    render(
      <SupplierDetailDialog 
        supplier={mockSupplier} 
        onClose={jest.fn()} 
        onSave={jest.fn()} 
      />
    );
    
    const nameElements = screen.getAllByText(/office depot supplies/i);
    expect(nameElements.length).toBeGreaterThan(0);

    const categoryElement = screen.getByText(/office essentials/i);
    expect(categoryElement).toBeInTheDocument();
  });
});