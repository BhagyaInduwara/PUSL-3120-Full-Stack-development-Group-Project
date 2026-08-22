import { NextRequest, NextResponse } from "next/server";
import { userRepository } from "@/repositories/UserRepository";
import { PasswordHasher } from "@/server/auth/PasswordHasher";
import { getSessionUser } from "@/server/auth/session";
import { User, type UserRole } from "@/domain/User";

export async function GET() {
  const sessionUser = await getSessionUser();
  if (!sessionUser) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  return NextResponse.json({ users: userRepository.findAll().map((u) => u.toPublic()) });
}

export async function POST(request: NextRequest) {
  const sessionUser = await getSessionUser();
  if (!sessionUser) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (sessionUser.role !== "admin") {
    return NextResponse.json({ error: "Admin access required." }, { status: 403 });
  }

  const body = await request.json().catch(() => null);
  const username = typeof body?.username === "string" ? body.username.trim() : "";
  const password = typeof body?.password === "string" ? body.password : "";
  const role: UserRole = body?.role === "admin" ? "admin" : "staff";

  if (username.length < 3) {
    return NextResponse.json({ error: "Username must be at least 3 characters." }, { status: 400 });
  }
  if (password.length < 6) {
    return NextResponse.json({ error: "Password must be at least 6 characters." }, { status: 400 });
  }
  if (userRepository.findByUsername(username)) {
    return NextResponse.json({ error: "That username is already taken." }, { status: 409 });
  }

  const user = new User({
    id: userRepository.nextId(),
    username,
    passwordHash: await PasswordHasher.hash(password),
    role,
    createdAt: new Date().toISOString(),
  });
  userRepository.add(user);

  return NextResponse.json({ user: user.toPublic() }, { status: 201 });
}
