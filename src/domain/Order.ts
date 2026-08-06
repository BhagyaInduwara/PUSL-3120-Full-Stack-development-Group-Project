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

/**
 * Order — the ERP's central entity. Status is intentionally not a public
 * setter: callers must go through `moveTo()` so the class stays the single
 * place that could later validate a transition (e.g. reject Closed -> Draft)
 * instead of every call site poking the field directly.
 */
export class Order extends StatusfulEntity {
  readonly customer: string;
  readonly product: string;
  readonly qty: number;
  readonly price: Money;
  readonly date: string;
  private _status: OrderStatus;

  constructor(props: OrderProps) {
    super(props.id);
    this.customer = props.customer;
    this.product = props.product;
    this.qty = props.qty;
    this.price = new Money(props.price);
    this.date = props.date;
    this._status = props.status;
  }

  get status(): OrderStatus {
    return this._status;
  }

  moveTo(status: OrderStatus): void {
    this._status = status;
  }

  get amount(): Money {
    return this.price.multiply(this.qty);
  }

  get priceFormatted(): string {
    return this.price.format();
  }

  get amountFormatted(): string {
    return this.amount.format();
  }
}
