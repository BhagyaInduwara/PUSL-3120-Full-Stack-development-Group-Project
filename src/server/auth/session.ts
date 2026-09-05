import "server-only";
import { cookies } from "next/headers";
import { SESSION_COOKIE_NAME, SESSION_MAX_AGE_SECONDS } from "./constants";
import { signSessionToken, verifySessionToken, type SessionPayload } from "./token";
import { User } from "@/domain/User";

/** Signs a token for `user` and sets it as an httpOnly cookie. Used for session creation in Next.js. */
export async function createSession(user: Pick<User, "id" | "username" | "role">): Promise<void> {
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

/** Verifies the cookie's signature/expiry and returns the authenticated User instance based on JWT claims. */
export async function getSessionUser(): Promise<User | null> {
  const store = await cookies();
  const token = store.get(SESSION_COOKIE_NAME)?.value;
  const payload = await verifySessionToken(token);
  if (!payload) return null;

  return new User({
    id: payload.sub,
    username: payload.username,
    role: payload.role,
    createdAt: new Date((payload.iat ?? Date.now() / 1000) * 1000).toISOString(),
  });
}

export async function getSessionPayload(): Promise<SessionPayload | null> {
  const store = await cookies();
  return verifySessionToken(store.get(SESSION_COOKIE_NAME)?.value);
}
