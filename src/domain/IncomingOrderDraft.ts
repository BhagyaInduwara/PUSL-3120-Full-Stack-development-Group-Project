import { Entity } from "./Entity";
import { Money } from "./Money";
import { Order } from "./Order";

export interface DraftLineItem {
  product: string;
  qty: number;
  price: number;
}

export interface IncomingOrderDraftProps {
  id: string;
  customer: string;
  emailSubject: string;
  lineItems: DraftLineItem[];
}

/**
 * IncomingOrderDraft — an order auto-parsed from an inbound email, awaiting
 * human review before it becomes a real Order. Kept as its own entity
 * (rather than an Order with a "pending" status) because it has a different
 * shape: multiple line items instead of one product/qty pair, and no status
 * lifecycle of its own — it either gets approved (and turns into an Order
 * via the toOrder() factory method) or discarded.
 */
export class IncomingOrderDraft extends Entity {
  readonly customer: string;
  readonly emailSubject: string;
  readonly lineItems: readonly DraftLineItem[];

  constructor(props: IncomingOrderDraftProps) {
    super(props.id);
    this.customer = props.customer;
    this.emailSubject = props.emailSubject;
    this.lineItems = props.lineItems;
  }

  /** Returns a new draft with one line item's qty/price patched — the draft itself is immutable. */
  withLineItem(index: number, patch: Partial<DraftLineItem>): IncomingOrderDraft {
    const lineItems = this.lineItems.map((li, i) => (i === index ? { ...li, ...patch } : li));
    return new IncomingOrderDraft({
      id: this.id,
      customer: this.customer,
      emailSubject: this.emailSubject,
      lineItems,
    });
  }

  get total(): Money {
    return this.lineItems.reduce(
      (sum, li) => sum.add(new Money(li.qty * li.price)),
      Money.zero()
    );
  }

  get totalFormatted(): string {
    return this.total.format();
  }

  /**
   * Factory method: turns this draft into a real Order once approved.
   * Only the first line item becomes the Order (Order is single-product,
   * matching every other Order in the system) — additional line items are
   * summarized into the qty for that product.
   */
  toOrder(orderId: string, date: string): Order {
    const primary = this.lineItems[0];
    return new Order({
      id: orderId,
      customer: this.customer,
      product: primary.product,
      qty: primary.qty,
      price: primary.price,
      status: "Confirmed",
      date,
    });
  }
}
