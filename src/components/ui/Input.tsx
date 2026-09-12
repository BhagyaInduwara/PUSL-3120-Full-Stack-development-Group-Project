import type { InputHTMLAttributes, ReactNode } from "react";
import { cn } from "@/lib/utils";

const inputClass =
  "min-h-9 px-3 py-1.5 text-sm text-[var(--color-text)] bg-[var(--color-surface)] " +
  "border border-[var(--color-divider)] rounded-[var(--radius-md)] outline-none " +
  "placeholder:text-[var(--color-neutral-400)] shadow-xs " +
  "hover:border-[color-mix(in_srgb,var(--color-text)_35%,transparent)] " +
  "focus-visible:border-[var(--color-accent)] focus-visible:ring-2 focus-visible:ring-[var(--color-ring-focus)] " +
  "disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-120";

export function Input(props: InputHTMLAttributes<HTMLInputElement>) {
  const { className = "", ...rest } = props;
  const width = /\bw-/.test(className) ? "" : "w-full";
  return <input className={cn(inputClass, width, className)} {...rest} />;
}

export function Field({
  label,
  error,
  children,
}: {
  label: string;
  error?: string;
  children: ReactNode;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <label className="block text-xs font-medium text-[var(--color-neutral-300)] tracking-wide">
        {label}
      </label>
      {children}
      {error && <span className="text-xs text-rose-500">{error}</span>}
    </div>
  );
}
