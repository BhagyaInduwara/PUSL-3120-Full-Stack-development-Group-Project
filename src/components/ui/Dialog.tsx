import type { ReactNode } from "react";

interface DialogProps {
  title: string;
  onClose: () => void;
  children: ReactNode;
  actions: ReactNode;
}

/** Dialog — centered modal used for short forms (e.g. Add customer). For the wide slide-over panel see sales/NewOrderDrawer.tsx. */
export function Dialog({ title, onClose, children, actions }: DialogProps) {
  return (
    <div
      className="fixed inset-0 z-50 grid place-items-center p-[var(--space-4)] bg-[color-mix(in_srgb,var(--color-neutral-900)_50%,transparent)]"
      onClick={onClose}
    >
      <div
        className="w-full max-w-[440px] flex flex-col gap-3 p-[var(--space-4)] rounded-[var(--radius-lg)] bg-[var(--color-surface)] shadow-[var(--shadow-lg)]"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="font-[family-name:var(--font-heading)] font-medium text-xl">{title}</div>
        <div className="flex flex-col gap-3 text-sm opacity-85">{children}</div>
        <div className="flex justify-end gap-2 mt-2">{actions}</div>
      </div>
    </div>
  );
}
