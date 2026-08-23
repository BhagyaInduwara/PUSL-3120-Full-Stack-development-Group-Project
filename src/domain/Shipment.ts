import { StatusfulEntity } from "./StatusBadge";

export type ShipmentStatus = "Draft" | "Packed" | "Dispatched" | "Delivered";

export interface ShipmentProps {
  id: string;
  /** Human-readable display id, e.g. "2026/08/23/A001" — distinct from `id` (the Mongo ObjectId used for routing/API calls). */
  number: string;
  orderId: string;
  invoiceId: string | null;
  status: ShipmentStatus;
  date: string;
}

export interface ShipmentEditableFields {
  date: string;
}

export class Shipment extends StatusfulEntity {
  readonly number: string;
  readonly orderId: string;
  readonly invoiceId: string | null;
  private _date: string;
  private _status: ShipmentStatus;

  constructor(props: ShipmentProps) {
    super(props.id);
    this.number = props.number;
    this.orderId = props.orderId;
    this.invoiceId = props.invoiceId;
    this._date = props.date;
    this._status = props.status;
  }

  get date(): string {
    return this._date;
  }

  get status(): ShipmentStatus {
    return this._status;
  }

  /** Only a Draft shipment hasn't been packed yet, so only then can its ship date still move. */
  get canEdit(): boolean {
    return this._status === "Draft";
  }

  get invoiceLabel(): string {
    return this.invoiceId ?? "—";
  }

  dispatch(): void {
    this._status = "Dispatched";
  }

  deliver(): void {
    this._status = "Delivered";
  }

  update(patch: Partial<ShipmentEditableFields>): void {
    if (!this.canEdit) return;
    if (patch.date !== undefined) this._date = patch.date;
  }
}
