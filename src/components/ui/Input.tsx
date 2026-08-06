import type { InputHTMLAttributes, ReactNode } from "react";

const inputClass =
  "w-full min-h-9 px-2.5 py-1.5 text-sm text-[var(--color-text)] bg-[var(--color-surface)] " +
  "border border-[var(--color-divider)] rounded-[var(--radius-md)] outline-none " +
  "hover:border-[color-mix(in_srgb,var(--color-text)_45%,transparent)] " +
  "focus-visible:border-[var(--color-accent)]";

export function Input(props: InputHTMLAttributes<HTMLInputElement>) {
  const { className = "", ...rest } = props;
  return <input className={`${inputClass} ${className}`} {...rest} />;
}

export function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="flex flex-col gap-1.5">
      <label className="block text-xs text-[color-mix(in_srgb,var(--color-text)_70%,transparent)]">{label}</label>
      {children}
    </div>
  );
}
