import { NextRequest, NextResponse } from "next/server";
import { BACKEND_URL } from "@/server/auth/constants";

/**
 * PUT /api/users/:id — proxies admin user edits to the Express backend with
 * the session cookie forwarded, same pattern as POST /api/users.
 */
export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  try {
    const cookieHeader = request.headers.get("cookie") || "";
    const body = await request.json().catch(() => null);

    const backendRes = await fetch(`${BACKEND_URL}/api/users/${id}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Cookie: cookieHeader,
      },
      body: JSON.stringify(body),
    });

    const data = await backendRes.json().catch(() => ({}));
    return NextResponse.json(data, { status: backendRes.status });
  } catch (err) {
    console.error("[api/users/:id] Failed to update user on backend:", err);
    return NextResponse.json({ error: "Backend server unavailable." }, { status: 503 });
  }
}
