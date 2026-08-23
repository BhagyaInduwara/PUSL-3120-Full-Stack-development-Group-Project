import jwt from "jsonwebtoken";
import { env } from "../config/env.js";
import type { UserRole } from "../models/User.js";

const EXPIRES_IN = "7d";
export const SESSION_COOKIE_NAME = "flowerp_token";
export const SESSION_MAX_AGE_MS = 7 * 24 * 60 * 60 * 1000;

export interface JwtPayload {
  sub: string;
  username: string;
  role: UserRole;
}

export function signToken(payload: JwtPayload): string {
  return jwt.sign(payload, env.jwtSecret, { expiresIn: EXPIRES_IN });
}

export function verifyToken(token: string): JwtPayload | null {
  try {
    return jwt.verify(token, env.jwtSecret) as JwtPayload;
  } catch {
    return null;
  }
}
