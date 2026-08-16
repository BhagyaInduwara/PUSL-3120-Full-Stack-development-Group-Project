import { NextRequest, NextResponse } from "next/server";
import { BACKEND_URL, SESSION_COOKIE_NAME, SESSION_MAX_AGE_SECONDS } from "@/server/auth/constants";
import type { RegisterInput, AuthResponse, ApiErrorResponse } from "@/server/auth/types";

/**
 * POST /api/auth/register
 * Proxies new user registration to the Express backend (localhost:4000/api/auth/register).
 * On success (201 Created), sets the backend's JWT cookie on the browser and returns the user.
 */
export async function POST(
  request: NextRequest
): Promise<NextResponse<AuthResponse | ApiErrorResponse>> {
  const body = (await request.json().catch(() => null)) as Partial<RegisterInput> | null;
  const username = typeof body?.username === "string" ? body.username.trim() : "";
  const password = typeof body?.password === "string" ? body.password : "";

  if (!username || !password) {
    return NextResponse.json({ error: "Username and password are required." }, { status: 400 });
  }

  try {
    const backendRes = await fetch(`${BACKEND_URL}/api/auth/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username, password }),
    });

    const data = await backendRes.json().catch(() => ({}));

    if (!backendRes.ok) {
      return NextResponse.json(
        { error: data.error || "Failed to register user." },
        { status: backendRes.status }
      );
    }

    const response = NextResponse.json({ user: data.user }, { status: 201 });

    // Extract JWT cookie from backend Set-Cookie header
    const setCookie = backendRes.headers.get("set-cookie");
    if (setCookie) {
      const match = setCookie.match(new RegExp(`${SESSION_COOKIE_NAME}=([^;]+)`));
      if (match && match[1]) {
        response.cookies.set(SESSION_COOKIE_NAME, match[1], {
          httpOnly: true,
          secure: process.env.NODE_ENV === "production",
          sameSite: "lax",
          path: "/",
          maxAge: SESSION_MAX_AGE_SECONDS,
        });
      }
    }

    return response;
  } catch (err) {
    console.error("[auth] Failed to reach backend for registration:", err);
    return NextResponse.json(
      { error: "Could not reach backend server. Please make sure the server is running on port 4000." },
      { status: 503 }
    );
  }
}
