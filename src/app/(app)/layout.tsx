import { redirect } from "next/navigation";
import { ERPStoreProvider } from "@/store/ERPStoreProvider";
import { Sidebar } from "@/components/layout/Sidebar";
import { getSessionUser } from "@/server/auth/session";

/**
 * (app) group layout — the shell every authenticated screen shares
 * (ERPStoreProvider + Sidebar). Reads the session server-side via
 * getSessionUser() and passes the public user down to Sidebar, so it can
 * show the real signed-in user instead of a hardcoded name.
 *
 * The redirect() here is a belt-and-suspenders check, not the primary
 * guard — middleware.ts already redirects unauthenticated requests to
 * /login before this layout ever renders. This just means the app never
 * renders the shell for a null user even if middleware's matcher were
 * ever misconfigured.
 */
export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const user = await getSessionUser();
  if (!user) redirect("/login");

  return (
    <ERPStoreProvider>
      <div className="flex h-screen bg-[var(--color-bg)] text-[var(--color-text)] font-[family-name:var(--font-body)] overflow-hidden">
        <Sidebar user={user.toPublic()} />
        <div className="flex-1 flex flex-col overflow-hidden min-w-0">{children}</div>
      </div>
    </ERPStoreProvider>
  );
}
