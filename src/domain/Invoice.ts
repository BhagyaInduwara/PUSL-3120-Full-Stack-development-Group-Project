import { StatusfulEntity } from "./StatusBadge";

export type InvoiceStatus = "Draft" | "Sent" | "Paid" | "Overdue";

export interface InvoiceProps {
  id: string;
  orderId: string;
  status: InvoiceStatus;
  issueDate: string;
  dueDate: string;
}

export interface InvoiceEditableFields {
  issueDate: string;
  dueDate: string;
}

/** Invoice only stores the orderId reference — amount/customer are derived
 *  by joining with Order in InvoicingService, so Invoice never goes stale
 *  relative to the order it bills. */
export class Invoice extends StatusfulEntity {
  readonly orderId: string;
  private _issueDate: string;
  private _dueDate: string;
  private _status: InvoiceStatus;

  constructor(props: InvoiceProps) {
    super(props.id);
    this.orderId = props.orderId;
    this._issueDate = props.issueDate;
    this._dueDate = props.dueDate;
    this._status = props.status;
  }

  get issueDate(): string {
    return this._issueDate;
  }

  get dueDate(): string {
    return this._dueDate;
  }

  get status(): InvoiceStatus {
    return this._status;
  }

  /** Only a Draft invoice hasn't been sent to the customer yet, so only then can its dates still change. */
  get canEdit(): boolean {
    return this._status === "Draft";
  }

  markPaid(): void {
    this._status = "Paid";
  }

  send(): void {
    if (this._status === "Draft") this._status = "Sent";
  }

  update(patch: Partial<InvoiceEditableFields>): void {
    if (!this.canEdit) return;
    if (patch.issueDate !== undefined) this._issueDate = patch.issueDate;
    if (patch.dueDate !== undefined) this._dueDate = patch.dueDate;
  }
}
