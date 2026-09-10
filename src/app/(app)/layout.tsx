import { redirect } from "next/navigation";
import { Sidebar } from "@/components/layout/Sidebar";
import { OfflineBanner } from "@/components/ui/OfflineBanner";
import { SocketProvider } from "@/components/providers/SocketProvider";
import { getSessionUser } from "@/server/auth/session";

/**
 * (app) group layout — the shell every authenticated screen shares
 * (Sidebar + content). Reads the session server-side via getSessionUser()
 * and passes the public user down to Sidebar, so it can show the real
 * signed-in user instead of a hardcoded name.
 *
 * All screens now persist to and fetch directly from MongoDB via Express APIs,
 * so the legacy ERPStoreProvider has been decommissioned.
 *
 * SocketProvider is mounted here (not per-page) so the Socket.io connection
 * is established once per authenticated session and shared by every screen
 * via useLiveEvent() — this only runs once a session is confirmed above,
 * matching the backend handshake's own auth requirement.
 *
 * An OfflineBanner is mounted at the top of the content area to alert users
 * whenever network connectivity is interrupted.
 */
export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const user = await getSessionUser();
  if (!user) redirect("/login");

  return (
    <SocketProvider>
      <div className="flex h-screen bg-[var(--color-bg)] text-[var(--color-text)] font-[family-name:var(--font-body)] overflow-hidden">
        <Sidebar user={user.toPublic()} />
        <div className="flex-1 flex flex-col overflow-hidden min-w-0">
          <OfflineBanner />
          {children}
        </div>
      </div>
    </SocketProvider>
  );
}
