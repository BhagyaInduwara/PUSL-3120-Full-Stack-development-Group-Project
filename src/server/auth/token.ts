import "server-only";
import { SESSION_MAX_AGE_SECONDS } from "./constants";

/**
 * Session tokens — standard 3-part HS256 JWT (header.payload.signature)
 * built with the Web Crypto API. Compatible with tokens signed by jsonwebtoken
 * on the Express backend as well as tokens signed here in Next.js.
 */
export interface SessionPayload {
  sub: string;
  username: string;
  role: "admin" | "staff";
  iat?: number;
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
  const secret = process.env.JWT_SECRET || process.env.AUTH_SECRET;
  if (!secret) {
    throw new Error("JWT_SECRET is not set. Copy it from .env.example into your .env.local.");
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

/** Signs a standard 3-part HS256 JWT token */
export async function signSessionToken(payload: Pick<SessionPayload, "sub" | "username" | "role">): Promise<string> {
  const now = Math.floor(Date.now() / 1000);
  const full: SessionPayload = { ...payload, iat: now, exp: now + SESSION_MAX_AGE_SECONDS };
  const headerPart = base64UrlEncode(new TextEncoder().encode(JSON.stringify({ alg: "HS256", typ: "JWT" })));
  const payloadPart = base64UrlEncode(new TextEncoder().encode(JSON.stringify(full)));
  const dataToSign = `${headerPart}.${payloadPart}`;

  const key = await getHmacKey();
  const signature = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(dataToSign));
  const signaturePart = base64UrlEncode(new Uint8Array(signature));
  return `${dataToSign}.${signaturePart}`;
}

/** Verifies a standard 3-part (or legacy 2-part) JWT signature and expiry. Returns null if invalid. */
export async function verifySessionToken(token: string | undefined | null): Promise<SessionPayload | null> {
  if (!token) return null;
  const parts = token.split(".");
  if (parts.length !== 3 && parts.length !== 2) return null;

  const key = await getHmacKey();

  if (parts.length === 3) {
    const [headerPart, payloadPart, signaturePart] = parts;
    const dataToVerify = `${headerPart}.${payloadPart}`;
    const valid = await crypto.subtle.verify(
      "HMAC",
      key,
      base64UrlDecode(signaturePart) as BufferSource,
      new TextEncoder().encode(dataToVerify)
    );
    if (!valid) return null;

    try {
      const payload = JSON.parse(new TextDecoder().decode(base64UrlDecode(payloadPart))) as SessionPayload;
      if (payload.exp && payload.exp < Math.floor(Date.now() / 1000)) return null;
      return payload;
    } catch {
      return null;
    }
  } else {
    // Legacy 2-part format compatibility
    const [payloadPart, signaturePart] = parts;
    const valid = await crypto.subtle.verify(
      "HMAC",
      key,
      base64UrlDecode(signaturePart) as BufferSource,
      new TextEncoder().encode(payloadPart)
    );
    if (!valid) return null;

    try {
      const payload = JSON.parse(new TextDecoder().decode(base64UrlDecode(payloadPart))) as SessionPayload;
      if (payload.exp && payload.exp < Math.floor(Date.now() / 1000)) return null;
      return payload;
    } catch {
      return null;
    }
  }
}
