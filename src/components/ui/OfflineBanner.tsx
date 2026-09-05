"use client";

import { useEffect, useState, useTransition } from "react";

export function OfflineBanner() {
  const [isOffline, setIsOffline] = useState(false);
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    // Determine initial status on mount
    if (typeof navigator !== "undefined") {
      setIsOffline(!navigator.onLine);
    }

    const handleOnline = () => setIsOffline(false);
    const handleOffline = () => setIsOffline(true);

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  const handleRetry = () => {
    startTransition(() => {
      if (typeof navigator !== "undefined" && navigator.onLine) {
        setIsOffline(false);
        window.location.reload();
      } else {
        // Still offline: show brief feedback
        setIsOffline(true);
      }
    });
  };

  if (!isOffline) {
    return null;
  }

  return (
    <div
      role="status"
      aria-live="polite"
      className="w-full bg-[rgba(35,37,50,0.96)] border-b border-amber-500/40 px-4 py-2 text-xs flex items-center justify-between text-[var(--color-text)] shadow-md backdrop-blur z-50 transition-all duration-300 animate-in fade-in slide-in-from-top-2"
    >
      <div className="flex items-center gap-2.5 min-w-0">
        <span className="relative flex h-2.5 w-2.5 shrink-0">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
          <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-amber-500"></span>
        </span>
        <div className="truncate">
          <span className="font-semibold text-amber-300">Offline Mode</span>
          <span className="text-[var(--color-neutral-400)] ml-1.5 hidden sm:inline">
            — Viewing cached data snapshot. Actions requiring write sync are paused until reconnected.
          </span>
          <span className="text-[var(--color-neutral-400)] ml-1.5 sm:hidden">
            — Showing cached data.
          </span>
        </div>
      </div>

      <button
        onClick={handleRetry}
        disabled={isPending}
        className="ml-3 shrink-0 rounded px-2.5 py-1 text-[11px] font-medium bg-amber-500/15 hover:bg-amber-500/25 border border-amber-500/30 text-amber-200 transition-colors disabled:opacity-50 cursor-pointer"
      >
        {isPending ? "Checking..." : "Retry Connection"}
      </button>
    </div>
  );
}
