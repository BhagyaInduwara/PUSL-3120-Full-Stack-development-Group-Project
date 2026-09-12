"use client";

import { useState, type ComponentType, type SVGProps } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  DashboardIcon,
  SalesIcon,
  InvoicingIcon,
  InventoryIcon,
  ShipmentIcon,
  ProductionIcon,
  SettingsIcon,
  LogoutIcon,
} from "@/components/icons";
import type { PublicUser } from "@/domain/User";
import { UserMenu } from "./UserMenu";
import { UserDetailDialog, type UserEditableFields } from "@/components/settings/UserDetailDialog";

interface NavItem {
  href: string;
  label: string;
  Icon: ComponentType<SVGProps<SVGSVGElement>>;
  badge?: string;
}

interface NavSection {
  title?: string;
  items: NavItem[];
}

const NAV_SECTIONS: NavSection[] = [
  {
    items: [
      { href: "/dashboard", label: "Dashboard", Icon: DashboardIcon },
    ],
  },
  {
    title: "Operations",
    items: [
      { href: "/sales", label: "Sales & Orders", Icon: SalesIcon },
      { href: "/invoicing", label: "Invoicing", Icon: InvoicingIcon },
      { href: "/inventory", label: "Inventory", Icon: InventoryIcon },
      { href: "/shipments", label: "Shipments", Icon: ShipmentIcon },
      { href: "/production", label: "Production", Icon: ProductionIcon },
    ],
  },
  {
    title: "Configuration",
    items: [
      { href: "/settings", label: "Settings", Icon: SettingsIcon },
    ],
  },
];

/**
 * Sidebar — self-contained: it owns its own collapsed/expanded state.
 * Because it's mounted once in (app)/layout.tsx, that state survives
 * client-side navigation between pages without needing to live in
 * ERPStore — it's UI-only, not domain data. `user` comes from the server
 * (see (app)/layout.tsx's getSessionUser()) rather than being fetched
 * client-side, so there's no logged-out flash on first paint.
 */
