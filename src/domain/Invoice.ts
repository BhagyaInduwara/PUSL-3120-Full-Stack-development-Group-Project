import { StatusfulEntity } from "./StatusBadge";

export type InvoiceStatus = "Draft" | "Sent" | "Paid" | "Overdue";

export interface InvoiceProps {
  id: string;
  orderId: string;
  status: InvoiceStatus;
  issueDate: string;
  dueDate: string;
}

/** Invoice only stores the orderId reference — amount/customer are derived
 *  by joining with Order in InvoicingService, so Invoice never goes stale
 *  relative to the order it bills. */
export class Invoice extends StatusfulEntity {
  readonly orderId: string;
  readonly issueDate: string;
  readonly dueDate: string;
  private _status: InvoiceStatus;

  constructor(props: InvoiceProps) {
    super(props.id);
    this.orderId = props.orderId;
    this.issueDate = props.issueDate;
    this.dueDate = props.dueDate;
    this._status = props.status;
  }

  get status(): InvoiceStatus {
    return this._status;
  }

  markPaid(): void {
    this._status = "Paid";
  }

  send(): void {
    if (this._status === "Draft") this._status = "Sent";
  }
}
