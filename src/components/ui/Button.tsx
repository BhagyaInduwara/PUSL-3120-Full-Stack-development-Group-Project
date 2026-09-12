import type { AnchorHTMLAttributes, ButtonHTMLAttributes, ReactNode } from "react";
import Link from "next/link";
import { cn } from "@/lib/utils";

type Variant = "primary" | "secondary" | "ghost" | "danger";
type Size = "sm" | "md" | "lg";

const base =
  "inline-flex items-center justify-center gap-2 cursor-pointer select-none no-underline " +
  "font-medium text-sm leading-tight rounded-[var(--radius-md)] border " +
  "transition-all duration-100 active:scale-[0.98] disabled:opacity-45 disabled:cursor-not-allowed disabled:active:scale-100 " +
  "focus-visible:ring-2 focus-visible:ring-[var(--color-accent)]/40 focus-visible:outline-none " +
  "font-[family-name:var(--font-heading)]";

const variants: Record<Variant, string> = {
  primary:
    "bg-[var(--color-accent)] hover:bg-[var(--color-accent-600)] text-white border-transparent " +
    "shadow-xs hover:shadow-[0_2px_8px_rgba(16,185,129,0.3)] active:bg-[var(--color-accent-700)]",
  secondary:
    "bg-[var(--color-surface)] text-[var(--color-text)] border-[var(--color-divider)] " +
    "hover:bg-[var(--color-surface-hover)] hover:border-[color-mix(in_srgb,var(--color-divider)_60%,var(--color-accent)_40%)] " +
    "shadow-xs active:bg-[color-mix(in_srgb,var(--color-text)_10%,transparent)]",
  ghost:
    "border-transparent text-[var(--color-text)] " +
    "hover:bg-[color-mix(in_srgb,var(--color-text)_6%,transparent)] " +
    "active:bg-[color-mix(in_srgb,var(--color-text)_12%,transparent)]",
  danger:
    "bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/30 " +
    "hover:bg-rose-500/20 active:bg-rose-500/30",
};

const sizes: Record<Size, string> = {
  sm: "px-2.5 py-1 text-xs",
  md: "px-3.5 py-2 text-sm",
  lg: "px-5 py-2.5 text-base",
};

function buttonClassName(
  variant: Variant = "secondary",
  size: Size = "md",
  icon?: boolean,
  block?: boolean,
  className = ""
): string {
  const sizing = icon ? "w-9 h-9 p-0" : sizes[size];
  const width = block ? "w-full mt-1.5" : "";
  return cn(base, variants[variant], sizing, width, className);
}

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
  icon?: boolean;
  block?: boolean;
  children?: ReactNode;
}

/** Button — every clickable action in the app renders through this (or LinkButton) so variants stay visually consistent. */
export function Button({
  variant = "secondary",
  size = "md",
  icon,
  block,
  className = "",
  children,
  ...rest
}: ButtonProps) {
  return (
    <button type="button" className={buttonClassName(variant, size, icon, block, className)} {...rest}>
      {children}
    </button>
  );
}

interface LinkButtonProps extends AnchorHTMLAttributes<HTMLAnchorElement> {
  href: string;
  variant?: Variant;
  size?: Size;
  icon?: boolean;
  block?: boolean;
  children?: ReactNode;
}

/** LinkButton — same visual variants as Button, but renders a Next.js <Link> so it can be used for navigation without nesting a <button> inside an <a>. */
export function LinkButton({
  href,
  variant = "secondary",
  size = "md",
  icon,
  block,
  className = "",
  children,
  ...rest
}: LinkButtonProps) {
  return (
    <Link href={href} className={buttonClassName(variant, size, icon, block, className)} {...rest}>
      {children}
    </Link>
  );
}
