import type { CSSProperties, ReactNode } from "react";
import type { BadgeStyle, Statusable } from "@/domain/StatusBadge";

type Variant = "accent" | "accent-2" | "neutral" | "outline";

interface TagProps {
  children: ReactNode;
  variant?: Variant;
  style?: CSSProperties;
  className?: string;
}

const base = "inline-flex items-center text-[11px] tracking-[0.02em] px-2.5 py-[3px] rounded-[calc(var(--radius-md)*0.75)]";

const variants: Record<Variant, string> = {
  accent: "bg-[var(--color-accent-800)] text-[var(--color-accent-100)]",
  "accent-2": "bg-[var(--color-accent-2-800)] text-[var(--color-accent-2-100)]",
  neutral: "bg-[var(--color-neutral-800)] text-[var(--color-neutral-100)]",
  outline: "border border-[var(--color-accent)] text-[var(--color-accent)]",
};

/** Tag — plain color-variant pill (counts, static labels) or, with `style`, an arbitrary badge (see StatusTag). */
export function Tag({ children, variant, style, className = "" }: TagProps) {
  return (
    <span className={`${base} ${variant ? variants[variant] : ""} ${className}`} style={style}>
      {children}
    </span>
  );
}

/**
 * StatusTag — renders any entity that implements `Statusable` (Order,
 * Invoice, Shipment) using its own `badgeStyle()`. This is the polymorphism
 * payoff of StatusfulEntity: this component never has a switch on entity
 * type, it just calls the interface method.
 */
export function StatusTag({ entity, style }: { entity: Statusable; style?: BadgeStyle }) {
  return <Tag style={(style ?? entity.badgeStyle()) as CSSProperties}>{entity.status}</Tag>;
}
