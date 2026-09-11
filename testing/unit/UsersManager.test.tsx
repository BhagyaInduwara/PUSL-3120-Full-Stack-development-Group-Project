import { render, screen } from "@testing-library/react";
import { UsersManager } from "@/components/settings/UsersManager";
import type { PublicUser } from "@/domain/User";

// UsersManager calls useRouter().refresh() after a save/create — needs a
// router context that doesn't exist in a plain RTL render otherwise.
jest.mock("next/navigation", () => ({
  useRouter: () => ({ push: jest.fn(), replace: jest.fn(), refresh: jest.fn(), prefetch: jest.fn(), back: jest.fn() }),
}));

const users: PublicUser[] = [
  { id: "1", username: "alice", role: "admin", createdAt: new Date("2026-01-01").toISOString() },
  { id: "2", username: "bob", role: "staff", createdAt: new Date("2026-01-02").toISOString() },
];

describe("UsersManager", () => {
  it("lists every user's username and role", () => {
    render(<UsersManager users={users} isAdmin={false} />);

    expect(screen.getByText("alice")).toBeInTheDocument();
    expect(screen.getByText("admin")).toBeInTheDocument();
    expect(screen.getByText("bob")).toBeInTheDocument();
    expect(screen.getByText("staff")).toBeInTheDocument();
  });

  it("only shows the Add user button to an admin", () => {
    const { rerender } = render(<UsersManager users={users} isAdmin={false} />);
    expect(screen.queryByRole("button", { name: "Add user" })).not.toBeInTheDocument();

    rerender(<UsersManager users={users} isAdmin={true} />);
    expect(screen.getByRole("button", { name: "Add user" })).toBeInTheDocument();
  });
});
