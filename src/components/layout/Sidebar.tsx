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

interface NavItem {
  href: string;
  label: string;
  Icon: ComponentType<SVGProps<SVGSVGElement>>;
}

const NAV_ITEMS: NavItem[] = [
  { href: "/dashboard", label: "Dashboard", Icon: DashboardIcon },
  { href: "/sales", label: "Sales & Orders", Icon: SalesIcon },
  { href: "/invoicing", label: "Invoicing", Icon: InvoicingIcon },
  { href: "/inventory", label: "Inventory", Icon: InventoryIcon },
  { href: "/shipments", label: "Shipments", Icon: ShipmentIcon },
  { href: "/production", label: "Production", Icon: ProductionIcon },
];

function initials(username: string): string {
  return username.slice(0, 2).toUpperCase();
}

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
  const pathname = usePathname();
  const router = useRouter();

  async function handleLogout() {
    setLoggingOut(true);
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/login");
    router.refresh();
  }

  return (
    <div
      className="flex-none flex flex-col bg-[var(--color-surface)] border-r border-[var(--color-divider)] transition-[width] duration-150 ease-in-out"
      style={{ width: expanded ? 224 : 68 }}
    >
      <div className="flex items-center gap-2.5 px-4 pt-[18px] pb-5">
        <div className="w-7 h-7 flex-none rounded-lg bg-[var(--color-accent-800)] text-[var(--color-accent-200)] flex items-center justify-center font-[family-name:var(--font-heading)] font-semibold text-sm">
          F
        </div>
        {expanded && (
          <span className="font-[family-name:var(--font-heading)] font-medium text-[17px] tracking-tight">
            FlowERP
          </span>
        )}
      </div>

      <nav className="flex flex-col gap-0.5 px-2.5 flex-1">
        {NAV_ITEMS.map(({ href, label, Icon }) => {
          const active = pathname?.startsWith(href) ?? false;
          return (
            <Link
              key={href}
              href={href}
              title={label}
              className={`flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-sm w-full text-left ${
                active
                  ? "bg-[color-mix(in_srgb,var(--color-accent)_16%,transparent)] text-[var(--color-accent)]"
                  : "text-[color-mix(in_srgb,var(--color-text)_75%,transparent)] hover:bg-[color-mix(in_srgb,var(--color-text)_6%,transparent)]"
              }`}
            >
              <Icon />
              {expanded && <span>{label}</span>}
            </Link>
          );
        })}

        <div className="flex-1" />

        <Link
          href="/settings"
          title="Settings"
          className={`flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-sm w-full text-left ${
            pathname?.startsWith("/settings")
              ? "bg-[color-mix(in_srgb,var(--color-accent)_16%,transparent)] text-[var(--color-accent)]"
              : "text-[color-mix(in_srgb,var(--color-text)_75%,transparent)] hover:bg-[color-mix(in_srgb,var(--color-text)_6%,transparent)]"
          }`}
        >
          <SettingsIcon />
          {expanded && <span>Settings</span>}
        </Link>
      </nav>

      <button
        type="button"
        onClick={() => setExpanded((v) => !v)}
        aria-label={expanded ? "Collapse sidebar" : "Expand sidebar"}
        className="mx-2.5 mb-2 py-1.5 rounded-lg text-xs text-[var(--color-neutral-500)] hover:bg-[color-mix(in_srgb,var(--color-text)_6%,transparent)]"
      >
        {expanded ? "«" : "»"}
      </button>

      <div className="p-3 pt-3.5 border-t border-[var(--color-divider)] flex items-center gap-2.5">
        <div className="w-[30px] h-[30px] flex-none rounded-full bg-[var(--color-neutral-800)] flex items-center justify-center text-xs font-semibold text-[var(--color-neutral-200)]">
          {initials(user.username)}
        </div>
        {expanded && (
          <>
            <div className="min-w-0 flex-1">
              <div className="text-[13px] leading-tight whitespace-nowrap overflow-hidden text-ellipsis capitalize">
                {user.username}
              </div>
              <div className="text-[11px] text-[var(--color-neutral-500)] capitalize">{user.role}</div>
            </div>
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
          </>
        )}
      </div>
    </div>
  );
}
