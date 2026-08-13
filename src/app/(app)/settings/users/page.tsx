import { getSessionUser } from "@/server/auth/session";
import { userRepository } from "@/repositories/UserRepository";
import { UsersManager } from "@/components/settings/UsersManager";

/**
 * Users settings — a Server Component, unlike every other Settings tab
 * (which are client components reading ERPStore). That's deliberate: this
 * is the one screen that touches UserRepository, and UserRepository must
 * never be imported from a "use client" file (see its own doc comment) or
 * password hashes could end up in the client bundle. Fetching server-side
 * here, then handing only the already-public {id, username, role,
 * createdAt} shape down to UsersManager, is what keeps that guarantee.
 */
export default async function UsersSettingsPage() {
  const sessionUser = await getSessionUser();
  const users = userRepository.findAll().map((user) => user.toPublic());

  return <UsersManager users={users} isAdmin={sessionUser?.role === "admin"} />;
}
