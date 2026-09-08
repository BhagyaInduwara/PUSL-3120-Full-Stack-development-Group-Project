import { render, screen } from "@testing-library/react";
import { PendingMoveBanner } from "@/components/ui/PendingMoveBanner";

describe("PendingMoveBanner", () => {
  it("renders the move confirmation prompt and Save/Undo actions", () => {
    render(
      <PendingMoveBanner label="ORD-1045" fromStatus="Draft" toStatus="Confirmed" onSave={jest.fn()} onUndo={jest.fn()} />
    );

    expect(screen.getByText(/move/i)).toBeInTheDocument();
    expect(screen.getByText("ORD-1045")).toBeInTheDocument();
    expect(screen.getByText("Draft")).toBeInTheDocument();
    expect(screen.getByText("Confirmed")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Save" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Undo" })).toBeInTheDocument();
  });
});
