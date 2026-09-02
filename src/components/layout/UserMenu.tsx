"use client";

import { useEffect, useRef, useState } from "react";
import { SegmentedControl } from "@/components/ui/SegmentedControl";
import { useTheme } from "@/components/theme/ThemeProvider";
import type { PublicUser } from "@/domain/User";

interface UserMenuProps {
  user: PublicUser;
  expanded: boolean;
  onOpenProfile: () => void;
}

function initials(username: string): string {
  return username.slice(0, 2).toUpperCase();
}

/**
 * UserMenu — the avatar block at the bottom of the sidebar, now clickable.
 * Opens a small popover beside it with two things: a shortcut to the
 * user's own profile (reuses the exact same UserDetailDialog Settings >
 * Users already opens — see Sidebar.tsx) and the light/dark theme toggle.
 * Closes on an outside click, same pattern as any other lightweight popover
 * in this app.
 */
export function UserMenu({ user, expanded, onOpenProfile }: UserMenuProps) {
  const [open, setOpen] = useState(false);
  const { theme, setTheme } = useTheme();
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    function handlePointerDown(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handlePointerDown);
    return () => document.removeEventListener("mousedown", handlePointerDown);
  }, [open]);

  return (
    <div ref={containerRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-haspopup="menu"
        aria-expanded={open}
        className="flex items-center gap-2.5 w-full text-left rounded-lg p-1 -m-1 cursor-pointer hover:bg-[color-mix(in_srgb,var(--color-text)_6%,transparent)]"
      >
        <div className="w-[30px] h-[30px] flex-none rounded-full bg-[var(--color-neutral-800)] flex items-center justify-center text-xs font-semibold text-[var(--color-neutral-200)]">
          {initials(user.username)}
        </div>
        {expanded && (
          <div className="min-w-0 flex-1">
            <div className="text-[13px] leading-tight whitespace-nowrap overflow-hidden text-ellipsis capitalize">
              {user.username}
            </div>
            <div className="text-[11px] text-[var(--color-neutral-500)] capitalize">{user.role}</div>
          </div>
        )}
      </button>

      {open && (
        <div
          role="menu"
          className="absolute bottom-0 left-full ml-2 z-30 w-[196px] flex flex-col gap-1 p-1.5 rounded-[var(--radius-lg)] bg-[var(--color-surface)] border border-[var(--color-divider)] shadow-[var(--shadow-lg)]"
        >
          <button
            type="button"
            role="menuitem"
            onClick={() => {
              setOpen(false);
              onOpenProfile();
            }}
            className="px-2.5 py-2 rounded-lg text-sm text-left text-[var(--color-text)] hover:bg-[color-mix(in_srgb,var(--color-text)_6%,transparent)] cursor-pointer"
          >
            Profile
          </button>

          <div className="px-2.5 pt-1.5 pb-2">
            <div className="text-[11px] text-[var(--color-neutral-500)] mb-1.5">Appearance</div>
            <SegmentedControl
              name="theme"
              value={theme}
              onChange={setTheme}
              options={[
                { value: "light", label: "Light" },
                { value: "dark", label: "Dark" },
              ]}
            />
          </div>
        </div>
      )}
    </div>
  );
}