export function Sidebar({ user }: { user: PublicUser }) {
  const [expanded, setExpanded] = useState(true);
  const [loggingOut, setLoggingOut] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [profileSaveError, setProfileSaveError] = useState<string | null>(null);
  const pathname = usePathname();
  const router = useRouter();

  async function handleLogout() {
    setLoggingOut(true);
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/login");
    router.refresh();
  }

  /** Same PUT this same edit takes from Settings > Users — see UsersManager.handleSaveUser. */
  async function handleSaveProfile(patch: UserEditableFields) {
    setProfileSaveError(null);
    try {
      const res = await fetch(`/api/users/${user.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(patch),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setProfileSaveError(data.error ?? "Couldn't save your profile.");
        return;
      }
      setProfileOpen(false);
      router.refresh();
    } catch {
      setProfileSaveError("Couldn't reach the server. Please try again.");
    }
  }

  return (
    <div
      className="flex-none flex flex-col relative z-20 bg-[var(--color-surface)] border-r border-[var(--color-divider)] shadow-xs transition-[width] duration-200 ease-in-out"
      style={{ width: expanded ? 250 : 86 }}
    >
      <div className="flex items-center justify-between px-5 py-5 border-b border-[var(--color-divider)] min-h-[72px]">
        {expanded ? (
          <div className="flex items-center justify-between w-full min-w-0">
            <div className="flex flex-col min-w-0">
              <div className="font-[family-name:var(--font-heading)] text-[20px] font-extrabold tracking-tight leading-none text-[var(--color-text)] flex items-center gap-0.5">
                <span>Flow</span>
                <span className="text-[var(--color-accent)]">ERP</span>
                <span className="w-1.5 h-1.5 rounded-full bg-[var(--color-accent)] inline-block ml-0.5 animate-pulse" />
              </div>
              <span className="text-[10px] font-semibold text-[var(--color-neutral-400)] tracking-wider uppercase mt-1">
                Enterprise Suite
              </span>
            </div>
            <button
              type="button"
              onClick={() => setExpanded(false)}
              aria-label="Collapse sidebar"
              className="p-1.5 rounded-lg text-[var(--color-neutral-400)] hover:text-[var(--color-text)] hover:bg-[var(--color-surface-hover)] cursor-pointer transition-colors"
            >
              <span className="text-sm font-semibold">«</span>
            </button>
          </div>
        ) : (
          <div className="flex items-center justify-center w-full">
            <span className="font-[family-name:var(--font-heading)] text-[20px] font-extrabold tracking-tight text-[var(--color-accent)]">
              F<span className="text-[var(--color-text)]">.</span>
            </span>
          </div>
        )}
      </div>

      <nav className={`flex flex-col gap-6 py-5 flex-1 overflow-y-auto ${expanded ? "px-3.5" : "px-3"}`}>
        {NAV_SECTIONS.map((section, sIdx) => (
          <div key={sIdx} className="flex flex-col gap-1">
            {section.title && expanded && (
              <div className="px-3 pb-2 text-[11px] font-bold uppercase tracking-wider text-[var(--color-neutral-400)] select-none">
                {section.title}
              </div>
            )}
            {section.items.map(({ href, label, Icon }) => {
              const active = pathname?.startsWith(href) ?? false;
              return (
                <Link
                  key={href}
                  href={href}
                  title={label}
                  className={`flex items-center rounded-xl transition-all duration-150 cursor-pointer group relative ${
                    expanded
                      ? "gap-3.5 px-3.5 py-2.5 text-[14px] w-full text-left"
                      : "justify-center p-3 w-full"
                  } ${
                    active
                      ? "bg-[var(--color-accent)]/12 text-[var(--color-accent)] font-semibold shadow-2xs"
                      : "text-[var(--color-neutral-400)] hover:text-[var(--color-text)] hover:bg-[var(--color-surface-hover)] font-medium"
                  }`}
                >
                  <Icon
                    className={`flex-shrink-0 transition-colors ${
                      expanded ? "w-[18px] h-[18px]" : "w-[22px] h-[22px]"
                    } ${
                      active ? "text-[var(--color-accent)]" : "text-[var(--color-neutral-400)] group-hover:text-[var(--color-text)]"
                    }`}
                  />
                  {expanded && <span className="truncate flex-1">{label}</span>}
                  {active && (
                    <span className="absolute left-0 top-2 bottom-2 w-1 bg-[var(--color-accent)] rounded-r-full" />
                  )}
                </Link>
              );
            })}
          </div>
        ))}
      </nav>

      {!expanded && (
        <button
          type="button"
          onClick={() => setExpanded(true)}
          aria-label="Expand sidebar"
          className="mx-auto mb-3 p-3 rounded-xl text-sm font-bold text-[var(--color-neutral-400)] hover:text-[var(--color-text)] hover:bg-[var(--color-surface-hover)] cursor-pointer transition-colors"
        >
          »
        </button>
      )}

      <div className="p-3.5 pt-4 border-t border-[var(--color-divider)] flex items-center gap-2.5 bg-[var(--color-surface-subtle)]">
        <div className="min-w-0 flex-1">
          <UserMenu user={user} expanded={expanded} onOpenProfile={() => setProfileOpen(true)} />
        </div>
        {expanded && (
          <button
            type="button"
            title="Log out"
            aria-label="Log out"
            disabled={loggingOut}
            onClick={handleLogout}
            className="flex-none p-1.5 rounded-lg text-[var(--color-neutral-500)] hover:bg-[color-mix(in_srgb,var(--color-text)_6%,transparent)] hover:text-[var(--color-text)] disabled:opacity-50"
          >
            <LogoutIcon width={16} height={16} />
          </button>
        )}
      </div>

      {profileOpen && (
        <UserDetailDialog
          user={user}
          isAdmin={user.role === "admin"}
          onClose={() => {
            setProfileOpen(false);
            setProfileSaveError(null);
          }}
          onSave={handleSaveProfile}
        />
      )}

      {profileSaveError && profileOpen && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-30 text-[13px] text-[var(--color-accent-300)] bg-[var(--color-accent-900)] border border-[var(--color-accent-700)] rounded-[var(--radius-md)] px-3 py-2">
          {profileSaveError}
        </div>
      )}
    </div>
  );
}
