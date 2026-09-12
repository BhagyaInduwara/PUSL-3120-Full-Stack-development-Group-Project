import type { SelectHTMLAttributes } from "react";
import { cn } from "@/lib/utils";

const selectClass =
  "min-h-9 px-3 py-1.5 text-sm text-[var(--color-text)] bg-[var(--color-surface)] " +
  "border border-[var(--color-divider)] rounded-[var(--radius-md)] outline-none cursor-pointer shadow-xs " +
  "hover:border-[color-mix(in_srgb,var(--color-text)_35%,transparent)] " +
  "focus-visible:border-[var(--color-accent)] focus-visible:ring-2 focus-visible:ring-[var(--color-ring-focus)] " +
  "disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-120";

/** Select — plain-styled <select>, mirrors Input's width-handling so callers can override with their own w-* class. */
export function Select(props: SelectHTMLAttributes<HTMLSelectElement>) {
  const { className = "", ...rest } = props;
  const width = /\bw-/.test(className) ? "" : "w-full";
  return <select className={cn(selectClass, width, className)} {...rest} />;
}
