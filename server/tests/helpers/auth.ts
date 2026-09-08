import { signToken, SESSION_COOKIE_NAME } from "../../src/utils/jwt.js";

/**
 * Mints a valid session cookie directly (bypassing the /api/auth/login HTTP
 * flow) for tests that need an authenticated request but aren't testing
 * login itself — the Orders/Invoices/Shipments routes tested here only care
 * that `requireAuth` accepts the request. `requireAuth` (src/middleware/
 * auth.ts) verifies the JWT's signature/claims and never looks the user up
 * in the database, so no User document needs to exist for this to work.
 */
export function authCookie(): string {
  const token = signToken({ sub: "000000000000000000000001", username: "testadmin", role: "admin" });
  return `${SESSION_COOKIE_NAME}=${token}`;
}
