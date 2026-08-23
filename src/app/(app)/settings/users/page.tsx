import { cookies } from "next/headers";
import { getSessionUser } from "@/server/auth/session";
import { BACKEND_URL, SESSION_COOKIE_NAME } from "@/server/auth/constants";
import { UsersManager } from "@/components/settings/UsersManager";
import type { PublicUser } from "@/domain/User";

/**
 * Users settings — Server Component fetching real users from MongoDB via Express backend.
 */
export default async function UsersSettingsPage() {
  const sessionUser = await getSessionUser();
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE_NAME)?.value;

  let users: PublicUser[] = [];
  try {
    const res = await fetch(`${BACKEND_URL}/api/users`, {
      headers: {
        Cookie: token ? `${SESSION_COOKIE_NAME}=${token}` : "",
      },
      cache: "no-store",
    });
    if (res.ok) {
      const data = await res.json();
      users = data.users || [];
    }
  } catch (err) {
    console.error("[settings/users] Failed to fetch users:", err);
  }

  return <UsersManager users={users} isAdmin={sessionUser?.role === "admin"} />;
}
