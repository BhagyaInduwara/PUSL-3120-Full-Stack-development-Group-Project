import { NextRequest, NextResponse } from "next/server";
import { userRepository } from "@/repositories/UserRepository";
import { PasswordHasher } from "@/server/auth/PasswordHasher";
import { createSession } from "@/server/auth/session";

// A real bcrypt hash of an unrelated random string — compared against when
// the username doesn't exist, so "no such user" and "wrong password" take
// roughly the same time and a timing attack can't be used to enumerate
// valid usernames.
const DUMMY_HASH = "$2a$10$CwTycUXWue0Thq9StjUM0uJ8Nx.YonBn1BFF97gjfWzuGvpQ.HxKq";

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => null);
  const username = typeof body?.username === "string" ? body.username.trim() : "";
  const password = typeof body?.password === "string" ? body.password : "";

  if (!username || !password) {
    return NextResponse.json({ error: "Username and password are required." }, { status: 400 });
  }

  const user = userRepository.findByUsername(username);
  const valid = await PasswordHasher.verify(password, user?.getPasswordHash() ?? DUMMY_HASH);

  if (!user || !valid) {
    return NextResponse.json({ error: "Invalid username or password." }, { status: 401 });
  }

  await createSession(user);
  return NextResponse.json({ user: user.toPublic() });
}
