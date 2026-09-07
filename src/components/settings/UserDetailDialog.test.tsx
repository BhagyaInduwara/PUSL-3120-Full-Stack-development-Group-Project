/**
 * @jest-environment jsdom
 */
// @ts-nocheck
import { render, screen } from "@testing-library/react";
import "@testing-library/jest-dom";
import { describe, it, expect, jest } from "@jest/globals";
import { UserDetailDialog } from "./UserDetailDialog";

jest.mock("next/navigation", () => ({
  useRouter() {
    return {
      push: jest.fn(),
      replace: jest.fn(),
      prefetch: jest.fn(),
      back: jest.fn(),
    };
  },
  usePathname() {
    return "";
  },
}));

describe("UserDetailDialog Component", () => {
  it("renders user details correctly when open", () => {
    const mockUser = {
      id: "1",
      username: "janedoe",
      role: "admin",
      createdAt: new Date().toISOString(),
    };

    render(
      <UserDetailDialog 
        user={mockUser} 
        isAdmin={true}
        onClose={jest.fn()} 
        onSave={jest.fn()} 
      />
    );
    
    const usernameElements = screen.getAllByText(/janedoe/i);
    expect(usernameElements.length).toBeGreaterThan(0);

    const roleElement = screen.getByText(/admin/i);
    expect(roleElement).toBeInTheDocument();
  });
});