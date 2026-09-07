/**
 * @jest-environment jsdom
 */
// @ts-nocheck
import { render, screen } from "@testing-library/react";
import "@testing-library/jest-dom";
import { describe, it, expect, jest } from "@jest/globals";
import { PendingMoveBanner } from "./PendingMoveBanner";

describe("PendingMoveBanner Component", () => {
  it("renders the move confirmation prompt and action buttons", () => {
    const mockOnSave = jest.fn();
    const mockOnUndo = jest.fn();

    render(
      <PendingMoveBanner 
        item="Product A" 
        fromLocation="Warehouse 1" 
        toLocation="Store Floor" 
        onSave={mockOnSave} 
        onUndo={mockOnUndo} 
      />
    );

    expect(screen.getByText(/Move/i)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /save/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /undo/i })).toBeInTheDocument();
  });
});