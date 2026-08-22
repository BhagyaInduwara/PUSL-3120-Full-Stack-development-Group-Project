import "server-only";
import { SESSION_MAX_AGE_SECONDS } from "./constants";

/**
 * Session tokens — a small hand-rolled signed token (payload + HMAC-SHA256
 * signature, base64url-encoded, dot-separated — the same shape as a JWT,
 * without pulling in a JWT library), built on the Web Crypto API so the
 * exact same code verifies a session in both runtimes the app uses it in:
 * Node.js (API routes, Server Components) and Edge (middleware.ts). No
 * server-side session store is needed — the signature is what makes the
 * token trustworthy, so any process holding AUTH_SECRET can verify one.
 *
 * This intentionally does NOT look up the user in the database on every
 * request (that would require Node-only repository/bcrypt code inside Edge
 * middleware, which can't run there) — it trusts the username/role baked
 * into the token at login time until it expires. Good enough for a single
 * "V1" admin app; a revocable-session table is a natural follow-up once
 * the database is real.
 */
export interface SessionPayload {
  sub: string;
  username: string;
  role: "admin" | "staff";
  iat: number;
  exp: number;
}

function base64UrlEncode(bytes: Uint8Array): string {
  let binary = "";
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

function base64UrlDecode(value: string): Uint8Array {
  const padded = value.replace(/-/g, "+").replace(/_/g, "/").padEnd(value.length + ((4 - (value.length % 4)) % 4), "=");
  const binary = atob(padded);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  return bytes;
}

function getSecret(): string {
  const secret = process.env.AUTH_SECRET;
  if (!secret) {
    throw new Error("AUTH_SECRET is not set. Copy it from .env.example into your .env.");
  }
  return secret;
}

async function getHmacKey(): Promise<CryptoKey> {
  return crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(getSecret()),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign", "verify"]
  );
}

export async function signSessionToken(payload: Pick<SessionPayload, "sub" | "username" | "role">): Promise<string> {
  const now = Math.floor(Date.now() / 1000);
  const full: SessionPayload = { ...payload, iat: now, exp: now + SESSION_MAX_AGE_SECONDS };
  const payloadPart = base64UrlEncode(new TextEncoder().encode(JSON.stringify(full)));
  const key = await getHmacKey();
  const signature = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(payloadPart));
  const signaturePart = base64UrlEncode(new Uint8Array(signature));
  return `${payloadPart}.${signaturePart}`;
}

/** Verifies the signature (timing-safe, via crypto.subtle.verify) and expiry. Returns null if either check fails. */
export async function verifySessionToken(token: string | undefined | null): Promise<SessionPayload | null> {
  if (!token) return null;
  const [payloadPart, signaturePart] = token.split(".");
  if (!payloadPart || !signaturePart) return null;

  const key = await getHmacKey();
  const valid = await crypto.subtle.verify(
    "HMAC",
    key,
    base64UrlDecode(signaturePart) as BufferSource,
    new TextEncoder().encode(payloadPart)
  );
  if (!valid) return null;

  try {
    const payload = JSON.parse(new TextDecoder().decode(base64UrlDecode(payloadPart))) as SessionPayload;
    if (payload.exp < Math.floor(Date.now() / 1000)) return null;
    return payload;
  } catch {
    return null;
  }
}
