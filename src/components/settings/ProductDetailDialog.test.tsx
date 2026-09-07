/**
 * @jest-environment jsdom
 */
// @ts-nocheck
import { render, screen } from "@testing-library/react";
import "@testing-library/jest-dom";
import { describe, it, expect, jest } from "@jest/globals";
import { ProductDetailDialog } from "./ProductDetailDialog";

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

describe("ProductDetailDialog Component", () => {
  it("renders product details correctly when open", () => {
    const mockProduct = {
      id: "1",
      sku: "DSK-EXW",
      name: "Executive Desk",
      category: "Desks",
      price: { dollars: 250, cents: 0 },
      priceFormatted: "$250.00",
    };

    render(
      <ProductDetailDialog 
        product={mockProduct} 
        onClose={jest.fn()} 
        onSave={jest.fn()} 
      />
    );
    
    const nameElements = screen.getAllByText(/executive desk/i);
    expect(nameElements.length).toBeGreaterThan(0);

    const skuElements = screen.getAllByText(/dsk-exw/i);
    expect(skuElements.length).toBeGreaterThan(0);
  });
});