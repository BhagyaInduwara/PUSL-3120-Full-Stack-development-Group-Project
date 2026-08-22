/**
 * Plain constants shared by token.ts (used in both Edge middleware and
 * Node route handlers) and session.ts (Node-only). Kept dependency-free so
 * middleware.ts can import it without pulling anything Node-specific into
 * the Edge bundle.
 */
export const SESSION_COOKIE_NAME = "flowerp_session";
export const SESSION_MAX_AGE_SECONDS = 60 * 60 * 24 * 7; // 7 days
