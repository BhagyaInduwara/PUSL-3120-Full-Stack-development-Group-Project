import { Entity } from "./Entity";

export interface InventoryItemProps {
  sku: string;
  name: string;
  category: string;
  qty: number;
  reorderPoint: number;
}

export class InventoryItem extends Entity {
  readonly sku: string;
  readonly name: string;
  readonly category: string;
  readonly qty: number;
  readonly reorderPoint: number;

  constructor(props: InventoryItemProps) {
    super(props.sku);
    this.sku = props.sku;
    this.name = props.name;
    this.category = props.category;
    this.qty = props.qty;
    this.reorderPoint = props.reorderPoint;
  }

  get isLow(): boolean {
    return this.qty < this.reorderPoint;
  }

  /** Stock bar fill, 6-100%, relative to 1.5x the reorder point (matches original design formula). */
  get stockPercent(): number {
    const pct = Math.round((this.qty / (this.reorderPoint * 1.5)) * 100);
    return Math.max(6, Math.min(100, pct));
  }
}
