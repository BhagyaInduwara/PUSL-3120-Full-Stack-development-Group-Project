import { Entity } from "./Entity";

/** Inline style for a status <Tag>, expressed with the Nocturne CSS variables. */
export interface BadgeStyle {
  background: string;
  color: string;
  border?: string;
}

/**
 * StatusPalette — single source of truth mapping a status label to its
 * badge colors, ported from the original `badgeStyle()` method. Kept as one
 * static lookup so every entity (Order, Invoice, Shipment) renders the same
 * status in the same color without duplicating the map.
 */
export class StatusPalette {
  private static readonly styles: Record<string, BadgeStyle> = {
    Paid: { background: "var(--color-accent-800)", color: "var(--color-accent-100)" },
    Delivered: { background: "var(--color-accent-800)", color: "var(--color-accent-100)" },
    Sent: { border: "1px solid var(--color-accent)", color: "var(--color-accent)", background: "transparent" },
    Dispatched: { border: "1px solid var(--color-accent)", color: "var(--color-accent)", background: "transparent" },
    Confirmed: { border: "1px solid var(--color-accent)", color: "var(--color-accent)", background: "transparent" },
    Overdue: { background: "var(--color-accent-400)", color: "var(--color-accent-900)" },
    Draft: { background: "var(--color-neutral-800)", color: "var(--color-neutral-100)" },
    Packed: { background: "var(--color-neutral-800)", color: "var(--color-neutral-100)" },
    Invoiced: { background: "var(--color-accent-800)", color: "var(--color-accent-100)" },
    Shipped: { background: "var(--color-accent-2-800)", color: "var(--color-accent-2-100)" },
    Closed: { background: "var(--color-neutral-800)", color: "var(--color-neutral-100)" },
  };

  private static readonly fallback: BadgeStyle = {
    background: "var(--color-neutral-800)",
    color: "var(--color-neutral-100)",
  };

  static styleFor(status: string): BadgeStyle {
    return this.styles[status] ?? this.fallback;
  }
}

/** Contract for any entity that can render a status <Tag>. */
export interface Statusable {
  readonly status: string;
  badgeStyle(): BadgeStyle;
}

/**
 * StatusfulEntity — base class for entities whose identity comes with a
 * lifecycle status (Order, Invoice, Shipment). Implements `badgeStyle()`
 * once via StatusPalette so subclasses only declare their status field;
 * this is the polymorphism seam UI components rely on (see ui/Tag.tsx).
 */
export abstract class StatusfulEntity<ID extends string = string>
  extends Entity<ID>
  implements Statusable
{
  abstract readonly status: string;

  badgeStyle(): BadgeStyle {
    return StatusPalette.styleFor(this.status);
  }
}
