import type { Request, Response } from "express";
import { User, toPublicUser, USER_ROLES, type UserRole } from "../models/User.js";
import { hashPassword } from "../utils/passwordHasher.js";

function isValidRole(value: unknown): value is UserRole {
  return typeof value === "string" && (USER_ROLES as readonly string[]).includes(value);
}

/** GET /api/users — any authenticated user. */
export async function listUsers(_req: Request, res: Response): Promise<void> {
  const users = await User.find().sort({ createdAt: 1 });
  res.json({ users: users.map(toPublicUser) });
}

/** POST /api/users — admin only (see requireAdmin in the route). Lets an admin provision an account directly, alongside public /register. */
export async function createUser(req: Request, res: Response): Promise<void> {
  const username = typeof req.body?.username === "string" ? req.body.username.trim() : "";
  const password = typeof req.body?.password === "string" ? req.body.password : "";
  const role: UserRole = USER_ROLES.includes(req.body?.role) ? req.body.role : "staff";

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

  const user = await User.create({ username, passwordHash: await hashPassword(password), role });
  res.status(201).json({ user: toPublicUser(user) });
}

/**
 * PUT /api/users/:id — admin only (see requireAdmin in the route).
 * username/role/password are all optional; password is only re-hashed when
 * a non-empty value is sent, so leaving it blank keeps the current one.
 */
export async function updateUser(req: Request, res: Response): Promise<void> {
  const patch: Record<string, unknown> = {};

  if (req.body?.username !== undefined) {
    const username = typeof req.body.username === "string" ? req.body.username.trim() : "";
    if (username.length < 3) {
      res.status(400).json({ error: "Username must be at least 3 characters." });
      return;
    }
    const existing = await User.findOne({ username: username.toLowerCase(), _id: { $ne: req.params.id } });
    if (existing) {
      res.status(409).json({ error: "That username is already taken." });
      return;
    }
    patch.username = username;
  }

  if (req.body?.role !== undefined) {
    if (!isValidRole(req.body.role)) {
      res.status(400).json({ error: `Role must be one of: ${USER_ROLES.join(", ")}.` });
      return;
    }
    patch.role = req.body.role;
  }

  if (req.body?.password !== undefined && req.body.password !== "") {
    const password = typeof req.body.password === "string" ? req.body.password : "";
    if (password.length < 6) {
      res.status(400).json({ error: "Password must be at least 6 characters." });
      return;
    }
    patch.passwordHash = await hashPassword(password);
  }

  const user = await User.findByIdAndUpdate(req.params.id, { $set: patch }, { new: true, runValidators: true });
  if (!user) {
    res.status(404).json({ error: "User not found." });
    return;
  }
  res.json({ user: toPublicUser(user) });
}
