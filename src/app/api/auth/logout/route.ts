import { NextResponse } from "next/server";
import { destroySession } from "@/server/auth/session";
import type { SuccessResponse } from "@/server/auth/types";

/**
 * POST /api/auth/logout & DELETE /api/auth/logout
 * Destroys the current user session and clears the auth cookie.
 */
export async function POST(): Promise<NextResponse<SuccessResponse>> {
  await destroySession();
  return NextResponse.json({ ok: true });
}

export async function DELETE(): Promise<NextResponse<SuccessResponse>> {
  await destroySession();
  return NextResponse.json({ ok: true });
}

