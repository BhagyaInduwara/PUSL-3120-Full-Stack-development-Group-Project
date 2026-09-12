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
        className="flex items-center gap-2.5 w-full text-left rounded-xl p-1.5 cursor-pointer hover:bg-[var(--color-surface-hover)] transition-colors group"
      >
        <div className="relative">
          <div className="w-[32px] h-[32px] flex-none rounded-full bg-[var(--color-accent)] text-white flex items-center justify-center text-xs font-semibold shadow-xs">
            {initials(user.username)}
          </div>
          <span className="absolute bottom-0 right-0 w-2 h-2 rounded-full bg-emerald-400 border border-[var(--color-surface)]" />
        </div>
        {expanded && (
          <div className="min-w-0 flex-1">
            <div className="text-[13px] font-semibold text-[var(--color-text)] leading-tight whitespace-nowrap overflow-hidden text-ellipsis capitalize">
              {user.username}
            </div>
            <div className="text-[11px] font-medium text-[var(--color-neutral-400)] capitalize">{user.role}</div>
          </div>
        )}
      </button>

      {open && (
        <div
          role="menu"
          className="absolute bottom-0 left-full ml-3 z-30 w-[210px] flex flex-col gap-1.5 p-2 rounded-2xl bg-[var(--color-surface)] border border-[var(--color-divider)] shadow-lg [box-shadow:var(--shadow-lg),var(--card-inset-highlight)] text-[var(--color-text)] animate-modal-in"
        >
          <div className="px-2.5 py-1 border-b border-[var(--color-divider)]">
            <div className="text-xs font-semibold text-[var(--color-text)] capitalize">{user.username}</div>
            <div className="text-[11px] text-[var(--color-neutral-400)] capitalize">{user.role} Account</div>
          </div>

          <button
            type="button"
            role="menuitem"
            onClick={() => {
              setOpen(false);
              onOpenProfile();
            }}
            className="px-2.5 py-1.5 rounded-xl text-xs font-medium text-left text-[var(--color-text)] hover:bg-[var(--color-surface-hover)] cursor-pointer transition-colors"
          >
            Edit Profile
          </button>

          <div className="px-2.5 pt-1.5 pb-1 border-t border-[var(--color-divider)]">
            <div className="text-[11px] font-medium text-[var(--color-neutral-400)] mb-1.5">Theme</div>
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
