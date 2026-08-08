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

export interface OrderProps {
  id: string;
  customer: string;
  product: string;
  qty: number;
  price: number;
  status: OrderStatus;
  date: string;
}

export interface OrderEditableFields {
  customer: string;
  product: string;
  qty: number;
  price: number;
  date: string;
}

/**
 * Order — the ERP's central entity. Status is intentionally not a public
 * setter: callers must go through `moveTo()` so the class stays the single
 * place that could later validate a transition (e.g. reject Closed -> Draft)
 * instead of every call site poking the field directly. Editable fields are
 * gated the same way through `update()` — see `canEdit`.
 */
export class Order extends StatusfulEntity {
  private _customer: string;
  private _product: string;
  private _qty: number;
  private _price: Money;
  private _date: string;
  private _status: OrderStatus;

  constructor(props: OrderProps) {
    super(props.id);
    this._customer = props.customer;
    this._product = props.product;
    this._qty = props.qty;
    this._price = new Money(props.price);
    this._date = props.date;
    this._status = props.status;
  }

  get customer(): string {
    return this._customer;
  }

  get product(): string {
    return this._product;
  }

  get qty(): number {
    return this._qty;
  }

  get price(): Money {
    return this._price;
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
    if (patch.product !== undefined) this._product = patch.product;
    if (patch.qty !== undefined) this._qty = patch.qty;
    if (patch.price !== undefined) this._price = new Money(patch.price);
    if (patch.date !== undefined) this._date = patch.date;
  }

  get amount(): Money {
    return this._price.multiply(this._qty);
  }

  get priceFormatted(): string {
    return this.price.format();
  }

  get amountFormatted(): string {
    return this.amount.format();
  }
}
