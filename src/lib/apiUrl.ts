/**
 * Base URL client-side pages prefix onto every API path, e.g.
 * `${API_URL}/api/orders`. This is intentionally empty — every such call
 * now goes through this app's own same-origin catch-all proxy
 * (src/app/api/[...path]/route.ts), which forwards it server-to-server to
 * the real Express backend with the session cookie attached manually.
 *
 * It used to point straight at the backend's own domain
 * (NEXT_PUBLIC_API_URL), which works fine locally (frontend/backend share
 * the "localhost" hostname) but breaks once frontend and backend are on
 * genuinely different domains in production: modern browsers block
 * third-party cookies, so a cookie set by the backend's domain while
 * browsing the frontend's domain never actually gets stored, no matter
 * how correctly SameSite/Secure are configured — see the proxy route's
 * own comment, and CLAUDE.md "Authentication & Users", for the full story.
 */
export const API_URL = "";
