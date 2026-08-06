import { StatusfulEntity } from "./StatusBadge";

export type ShipmentStatus = "Draft" | "Packed" | "Dispatched" | "Delivered";

export interface ShipmentProps {
  id: string;
  orderId: string;
  invoiceId: string | null;
  status: ShipmentStatus;
  date: string;
}

export class Shipment extends StatusfulEntity {
  readonly orderId: string;
  readonly invoiceId: string | null;
  readonly date: string;
  private _status: ShipmentStatus;

  constructor(props: ShipmentProps) {
    super(props.id);
    this.orderId = props.orderId;
    this.invoiceId = props.invoiceId;
    this.date = props.date;
    this._status = props.status;
  }

  get status(): ShipmentStatus {
    return this._status;
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
}
