import type { SelectHTMLAttributes } from "react";

const selectClass =
  "min-h-9 px-2.5 py-1.5 text-sm text-[var(--color-text)] bg-[var(--color-surface)] " +
  "border border-[var(--color-divider)] rounded-[var(--radius-md)] outline-none cursor-pointer " +
  "hover:border-[color-mix(in_srgb,var(--color-text)_45%,transparent)] " +
  "focus-visible:border-[var(--color-accent)]";

/** Select — plain-styled <select>, mirrors Input's width-handling so callers can override with their own w-* class. */
export function Select(props: SelectHTMLAttributes<HTMLSelectElement>) {
  const { className = "", ...rest } = props;
  const width = /\bw-/.test(className) ? "" : "w-full";
  return <select className={`${selectClass} ${width} ${className}`} {...rest} />;
}
