import jwt from "jsonwebtoken";

/**
 * Signs a valid JWT and returns it as a cookie string that Supertest can
 * attach via `.set("Cookie", ...)`.  Uses the same secret that was set
 * in db.ts before the app was imported.
 */
export function getAuthCookie(): string {
  const token = jwt.sign(
    { sub: "000000000000000000000001", username: "testuser", role: "admin" },
    process.env.JWT_SECRET!,
    { expiresIn: "1h" }
  );
  return `flowerp_token=${token}`;
}
