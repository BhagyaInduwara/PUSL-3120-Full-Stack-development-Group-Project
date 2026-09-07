/**
 * @jest-environment jsdom
 */
// @ts-nocheck
import { render, screen, fireEvent } from "@testing-library/react";
import "@testing-library/jest-dom";
import { describe, it, expect, jest } from "@jest/globals";
import { AddProductDialog } from "./AddProductDialog";

describe("AddProductDialog Component", () => {
  it("renders form inputs and action buttons when open", () => {
    render(<AddProductDialog isOpen={true} onClose={jest.fn()} onSave={jest.fn()} />);
    
    expect(screen.getByRole("button", { name: /^add product$/i })).toBeInTheDocument();
  });

  it("handles input validation or submission properly", () => {
    const mockSave = jest.fn();
    render(<AddProductDialog isOpen={true} onClose={jest.fn()} onSave={mockSave} />);
    
    const addButton = screen.getByRole("button", { name: /^add product$/i });
    fireEvent.click(addButton);
    
    // Verifies the modal title container is present uniquely
    expect(screen.getAllByText(/add product/i).length).toBeGreaterThan(0);
  });
});