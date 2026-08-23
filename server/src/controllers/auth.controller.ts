import type { Request, Response } from "express";
import { User, toPublicUser, type UserRole } from "../models/User.js";
import { hashPassword, verifyPassword } from "../utils/passwordHasher.js";
import { signToken, SESSION_COOKIE_NAME, SESSION_MAX_AGE_MS } from "../utils/jwt.js";
import { env } from "../config/env.js";
import type { LoginInput, RegisterInput, AuthResponseDto, ApiErrorResponseDto } from "../types/auth.types.js";


// A real bcrypt hash of an unrelated random string — compared against when
// the username doesn't exist, so "no such user" and "wrong password" take
// roughly the same time and can't be used to enumerate valid usernames.
const DUMMY_HASH = "$2a$10$CwTycUXWue0Thq9StjUM0uJ8Nx.YonBn1BFF97gjfWzuGvpQ.HxKq";

function cookieOptions() {
  return {
    httpOnly: true,
    secure: env.isProduction,
    // "lax" works for same-site-but-cross-port local dev (localhost:3000 <-> localhost:4000).
    // A production deploy where frontend/backend are on different domains needs "none" + secure (HTTPS).
    sameSite: env.isProduction ? ("none" as const) : ("lax" as const),
    path: "/",
    maxAge: SESSION_MAX_AGE_MS,
  };
}

/** POST /api/auth/register — public self-service registration. Creates new user (201 Created). */
export async function register(
  req: Request<{}, {}, RegisterInput>,
  res: Response<AuthResponseDto | ApiErrorResponseDto>
): Promise<void> {
  const username = typeof req.body?.username === "string" ? req.body.username.trim() : "";
  const password = typeof req.body?.password === "string" ? req.body.password : "";

  if (username.length < 3) {
    res.status(400).json({ error: "Username must be at least 3 characters." });
    return;
  }
  if (password.length < 6) {
    res.status(400).json({ error: "Password must be at least 6 characters." });
    return;
  }

  const existing = await User.findOne({ username: username.toLowerCase() });
  if (existing) {
    res.status(409).json({ error: "That username is already taken." });
    return;
  }

  const user = await User.create({
    username,
    passwordHash: await hashPassword(password),
    role: "staff",
  });

  const token = signToken({ sub: user._id.toString(), username: user.username, role: user.role as UserRole });
  res.cookie(SESSION_COOKIE_NAME, token, cookieOptions());
  res.status(201).json({ user: toPublicUser(user) });
}

/** POST /api/auth/login — authenticates user credentials, creates session cookie (200 OK). */
export async function login(
  req: Request<{}, {}, LoginInput>,
  res: Response<AuthResponseDto | ApiErrorResponseDto>
): Promise<void> {
  const username = typeof req.body?.username === "string" ? req.body.username.trim() : "";
  const password = typeof req.body?.password === "string" ? req.body.password : "";

  if (!username || !password) {
    res.status(400).json({ error: "Username and password are required." });
    return;
  }

  const user = await User.findOne({ username: username.toLowerCase() }).select("+passwordHash");
  const valid = await verifyPassword(password, user?.passwordHash ?? DUMMY_HASH);

  if (!user || !valid) {
    res.status(401).json({ error: "Invalid username or password." });
    return;
  }

  const token = signToken({ sub: user._id.toString(), username: user.username, role: user.role as UserRole });
  res.cookie(SESSION_COOKIE_NAME, token, cookieOptions());
  res.status(200).json({ user: toPublicUser(user) });
}

/** POST /api/auth/logout & DELETE /api/auth/logout — clears session cookie (200 OK). */
export function logout(_req: Request, res: Response<{ ok: boolean }>): void {
  res.clearCookie(SESSION_COOKIE_NAME, { path: "/" });
  res.status(200).json({ ok: true });
}

/** GET /api/auth/me — retrieves authenticated user shape (200 OK). */
export async function me(
  req: Request,
  res: Response<AuthResponseDto | ApiErrorResponseDto>
): Promise<void> {
  const user = await User.findById(req.user!.sub);
  if (!user) {
    res.status(401).json({ error: "Not authenticated." });
    return;
  }
  res.status(200).json({ user: toPublicUser(user) });
}

