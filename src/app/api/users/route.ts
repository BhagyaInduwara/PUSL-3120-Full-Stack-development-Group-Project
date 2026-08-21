import { NextRequest, NextResponse } from "next/server";
import { BACKEND_URL } from "@/server/auth/constants";

/**
 * GET /api/users — proxies to Express backend with the session cookie forwarded.
 */
export async function GET(request: NextRequest) {
  try {
    const cookieHeader = request.headers.get("cookie") || "";
    const backendRes = await fetch(`${BACKEND_URL}/api/users`, {
      method: "GET",
      headers: {
        Cookie: cookieHeader,
      },
    });

    const data = await backendRes.json().catch(() => ({}));
    return NextResponse.json(data, { status: backendRes.status });
  } catch (err) {
    console.error("[api/users] Failed to fetch users from backend:", err);
    return NextResponse.json({ error: "Backend server unavailable." }, { status: 503 });
  }
}

/**
 * POST /api/users — proxies admin user creation to Express backend with session cookie forwarded.
 */
export async function POST(request: NextRequest) {
  try {
    const cookieHeader = request.headers.get("cookie") || "";
    const body = await request.json().catch(() => null);

    const backendRes = await fetch(`${BACKEND_URL}/api/users`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Cookie: cookieHeader,
      },
      body: JSON.stringify(body),
    });

    const data = await backendRes.json().catch(() => ({}));
    return NextResponse.json(data, { status: backendRes.status });
  } catch (err) {
    console.error("[api/users] Failed to create user on backend:", err);
    return NextResponse.json({ error: "Backend server unavailable." }, { status: 503 });
  }
}
