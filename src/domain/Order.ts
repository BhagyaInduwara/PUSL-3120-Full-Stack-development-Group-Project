import { StatusfulEntity } from "./StatusBadge";
import { Money } from "./Money";

export type OrderStatus = "Draft" | "Confirmed" | "Invoiced" | "Shipped" | "Closed";

export const ORDER_STATUSES: readonly OrderStatus[] = [
  "Draft",
  "Confirmed",
  "Invoiced",
  "Shipped",
  "Closed",
];

export interface OrderLineItem {
  product: string;
  qty: number;
  price: number;
}

export interface OrderProps {
  id: string;
  /** Human-readable display id, e.g. "2026/08/23/A001" — generated server-side, distinct from `id` (the Mongo ObjectId used for routing/API calls). */
  number: string;
  customer: string;
  lineItems: OrderLineItem[];
  status: OrderStatus;
  date: string;
}

export interface OrderEditableFields {
  customer: string;
  lineItems: OrderLineItem[];
  date: string;
}

/**
 * Order — the ERP's central entity. Status is intentionally not a public
 * setter: callers must go through `moveTo()` so the class stays the single
 * place that could later validate a transition (e.g. reject Closed -> Draft)
 * instead of every call site poking the field directly. Editable fields are
 * gated the same way through `update()` — see `canEdit`.
 *
 * Holds multiple line items (mirrors IncomingOrderDraft) rather than a
 * single product/qty/price — see IncomingOrderDraft.toOrder(), which is
 * where a draft's line items become an Order's line items 1:1.
 */
export class Order extends StatusfulEntity {
  readonly number: string;
  private _customer: string;
  private _lineItems: OrderLineItem[];
  private _date: string;
  private _status: OrderStatus;

  constructor(props: OrderProps) {
    super(props.id);
    this.number = props.number;
    this._customer = props.customer;
    this._lineItems = props.lineItems.map((li) => ({ ...li }));
    this._date = props.date;
    this._status = props.status;
  }

  get customer(): string {
    return this._customer;
  }

  get lineItems(): readonly OrderLineItem[] {
    return this._lineItems;
  }

  get date(): string {
    return this._date;
  }

  get status(): OrderStatus {
    return this._status;
  }

  /** Only a Draft order's fields can still be changed — once it's Confirmed, downstream invoices/shipments may already reference its numbers. */
  get canEdit(): boolean {
    return this._status === "Draft";
  }

  moveTo(status: OrderStatus): void {
    this._status = status;
  }

  update(patch: Partial<OrderEditableFields>): void {
    if (!this.canEdit) return;
    if (patch.customer !== undefined) this._customer = patch.customer;
    if (patch.lineItems !== undefined) this._lineItems = patch.lineItems.map((li) => ({ ...li }));
    if (patch.date !== undefined) this._date = patch.date;
  }

  /** Sum of qty × price across every line item. */
  get amount(): Money {
    return this._lineItems.reduce((sum, li) => sum.add(new Money(li.qty * li.price)), Money.zero());
  }

  get amountFormatted(): string {
    return this.amount.format();
  }

  /** Total units across all line items. */
  get totalQty(): number {
    return this._lineItems.reduce((sum, li) => sum + li.qty, 0);
  }

  /** Compact one-line label for contexts that only have room for a single string, e.g. "Task Chair – Mesh Back +2 more". */
  get itemsSummary(): string {
    if (this._lineItems.length === 0) return "—";
    const [first, ...rest] = this._lineItems;
    return rest.length > 0 ? `${first.product} +${rest.length} more` : first.product;
  }
}
