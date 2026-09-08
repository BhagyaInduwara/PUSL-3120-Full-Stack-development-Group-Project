import { render, screen } from "@testing-library/react";
import { ProductDetailDialog } from "@/components/settings/ProductDetailDialog";
import { Product } from "@/domain/Product";

const product = new Product({ sku: "DSK-EXW", name: "Executive Desk", category: "Desks", price: 250 });

describe("ProductDetailDialog", () => {
  it("renders the product's details, formatting price via Money", () => {
    render(<ProductDetailDialog product={product} onClose={jest.fn()} onSave={jest.fn()} />);

    expect(screen.getAllByText("Executive Desk").length).toBeGreaterThan(0);
    expect(screen.getByText("DSK-EXW")).toBeInTheDocument();
    expect(screen.getByText("$250")).toBeInTheDocument();
  });
});
