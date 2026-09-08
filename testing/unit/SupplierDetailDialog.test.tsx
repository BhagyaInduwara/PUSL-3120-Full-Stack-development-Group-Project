import { render, screen } from "@testing-library/react";
import { SupplierDetailDialog } from "@/components/settings/SupplierDetailDialog";
import { Supplier } from "@/domain/Supplier";

const supplier = new Supplier({
  id: "sup-1",
  name: "Office Depot Supplies",
  category: "Office Essentials",
  contact: "John Smith",
  leadTime: "3 days",
});

describe("SupplierDetailDialog", () => {
  it("renders the supplier's details in view mode", () => {
    render(<SupplierDetailDialog supplier={supplier} onClose={jest.fn()} onSave={jest.fn()} />);

    expect(screen.getAllByText("Office Depot Supplies").length).toBeGreaterThan(0);
    expect(screen.getByText("Office Essentials")).toBeInTheDocument();
    expect(screen.getByText("John Smith")).toBeInTheDocument();
    expect(screen.getByText("3 days")).toBeInTheDocument();
  });
});
