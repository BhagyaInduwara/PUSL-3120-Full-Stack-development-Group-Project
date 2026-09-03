import { StatusfulEntity } from "./StatusBadge";

export type ShipmentStatus = "Draft" | "Packed" | "Dispatched" | "Delivered";

export interface ShipmentProps {
  id: string;
  /** Human-readable display id, e.g. "2026/08/23/A001" — distinct from `id` (the Mongo ObjectId used for routing/API calls). */
  number: string;
  orderId: string;
  invoiceId: string | null;
  /** The linked invoice's human-readable number, when known (populated by the API) — falls back to invoiceId in invoiceLabel when it isn't. */
  invoiceNumber: string | null;
  status: ShipmentStatus;
  date: string;
}

export interface ShipmentEditableFields {
  date?: string;
  status?: ShipmentStatus;
}

export class Shipment extends StatusfulEntity {
  readonly number: string;
  readonly orderId: string;
  readonly invoiceId: string | null;
  readonly invoiceNumber: string | null;
  private _date: string;
  private _status: ShipmentStatus;

  constructor(props: ShipmentProps) {
    super(props.id);
    this.number = props.number;
    this.orderId = props.orderId;
    this.invoiceId = props.invoiceId;
    this.invoiceNumber = props.invoiceNumber;
    this._date = props.date;
    this._status = props.status;
  }

  get date(): string {
    return this._date;
  }

  get status(): ShipmentStatus {
    return this._status;
  }

  /** Delivered shipments are finalized and cannot be modified. */
  get canEdit(): boolean {
    return this._status !== "Delivered";
  }

  get invoiceLabel(): string {
    return this.invoiceNumber ?? this.invoiceId ?? "—";
  }

  pack(): void {
    this._status = "Packed";
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
    if (patch.status !== undefined) this._status = patch.status;
  }
}
