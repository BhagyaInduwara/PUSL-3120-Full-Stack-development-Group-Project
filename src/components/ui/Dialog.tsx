import { useEffect, type ReactNode } from "react";
import { cn } from "@/lib/utils";

interface DialogProps {
  title: string;
  onClose: () => void;
  children: ReactNode;
  actions: ReactNode;
  className?: string;
}

export function Dialog({ title, onClose, children, actions, className = "" }: DialogProps) {
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onClose]);

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-50 grid place-items-center p-[var(--space-4)] bg-black/40 dark:bg-black/60 backdrop-blur-xs animate-fade-in"
      onClick={onClose}
    >
      <div
        className={cn(
          "w-full max-w-[460px] flex flex-col gap-4 p-5 rounded-[var(--radius-lg)] bg-[var(--color-surface)] " +
          "border border-[var(--color-divider)] shadow-[var(--shadow-lg)] [box-shadow:var(--shadow-lg),var(--card-inset-highlight)] " +
          "animate-modal-in",
          className
        )}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="font-[family-name:var(--font-heading)] font-semibold text-lg text-[var(--color-text)] tracking-tight">
          {title}
        </div>
        <div className="flex flex-col gap-3 text-sm text-[var(--color-neutral-300)]">{children}</div>
        <div className="flex justify-end gap-2.5 pt-2 border-t border-[var(--color-divider)]">{actions}</div>
      </div>
    </div>
  );
}
