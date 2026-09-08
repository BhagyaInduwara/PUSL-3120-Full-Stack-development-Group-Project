import { render, screen, fireEvent } from "@testing-library/react";
import { AddProductDialog } from "@/components/settings/AddProductDialog";

describe("AddProductDialog", () => {
  it("renders the form and disables Add product until sku/name/price are valid", () => {
    render(<AddProductDialog onClose={jest.fn()} onSubmit={jest.fn()} />);

    const addButton = screen.getByRole("button", { name: "Add product" });
    expect(addButton).toBeDisabled();
  });

  it("submits the entered sku/name/category/price once the form is valid", () => {
    const onSubmit = jest.fn();
    render(<AddProductDialog onClose={jest.fn()} onSubmit={onSubmit} />);

    fireEvent.change(screen.getByPlaceholderText("e.g. DSK-EXW"), { target: { value: "CHR-001" } });
    fireEvent.change(screen.getByPlaceholderText("e.g. Executive Desk – Walnut"), { target: { value: "Task Chair" } });
    fireEvent.change(screen.getByPlaceholderText("e.g. Desks"), { target: { value: "Seating" } });
    fireEvent.change(screen.getByPlaceholderText("0.00"), { target: { value: "145" } });

    fireEvent.click(screen.getByRole("button", { name: "Add product" }));

    expect(onSubmit).toHaveBeenCalledWith({ sku: "CHR-001", name: "Task Chair", category: "Seating", price: 145 });
  });

  it("shows a server-supplied error message when provided", () => {
    render(<AddProductDialog onClose={jest.fn()} onSubmit={jest.fn()} error="That SKU is already in use." />);
    expect(screen.getByText("That SKU is already in use.")).toBeInTheDocument();
  });
});
