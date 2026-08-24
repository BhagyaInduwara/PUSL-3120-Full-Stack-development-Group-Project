/**
 * The Express backend's base URL, for client-side fetches (pages under
 * "use client" run in the browser, so this needs the NEXT_PUBLIC_ prefix
 * to be embedded in the bundle at build time — see
 * https://nextjs.org/docs/app/guides/environment-variables).
 *
 * Defaults to localhost:4000 for local dev; in production (Vercel) this
 * must be set to wherever /server is actually deployed (e.g. Render),
 * or every client-side fetch silently tries to reach the visitor's own
 * machine instead of the real backend.
 */
export const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000";
