import { render, screen } from "@testing-library/react";
import { UserDetailDialog } from "@/components/settings/UserDetailDialog";
import type { PublicUser } from "@/domain/User";

const user: PublicUser = { id: "1", username: "janedoe", role: "admin", createdAt: new Date("2026-01-01").toISOString() };

describe("UserDetailDialog", () => {
  it("renders the user's username and role when an admin views it", () => {
    render(<UserDetailDialog user={user} isAdmin={true} onClose={jest.fn()} onSave={jest.fn()} />);

    expect(screen.getAllByText("janedoe").length).toBeGreaterThan(0);
    expect(screen.getByText("admin")).toBeInTheDocument();
  });

  it("does not offer an Edit button to a non-admin viewer", () => {
    render(<UserDetailDialog user={user} isAdmin={false} onClose={jest.fn()} onSave={jest.fn()} />);
    expect(screen.queryByRole("button", { name: "Edit" })).not.toBeInTheDocument();
  });
});
