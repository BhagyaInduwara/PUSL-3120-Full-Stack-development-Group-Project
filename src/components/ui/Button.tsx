import type { AnchorHTMLAttributes, ButtonHTMLAttributes, ReactNode } from "react";
import Link from "next/link";

type Variant = "primary" | "secondary" | "ghost";

const base =
  "inline-flex items-center justify-center gap-1.5 cursor-pointer select-none no-underline " +
  "font-medium text-sm leading-tight rounded-[var(--radius-md)] border border-transparent " +
  "transition-colors disabled:opacity-45 disabled:cursor-not-allowed " +
  "text-[var(--color-text)] font-[family-name:var(--font-heading)]";

const variants: Record<Variant, string> = {
  primary:
    "text-[var(--color-accent)] border-[var(--color-accent)] " +
    "hover:bg-[color-mix(in_srgb,var(--color-accent)_12%,transparent)] " +
    "active:bg-[color-mix(in_srgb,var(--color-accent)_22%,transparent)]",
  secondary:
    "border-[var(--color-divider)] " +
    "hover:bg-[color-mix(in_srgb,var(--color-text)_7%,transparent)] " +
    "active:bg-[color-mix(in_srgb,var(--color-text)_14%,transparent)]",
  ghost:
    "text-[var(--color-accent)] px-1 " +
    "hover:bg-[color-mix(in_srgb,var(--color-accent)_10%,transparent)] " +
    "active:bg-[color-mix(in_srgb,var(--color-accent)_18%,transparent)]",
};

function buttonClassName(variant: Variant, icon?: boolean, block?: boolean, className = ""): string {
  const sizing = icon ? "w-9 h-9 p-0" : "px-[calc(var(--space-3)*1.2)] py-[var(--space-2)]";
  const width = block ? "w-full mt-1.5" : "";
  return `${base} ${variants[variant]} ${sizing} ${width} ${className}`;
}

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  icon?: boolean;
  block?: boolean;
  children?: ReactNode;
}

/** Button — every clickable action in the app renders through this (or LinkButton) so variants stay visually consistent. */
export function Button({ variant = "secondary", icon, block, className = "", children, ...rest }: ButtonProps) {
  return (
    <button type="button" className={buttonClassName(variant, icon, block, className)} {...rest}>
      {children}
    </button>
  );
}

interface LinkButtonProps extends AnchorHTMLAttributes<HTMLAnchorElement> {
  href: string;
  variant?: Variant;
  icon?: boolean;
  block?: boolean;
  children?: ReactNode;
}

/** LinkButton — same visual variants as Button, but renders a Next.js <Link> so it can be used for navigation without nesting a <button> inside an <a>. */
export function LinkButton({ href, variant = "secondary", icon, block, className = "", children, ...rest }: LinkButtonProps) {
  return (
    <Link href={href} className={buttonClassName(variant, icon, block, className)} {...rest}>
      {children}
    </Link>
  );
}
