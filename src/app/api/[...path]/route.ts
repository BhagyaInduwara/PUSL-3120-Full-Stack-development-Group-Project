import { NextRequest, NextResponse } from "next/server";
import { BACKEND_URL } from "@/server/auth/constants";

/**
 * Catch-all proxy for every backend endpoint that isn't already handled by
 * its own explicit route (auth/*, users/*, users/[id]) — forwards to the
 * real Express backend server-to-server, with the session cookie attached
 * manually via header.
 *
 * This exists because the browser can't be trusted to carry a cookie
 * across to the backend's own (different) domain directly: modern browsers
 * block third-party cookies outright — Chrome does this by default in
 * Incognito, and it's rolling out more broadly — regardless of how
 * correctly SameSite/Secure are configured on the backend's cookie. See
 * CLAUDE.md "Authentication & Users" for the full story; the short version
 * is that setting the backend's own cookie via a direct cross-origin fetch
 * (what login/page.tsx and Sidebar.tsx's logout used to also do) looks
 * like it succeeds — the response comes back 200 — but the browser quietly
 * refuses to actually store the cookie, so every later direct backend
 * call still comes back 401.
 *
 * Routing every data call through this same-origin proxy instead means
 * the browser only ever needs its one, ordinary, same-site cookie (the
 * one proxy.ts already checks); the Cookie header this forwards to the
 * backend is a plain server-to-server HTTP header, not subject to any
 * browser cookie policy at all.
 */
async function proxy(request: NextRequest, path: string[]): Promise<NextResponse> {
  const url = `${BACKEND_URL}/api/${path.join("/")}${request.nextUrl.search}`;

  const init: RequestInit = {
    method: request.method,
    headers: { Cookie: request.headers.get("cookie") ?? "" },
  };

  if (request.method !== "GET" && request.method !== "HEAD") {
    const body = await request.text();
    if (body) {
      init.body = body;
      (init.headers as Record<string, string>)["Content-Type"] =
        request.headers.get("content-type") ?? "application/json";
    }
  }

  try {
    const backendRes = await fetch(url, init);
    // 204/205/304 are "null body" statuses per the Fetch spec — the Response
    // constructor throws if given a body (even "") alongside one of these.
    if (backendRes.status === 204 || backendRes.status === 205 || backendRes.status === 304) {
      return new NextResponse(null, { status: backendRes.status });
    }
    const data = await backendRes.text();
    return new NextResponse(data, {
      status: backendRes.status,
      headers: { "Content-Type": backendRes.headers.get("content-type") ?? "application/json" },
    });
  } catch (err) {
    console.error(`[api proxy] Failed to reach backend at ${url}:`, err);
    return NextResponse.json({ error: "Could not reach backend server." }, { status: 503 });
  }
}

interface RouteParams {
  params: Promise<{ path: string[] }>;
}

export async function GET(request: NextRequest, { params }: RouteParams) {
  return proxy(request, (await params).path);
}
export async function POST(request: NextRequest, { params }: RouteParams) {
  return proxy(request, (await params).path);
}
export async function PUT(request: NextRequest, { params }: RouteParams) {
  return proxy(request, (await params).path);
}
export async function PATCH(request: NextRequest, { params }: RouteParams) {
  return proxy(request, (await params).path);
}
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  return proxy(request, (await params).path);
}
