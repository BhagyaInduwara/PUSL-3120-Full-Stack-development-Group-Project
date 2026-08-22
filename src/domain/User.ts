import { Entity } from "./Entity";

export type UserRole = "admin" | "staff";

export interface UserProps {
  id: string;
  username: string;
  passwordHash: string;
  role: UserRole;
  createdAt: string;
}

/** The subset of a User that's ever safe to send to the browser or return from an API route. */
export interface PublicUser {
  id: string;
  username: string;
  role: UserRole;
  createdAt: string;
}

/**
 * User — login identity for the app. `passwordHash` is a private field with
 * no public getter: the only way to get data out of a User for a response
 * body is `toPublic()`, which structurally cannot include the hash. This
 * mirrors the encapsulation pattern the rest of the domain layer uses
 * (Order.status, Invoice.status, ...) — the class itself is the one place
 * that decides what's safe to expose, not each call site remembering to
 * omit a field.
 *
 * This entity (and everything that touches passwordHash) is server-only —
 * see src/repositories/UserRepository.ts and src/server/auth/. It is
 * deliberately never read through ERPStore, which is client-side state.
 */
export class User extends Entity {
  readonly username: string;
  readonly role: UserRole;
  readonly createdAt: string;
  private readonly passwordHash: string;

  constructor(props: UserProps) {
    super(props.id);
    this.username = props.username;
    this.passwordHash = props.passwordHash;
    this.role = props.role;
    this.createdAt = props.createdAt;
  }

  /** Only PasswordHasher should ever see the hash — keeps the comparison logic in one place. */
  getPasswordHash(): string {
    return this.passwordHash;
  }

  toPublic(): PublicUser {
    return { id: this.id, username: this.username, role: this.role, createdAt: this.createdAt };
  }
}
