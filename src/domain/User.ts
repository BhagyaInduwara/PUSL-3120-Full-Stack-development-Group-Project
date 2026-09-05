import { Entity } from "./Entity";

export type UserRole = "admin" | "staff";

export interface UserProps {
  id: string;
  username: string;
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
 * User — login identity for the app, as seen from the Next.js side. The
 * password hash never reaches this class at all: it lives only in MongoDB,
 * behind the Express backend's `User` model (`select: false` on
 * `passwordHash`, checked server-side by auth.controller.ts — see
 * server/src/models/User.ts). This class is built purely from a verified
 * JWT's claims (see src/server/auth/session.ts's `getSessionUser()`), so
 * `toPublic()` has nothing sensitive to accidentally leak in the first
 * place.
 */
export class User extends Entity {
  readonly username: string;
  readonly role: UserRole;
  readonly createdAt: string;

  constructor(props: UserProps) {
    super(props.id);
    this.username = props.username;
    this.role = props.role;
    this.createdAt = props.createdAt;
  }

  toPublic(): PublicUser {
    return { id: this.id, username: this.username, role: this.role, createdAt: this.createdAt };
  }
}
