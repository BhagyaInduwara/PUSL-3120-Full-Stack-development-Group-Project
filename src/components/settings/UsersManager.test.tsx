/**
 * @jest-environment jsdom
 */
// @ts-nocheck
import { render, screen } from "@testing-library/react";
import "@testing-library/jest-dom";
import { describe, it, expect, jest } from "@jest/globals";
import { UsersManager } from "./UsersManager";

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

describe("UsersManager Component", () => {
  it("renders user management elements and controls correctly", () => {
    const mockUsers = [
      { id: "1", username: "alice smith", name: "Alice Smith", role: "Admin", createdAt: new Date().toISOString() },
      { id: "2", username: "bob jones", name: "Bob Jones", role: "Staff", createdAt: new Date().toISOString() },
    ];

    render(
      <UsersManager 
        users={mockUsers} 
        initialUsers={mockUsers} 
        data={mockUsers} 
        onRoleUpdate={jest.fn()} 
      />
    );
    
    expect(screen.getByText(/admin/i)).toBeInTheDocument();
    expect(screen.getByText(/staff/i)).toBeInTheDocument();
  });
});