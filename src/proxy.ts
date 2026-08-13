import { NextRequest, NextResponse } from "next/server";
import { verifySessionToken } from "@/server/auth/token";
import { SESSION_COOKIE_NAME } from "@/server/auth/constants";

/**
 * Route guard — Next.js's Proxy convention (renamed from "Middleware" in
 * v16; this file used to be middleware.ts / export function middleware()).
 * Runs before any page renders, on every matched request. It only ever
 * imports token.ts/constants.ts (no bcrypt, no repository) and trusts the
 * session token's signed claims rather than looking the user up again —
 * see token.ts for why that trade-off is fine for V1. That restraint also
 * means this same code would keep working if a future Next.js version (or
 * a non-Node deployment target) ever ran Proxy on the Edge runtime again,
 * even though v16 defaults it to Node.js.
 *
 * API routes are excluded from the matcher below — they guard themselves
 * (see src/app/api/*\/route.ts) and return 401 JSON rather than a redirect,
 * since redirecting a fetch() call to an HTML login page would just break
 * the caller.
 */
export async function proxy(request: NextRequest) {
  const token = request.cookies.get(SESSION_COOKIE_NAME)?.value;
  const payload = await verifySessionToken(token);
  const isLoginPage = request.nextUrl.pathname === "/login";

  if (!payload && !isLoginPage) {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("next", request.nextUrl.pathname);
    return NextResponse.redirect(loginUrl);
  }

  if (payload && isLoginPage) {
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)"],
};
