import type { NextFunction, Request, Response } from "express";
import { SESSION_COOKIE_NAME, verifyToken, type JwtPayload } from "../utils/jwt.js";

// Augment Express's Request type so `req.user` is typed everywhere it's read.
declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    interface Request {
      user?: JwtPayload;
    }
  }
}

/** Rejects the request with 401 unless a valid session cookie is present. Attaches the token's claims to req.user. */
export function requireAuth(req: Request, res: Response, next: NextFunction): void {
  const token = req.cookies?.[SESSION_COOKIE_NAME];
  const payload = token ? verifyToken(token) : null;

  if (!payload) {
    res.status(401).json({ error: "Not authenticated." });
    return;
  }

  req.user = payload;
  next();
}

/** Chain after requireAuth. Rejects with 403 unless the session belongs to an admin. */
export function requireAdmin(req: Request, res: Response, next: NextFunction): void {
  if (req.user?.role !== "admin") {
    res.status(403).json({ error: "Admin access required." });
    return;
  }
  next();
}
