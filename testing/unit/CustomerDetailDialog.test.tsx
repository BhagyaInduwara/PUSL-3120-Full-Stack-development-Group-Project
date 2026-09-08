import { render, screen } from "@testing-library/react";
import { CustomerDetailDialog } from "@/components/settings/CustomerDetailDialog";
import { Customer } from "@/domain/Customer";

const customer = new Customer({
  id: "cust-1",
  name: "John Doe",
  contact: "Jane Contact",
  email: "john@example.com",
  city: "Denver, CO",
});

describe("CustomerDetailDialog", () => {
  it("renders the customer's details in view mode", () => {
    render(<CustomerDetailDialog customer={customer} onClose={jest.fn()} onSave={jest.fn()} />);

    expect(screen.getAllByText("John Doe").length).toBeGreaterThan(0);
    expect(screen.getByText("john@example.com")).toBeInTheDocument();
    expect(screen.getByText("Denver, CO")).toBeInTheDocument();
  });
});
