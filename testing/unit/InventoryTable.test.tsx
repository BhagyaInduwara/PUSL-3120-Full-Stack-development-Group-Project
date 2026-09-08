import { render, screen } from "@testing-library/react";
import { InventoryTable } from "@/components/inventory/InventoryTable";
import { InventoryItem } from "@/domain/InventoryItem";

function item(qty: number, reorderPoint: number, overrides: Partial<{ sku: string; name: string; category: string }> = {}) {
  return new InventoryItem({
    sku: overrides.sku ?? "SKU-1",
    name: overrides.name ?? "Executive Desk",
    category: overrides.category ?? "Desks",
    qty,
    reorderPoint,
  });
}

describe("InventoryTable", () => {
  it("shows the 'Low stock' badge only for items below their reorder point", () => {
    render(
      <InventoryTable
        items={[
          item(2, 10, { sku: "LOW-1", name: "Task Chair" }),
          item(50, 10, { sku: "OK-1", name: "Filing Cabinet" }),
        ]}
      />
    );

    // One row is low stock, one isn't — exactly one badge should render.
    expect(screen.getAllByText("Low stock")).toHaveLength(1);
    expect(screen.getByText("Task Chair")).toBeInTheDocument();
    expect(screen.getByText("Filing Cabinet")).toBeInTheDocument();
  });

  it("renders SKU, product name, category, and on-hand quantity per row", () => {
    render(<InventoryTable items={[item(14, 10, { sku: "DSK-EXW", name: "Executive Desk", category: "Desks" })]} />);

    expect(screen.getByText("DSK-EXW")).toBeInTheDocument();
    expect(screen.getByText("Executive Desk")).toBeInTheDocument();
    expect(screen.getByText("Desks")).toBeInTheDocument();
    expect(screen.getByText("14")).toBeInTheDocument();
  });

  it("renders no rows when there are no items", () => {
    render(<InventoryTable items={[]} />);
    expect(screen.queryByText("Low stock")).not.toBeInTheDocument();
  });
});
