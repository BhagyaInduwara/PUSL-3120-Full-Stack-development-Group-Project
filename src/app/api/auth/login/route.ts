import { NextRequest, NextResponse } from "next/server";
import { BACKEND_URL, SESSION_COOKIE_NAME, SESSION_MAX_AGE_SECONDS } from "@/server/auth/constants";
import type { LoginInput, AuthResponse, ApiErrorResponse } from "@/server/auth/types";

/**
 * POST /api/auth/login
 * Proxies login credentials to the Express backend (localhost:4000/api/auth/login).
 * On success, sets the backend's JWT cookie on the browser and returns the user.
 */
export async function POST(
  request: NextRequest
): Promise<NextResponse<AuthResponse | ApiErrorResponse>> {
  const body = (await request.json().catch(() => null)) as Partial<LoginInput> | null;
  const username = typeof body?.username === "string" ? body.username.trim() : "";
  const password = typeof body?.password === "string" ? body.password : "";

  if (!username || !password) {
    return NextResponse.json({ error: "Username and password are required." }, { status: 400 });
  }

  try {
    const backendRes = await fetch(`${BACKEND_URL}/api/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username, password }),
    });

    const data = await backendRes.json().catch(() => ({}));

    if (!backendRes.ok) {
      return NextResponse.json(
        { error: data.error || "Invalid username or password." },
        { status: backendRes.status }
      );
    }

    const response = NextResponse.json({ user: data.user });

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
    console.error("[auth] Failed to reach backend:", err);
    return NextResponse.json(
      { error: "Could not reach backend server. Please make sure the server is running on port 4000." },
      { status: 503 }
    );
  }
}
