import "server-only";
import { cookies } from "next/headers";
import { SESSION_COOKIE_NAME, SESSION_MAX_AGE_SECONDS } from "./constants";
import { signSessionToken, verifySessionToken, type SessionPayload } from "./token";
import { userRepository } from "@/repositories/UserRepository";
import type { User } from "@/domain/User";

/** Signs a token for `user` and sets it as an httpOnly cookie. Only callable from a Route Handler/Server Action (cookie writes aren't allowed during a Server Component render). */
export async function createSession(user: User): Promise<void> {
  const token = await signSessionToken({ sub: user.id, username: user.username, role: user.role });
  const store = await cookies();
  store.set(SESSION_COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: SESSION_MAX_AGE_SECONDS,
  });
}

export async function destroySession(): Promise<void> {
  const store = await cookies();
  store.delete(SESSION_COOKIE_NAME);
}

/** Verifies the cookie's signature/expiry AND that the user it names still exists. Safe to call from a Server Component (read-only). */
export async function getSessionUser(): Promise<User | null> {
  const store = await cookies();
  const token = store.get(SESSION_COOKIE_NAME)?.value;
  const payload = await verifySessionToken(token);
  if (!payload) return null;

  const user = userRepository.findById(payload.sub);
  if (!user || user.username !== payload.username) return null;
  return user;
}

export async function getSessionPayload(): Promise<SessionPayload | null> {
  const store = await cookies();
  return verifySessionToken(store.get(SESSION_COOKIE_NAME)?.value);
}
